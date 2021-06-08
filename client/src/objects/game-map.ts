import {Axis} from "./abstract-object";
import {Bomb} from "./bomb";
import {PositionMap} from "../util/position-map";
import {AbstractWall, DestructibleBlock, SolidWall, Wall, WallType} from "./wall";
import {EventBus, ExplosionEvent, GameEventType} from "../game-mechanics/events";
import {Point} from "../util/point";

export class GameMap {
    public walls = new PositionMap<Wall>();
    public static TileSize = 64;

    private bombs: Map<string, Bomb> = new Map<string, Bomb>();

    public addBomb(bomb: Bomb): void {
        this.bombs.set(bomb.id, bomb);
    }

    public getBombs(): Iterable<Bomb> {
        return this.bombs.values();
    }

    constructor(private eventBus: EventBus) {
        this.generateMap();
    }

    public draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        this.walls.forEach(w => w.draw(ctx, deltaT));
        for (const bomb of this.bombs.values()) {
            switch (bomb.state) {
                case 'fused':
                    if (bomb.velocity) {
                        this.handleBombGliding(bomb, deltaT);
                    }
                    break;
                case 'exploding':
                    if (!bomb.exploded) {
                        this.eventBus.emit<ExplosionEvent>({
                            type: GameEventType.Explosion,
                            explosionArea: bomb.explosionArea,
                            bombId: bomb.id,
                            playerId: 'current'
                        });
                    }
                    this.drawExplodingBombExplosion(bomb, ctx);
                    break;
                case 'expired':
                    this.bombs.delete(bomb.id);
                    continue;
            }
            bomb.draw(ctx, deltaT);
        }
    }

    private handleBombGliding(bomb: Bomb, deltaT: number) {
        if (!bomb.velocity) {
            return;
        }
        const originalPosition = [...bomb.pos];
        const velocity = bomb.velocity;
        bomb.pos = <Point>bomb.pos.map(
            (value, index) => value + velocity[index] * deltaT * .02
        );
        const roundFn = Math.min(...bomb.velocity) < 0 ? Math.floor : Math.ceil;

        const searchPos: Point = <Point>bomb.pos.map(v => roundFn(v));
        const wallAtLocation = this.walls.get(...searchPos);
        if (wallAtLocation) {
            bomb.pos = <Point>originalPosition.map(v => roundFn(v));
            bomb.velocity = null;
        }
    }

    private drawExplodingBombExplosion(bomb: Bomb, ctx: CanvasRenderingContext2D) {
        if (!bomb.exploded) {
            throw new Error('Attempting to draw explosion for non exploded bomb');
        }

        let roundFn = Math.round;
        if (bomb.velocity) {
            roundFn = Math.min(...bomb.velocity) < 0 ? Math.floor : Math.ceil;
        }

        bomb.pos = [
            roundFn(bomb.pos[0]),
            roundFn(bomb.pos[1]),
        ]

        ctx.fillStyle = 'orange';
        bomb.explosionArea.forEach(
            (pos: Point) => ctx.fillRect(pos[0] * 64, pos[1] * 64, 64, 64)
        );
    }

    public handleBombExplosion(event: ExplosionEvent): void {
        const bomb = this.bombs.get(event.bombId);

        if (!bomb) {
            throw new Error('Bomb with bombId ' + event.bombId + ' not found');
        }

        if (bomb.exploded) {
            console.warn('bomb already exploded')
        }

        let firstRun = true;
        bomb.explosionArea = [];

        for (const direction of [-1, 1]) {
            for (const axis of [Axis.X, Axis.Y]) {
                const searchPos: Point = [...bomb.pos];
                for (let i = -firstRun; i < bomb.range; i++) {
                    searchPos[axis] += direction * +!firstRun;
                    firstRun = false;
                    if (this.walls.get(...searchPos) instanceof SolidWall) {
                        break;
                    } else {
                        this.walls.delete(...searchPos);
                    }
                    bomb.explosionArea.push([...searchPos]);
                }
            }
        }

        bomb.exploded = true;
        event.explosionArea = bomb.explosionArea;
    }

    private generateMap() {
        const blockTypeMapping: { [key: string]: WallType } = {
            'H': SolidWall,
            'x': DestructibleBlock
        };

        const map = [
            'HHHHHHHHHHHHHHHHHHHHH',
            'H                   H',
            'H H H H H H H H H H H',
            'Hx x x x x x x x x xH',
            'H H H H H H H H H H H',
            'Hx x x x x x x x x xH',
            'H H H H H H H H H H H',
            'Hx x x x x x x x x xH',
            'H H H H H H H H H H H',
            'H                   H',
            'HHHHHHHHHHHHHHHHHHHHH',
        ];
        const size = AbstractWall.size;
        let y = 0;
        for (const row of map) {
            let x = 0;
            for (const blockType of row) {
                const block = blockTypeMapping[blockType];
                if (block) this.walls.set(x, y, new block(x * size, y * size));
                x++;
            }
            y++;
        }
    }
}
