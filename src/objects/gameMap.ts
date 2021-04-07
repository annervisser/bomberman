import {AbstractObject} from "./interfaces/abstractObject";

export abstract class AbstractWall extends AbstractObject {
    abstract destructible = false;
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
    destructible = false;
    fillStyle = 'red';
}

export class DestructibleBlock extends AbstractWall {
    destructible = true;
    fillStyle = 'yellow';
}

type WallType = typeof SolidWall | typeof DestructibleBlock;

export class GameMap {
    walls: Array<SolidWall | DestructibleBlock> = [];

    constructor() {
        const map = GameMap.getMap();

        let x;
        let y = 0;
        const size = AbstractWall.size;
        for (const mapRow of map) {
            x = 0;
            for (const mapBlock of mapRow) {
                if (mapBlock) {
                    const w = new mapBlock(x, y);
                    this.walls.push(w);
                }
                x += size;
            }
            y += size;
        }

    }

    private static getMap() {
        const _ = null;
        const x = DestructibleBlock;
        const H = SolidWall;

        const map: Array<Array<WallType | null>> = [
            [H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H],
            [H, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, H],
            [H, _, H, x, H, x, H, x, H, x, H, x, H, x, H, x, H, x, H, _, H],
            [H, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, H],
            [H, _, H, x, H, x, H, x, H, x, H, x, H, x, H, x, H, x, H, _, H],
            [H, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, H],
            [H, _, H, x, H, x, H, x, H, x, H, x, H, x, H, x, H, x, H, _, H],
            [H, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, H],
            [H, _, H, x, H, x, H, x, H, x, H, x, H, x, H, x, H, x, H, _, H],
            [H, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, H],
            [H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H],
        ];
        return map;
    }
}
