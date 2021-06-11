import {Sprites, SpriteStore} from "./graphics/sprite-store";
import {Input} from "./game-mechanics/input";
import {
    BombPlacedEvent,
    CancelEvent,
    EventBus,
    ExplosionEvent,
    GameEvent,
    GameEventType,
    PlayerDeathEvent,
    PlayerMoveEvent
} from "./game-mechanics/events";
import {Player} from "./objects/player";
import * as PlayerMovement from "./game-mechanics/player-movement";
import * as CollisionDetection from "./game-mechanics/collision-detection";
import {GameMap} from "./objects/game-map";
import {Point} from "./util/point";
import {Bomb} from "./objects/bomb";
import {Room} from './net/room';

export class Game {
    private readonly ctx: CanvasRenderingContext2D;

    private readonly eventBus = new EventBus();
    private readonly spriteStore = new SpriteStore();
    private readonly input = new Input(this.eventBus)

    private players = new Map<string, Player>();

    private getPlayer(id: string): Player {
        const player = this.players.get(id);
        if (!player) {
            throw new Error('player with id ' + id + ' not found');
        }
        return player;
    }

    private get currentPlayer(): Player {
        return <Player>this.players.get(this.room.ownID);
    }

    private map = new GameMap(this.eventBus);

    private get size(): Point {
        return [this.ctx.canvas.width, this.ctx.canvas.height];
    }

    constructor(canvas: HTMLCanvasElement, private room: Room) {
        this.ctx = <CanvasRenderingContext2D>canvas.getContext('2d');

        canvas.width = 64 * 21;
        canvas.height = 64 * 11;
        const root = document.documentElement;
        root.style.setProperty('--canvas-width', `${canvas.width}px`)
        root.style.setProperty('--canvas-height', `${canvas.height}px`)

        this.ctx.imageSmoothingEnabled = false; // We want crispy pixels

        this.spriteStore
            .loadSprite(Sprites.Heart)
            .loadSprite(Sprites.SolidBlue)
            .loadAllSprites()
            .then(() => {
                this.setup();
                requestAnimationFrame(this.handleAnimationFrame.bind(this));
            })
            .catch((err) => {
                console.error('sprite loading error', err);
                alert('Error while loading sprites');
            });
    }

    private setup() {
        // this.player = new Player(64, 64, this.spriteStore);

        this.eventBus.subscribe((event) => {
            if (event.playerId === 'current') {
                event.playerId = this.currentPlayer.id;
            }

            if (event.type !== GameEventType.PlayerMove) {
                return;
            }

            if (!event.remote) {
                event.position = CollisionDetection.correctPositionForCollisions(
                    event.originalPosition,
                    event.position,
                    this.map.walls
                );

                if (event.originalPosition.join() === event.position.join()) {
                    throw new CancelEvent();
                }
            }

            this.getPlayer(event.playerId).pos = event.position;
            return event;
        }, -100);

        this.eventBus.subscribe((event) => {
            switch (event.type) {
                case GameEventType.Input:
                    return PlayerMovement.handleInputEvent(event, this.currentPlayer, this.eventBus);
                case GameEventType.PlayerMove:
                    return this.handlePlayerMoveEvent(event);
                case GameEventType.BombPlaced:
                    return this.handleBombPlacedEvent(event);
                case GameEventType.Explosion:
                    return this.handleExplosionEvent(event);
                case GameEventType.PlayerDeath:
                    return this.handlePlayerDeathEvent(event);
            }
        });

        // TODO this crashes when STUN fails
        this.eventBus.subscribe((e) => {
            if (!e.remote && e.type !== GameEventType.Input) {
                console.log('sending message', e)
                this.room.sendMessage(JSON.stringify(e));
            }
        }, 9999);

        this.room.addEventListener('peer_message', (e) => {
            const data = <GameEvent>e.detail;
            console.log('peer message', data);
            data.remote = true;
            this.eventBus.emit(data);
        });

        this.room.addEventListener('user_joined', (e) => {
            this.players.set(e.detail.peer, new Player(64, 64, this.spriteStore, e.detail.peer))
        });

        this.room.addEventListener('user_left', (e) => {
            this.players.delete(e.detail.peer);
        })

        this.room.addEventListener('joined', () => {
            // TODO get starting positions synched between clients
            const playerIds = [this.room.ownID, ...this.room.peerIds];
            playerIds.forEach((peerId) => this.players.set(peerId, new Player(64, 64, this.spriteStore, peerId)));
        })
    }

    private handleExplosionEvent(event: ExplosionEvent) {
        this.map.handleBombExplosion(event)
        this.checkExplosionCollision(event.explosionArea, event.bombId, this.currentPlayer);
        if (event.playerId !== this.currentPlayer.id) {
            throw new CancelEvent();
        }
    }

    private handlePlayerDeathEvent(event: PlayerDeathEvent) {
        const player = this.getPlayer(event.playerId);
        player.invincible = new Date().getTime();
        player.pos = <Point>player.spawn.map((n) => n * GameMap.TileSize);
    }

    private handleBombPlacedEvent(event: BombPlacedEvent) {
        const bombId = event.bombId ?? undefined; // undefined falls back to default generated id
        const bomb = new Bomb(event.position, event.playerId, bombId);
        this.map.addBomb(bomb);
        event.bombId = bomb.id;
    }

    private handlePlayerMoveEvent(event: PlayerMoveEvent) {
        for (const bomb of this.map.getBombs()) {
            switch (bomb.state) {
                case 'fused':
                    CollisionDetection.checkBombCollisions(
                        event.originalPosition,
                        event.position,
                        bomb
                    );
                    break;
                case 'exploding':
                    if (bomb.explosionArea?.length) {
                        this.checkExplosionCollision(
                            bomb.explosionArea,
                            bomb.id,
                            this.currentPlayer
                        );
                    }
                    break;
            }
        }
    }

    public checkExplosionCollision(explosionArea: Point[], bombId: string, player: Player): void {
        for (const explosionPos of explosionArea) {
            if (!player.invincible
                && CollisionDetection.checkExplosionCollision(player, explosionPos)
            ) {
                this.eventBus.emit<PlayerDeathEvent>({
                    type: GameEventType.PlayerDeath,
                    bombId: bombId,
                    playerId: player.id
                });
                break;
            }
        }
    }

    handleAnimationFrame(time: number, prevTime = 0): void {
        try {
            this.draw(time - prevTime);
        } catch (e) {
            if (e instanceof Error) {
                console.error('crash: ', e);
                alert('An error occured: ' + e.toString())
            }
            throw e;
        }
        requestAnimationFrame((t) => this.handleAnimationFrame(t, time));
    }

    private draw(deltaT: number) {
        this.input.emit();
        this.ctx.clearRect(0, 0, ...this.size);
        this.map.draw(this.ctx, deltaT);
        for (const player of this.players.values()) {
            player.draw(this.ctx, deltaT);
        }
    }
}
