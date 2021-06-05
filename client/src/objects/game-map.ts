import {Axis} from "./abstract-object";
import {Bomb} from "./bomb";
import {PositionMap} from "../util/position-map";
import {AbstractWall, DestructibleBlock, SolidWall, Wall, WallType} from "./wall";
import {EventBus, ExplosionEvent, GameEventType} from "../game-mechanics/events";
import {Point} from "../util/point";

export class GameMap {
    public walls = new PositionMap<Wall>();
    public static TileSize = 64;

    bombs: Set<Bomb> = new Set<Bomb>();

    constructor(private eventBus: EventBus) {
        this.generateMap();
    }

    public draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        this.walls.forEach(w => w.draw(ctx, deltaT));
        for (const bomb of this.bombs) {
            switch (bomb.state) {
                case 'fused':
                    if (bomb.velocity) {
                        this.handleBombGliding(bomb, deltaT);
                    }
                    break;
                case 'exploding':
                    this.handleExplosion(bomb, ctx);
                    break;
                case 'expired':
                    this.bombs.delete(bomb);
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

    private handleExplosion(bomb: Bomb, ctx: CanvasRenderingContext2D) {
        let roundFn = Math.round;
        if (bomb.velocity) {
            roundFn = Math.min(...bomb.velocity) < 0 ? Math.floor : Math.ceil;
        }

        bomb.pos = [
            roundFn(bomb.pos[0]),
            roundFn(bomb.pos[1]),
        ]

        ctx.fillStyle = 'orange';
        const drawExplosion = (pos: Point) => ctx.fillRect(pos[0] * 64, pos[1] * 64, 64, 64)

        !bomb.exploded
            ? this.getExplosionArea(bomb, drawExplosion) // This callback saves us an extra loop
            : bomb.explosionArea.forEach(drawExplosion);

        this.eventBus.emit<ExplosionEvent>({
            type: GameEventType.Explosion,
            explosionArea: bomb.explosionArea,
            bombId: bomb.id,
            playerId: 'current'
        });
        bomb.exploded = true;
    }

    private getExplosionArea(bomb: Bomb, callback?: (point: Point) => void) {
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
                    callback?.(searchPos)
                }
            }
        }
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
