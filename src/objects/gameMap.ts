import {AbstractObject, Axis, Point} from "./interfaces/abstractObject";
import {Bomb} from "./bomb";
import {PositionMap} from "./positionMap";

export abstract class AbstractWall extends AbstractObject {
    abstract fillStyle: string;
    static readonly size = 64;

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        ctx.fillStyle = this.fillStyle;
        ctx.fillRect(...this.position, AbstractWall.size, AbstractWall.size);
    }

    constructor(x: number, y: number) {
        super(x, y);
    }
}

export class SolidWall extends AbstractWall {
    fillStyle = 'red';
}

export class DestructibleBlock extends AbstractWall {
    fillStyle = 'yellow';
}

export type Wall = SolidWall | DestructibleBlock;
export type WallType = typeof SolidWall | typeof DestructibleBlock;

export class GameMap {
    public walls = new PositionMap<Wall>();
    public static TileSize = 64;

    bombs: Array<Bomb> = [];

    constructor() {
        const size = AbstractWall.size;
        GameMap.getMap()
            .forEach((row, y) => {
                row.forEach((block, x) => {
                    if (!block) return;
                    const w = new block(x * size, y * size);
                    this.walls.set(x, y, w);
                })
            })
    }

    public draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        this.walls.forEach(w => w.draw(ctx, deltaT));
        this.bombs.forEach(b => {
            b.draw(ctx, deltaT);
            if (b.state === 'exploding') {
                this.handleExplosion(b, ctx);
            }
        });
        this.bombs = this.bombs.filter(b => b.state !== 'expired');
    }

    private handleExplosion(bomb: Bomb, ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'orange';
        for (const direction of [-1, 1]) {
            for (const axis of [Axis.X, Axis.Y]) {
                const searchPos: Point = [...bomb.position];
                for (let i = 0; i < bomb.range; i++) {
                    searchPos[axis] += direction;
                    const wallAtLocation = this.walls.get(...searchPos);
                    if (wallAtLocation instanceof DestructibleBlock) {
                        this.walls.delete(...searchPos);
                    } else if (wallAtLocation instanceof SolidWall) {
                        break;
                    }
                    ctx.fillRect(searchPos[0] * 64, searchPos[1] * 64, 64, 64)
                }
            }
        }
    }

    private static getMap() {
        const _ = null;
        const x = DestructibleBlock;
        const H = SolidWall;

        const map: Array<Array<WallType | null>> = [
            [H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H],
            [H, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, H],
            [H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H],
            [H, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, H],
            [H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H],
            [H, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, H],
            [H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H],
            [H, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, H],
            [H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H],
            [H, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, H],
            [H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H],
        ];
        return map;
    }
}
