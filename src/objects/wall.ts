import {AbstractObject} from "./abstract-object";

export abstract class AbstractWall extends AbstractObject {
    abstract fillStyle: string;
    static readonly size = 64;

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        ctx.fillStyle = this.fillStyle;
        ctx.fillRect(this.position[0], this.position[1], AbstractWall.size, AbstractWall.size);
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
