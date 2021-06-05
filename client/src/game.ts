import {Sprites, SpriteStore} from "./graphics/sprite-store";
import {Input} from "./game-mechanics/input";
import {EventBus, GameEventType, PlayerDeathEvent} from "./game-mechanics/events";
import {Player} from "./objects/player";
import * as PlayerMovement from "./game-mechanics/player-movement";
import * as CollisionDetection from "./game-mechanics/collision-detection";
import {GameMap} from "./objects/game-map";
import {Point} from "./util/point";
import {Bomb} from "./objects/bomb";

export class Game {
    private readonly ctx: CanvasRenderingContext2D;

    private readonly eventBus = new EventBus();
    private readonly spriteStore = new SpriteStore();
    private readonly input = new Input(this.eventBus)

    private player!: Player;
    private map = new GameMap(this.eventBus);

    private get size(): Point {
        return [this.ctx.canvas.width, this.ctx.canvas.height];
    }

    constructor(canvas: HTMLCanvasElement) {
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
        this.player = new Player(64, 64, this.spriteStore)

        this.eventBus.subscribe((event) => {
            if ('playerId' in event && event.playerId === 'current') {
                event.playerId = this.player.id;
            }

            if (event.type !== GameEventType.PlayerMove) {
                return;
            }
            event.position = CollisionDetection.correctPositionForCollisions(
                event.originalPosition,
                event.position,
                this.map.walls
            );
            this.player.pos = event.position;
            return event;
        }, -100);

        this.eventBus.subscribe((event) => {
            switch (event.type) {
                case GameEventType.Input:
                    PlayerMovement.handleInputEvent(event, this.player, this.eventBus);
                    break;
                case GameEventType.PlayerMove:
                    for (const bomb of this.map.bombs.values()) {
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
                                        this.player.id
                                    );
                                }
                                break;
                        }
                    }
                    break;
                case GameEventType.BombPlaced:
                    this.map.bombs.add(new Bomb(event.position));
                    break;
                case GameEventType.Explosion:
                    this.checkExplosionCollision(event.explosionArea, event.bombId, event.playerId);
                    break;
                case GameEventType.PlayerDeath:
                    this.player.invincible = new Date().getTime();
                    this.player.pos = <Point>this.player.spawn.map((n) => n * GameMap.TileSize);
                    break;

            }
        });
    }

    public checkExplosionCollision(explosionArea: Point[], bombId: string, playerId: string): void {
        for (const explosionPos of explosionArea) {
            if (!this.player.invincible
                && CollisionDetection.checkExplosionCollision(this.player, explosionPos)
            ) {
                this.eventBus.emit<PlayerDeathEvent>({
                    type: GameEventType.PlayerDeath,
                    bombId: bombId,
                    playerId: playerId
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
        this.player.draw(this.ctx, deltaT);
    }
}
