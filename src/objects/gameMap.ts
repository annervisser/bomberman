import {AbstractObject, Axis, Point} from "./interfaces/abstractObject";
import {Bomb} from "./bomb";

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
    walls: Array<Wall> = [];
    bombs: Array<Bomb> = [];

    constructor() {
        const size = AbstractWall.size;
        GameMap.getMap()
            .forEach((row, y) => {
                row.forEach((block, x) => {
                    if (!block) return;
                    const w = new block(x * size, y * size);
                    this.walls.push(w);
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
        // TODO this needs cleanup
        const wallsToRemove: Wall[] = [];
        const size = AbstractWall.size;
        ctx.fillStyle = 'orange';
        for (const direction of [-size, size]) {
            for (const axis of [Axis.X, Axis.Y]) {
                const searchPos: Point = [...bomb.position];
                for (let i = 0; i < bomb.range; i++) {
                    searchPos[axis] += direction;
                    const wallAtLocation = this.getWallAtLocation(searchPos);
                    if (wallAtLocation instanceof DestructibleBlock) {
                        wallsToRemove.push(wallAtLocation)
                    } else if (wallAtLocation instanceof SolidWall) {
                        break;
                    }
                    ctx.fillRect(...searchPos, size, size)
                }
            }
        }
        this.walls = this.walls.filter(w => !wallsToRemove.includes(w));
    }

    /**
     * TODO This is ugly and definitely not performant, switch to storing the map indexed by coordinates
     * @param location
     */
    public getWallAtLocation(location: Point): Wall | undefined {
        return this.walls.find(w => w.position.join() === location.join());
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
