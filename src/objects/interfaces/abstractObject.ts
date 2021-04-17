import {CanvasObject} from './canvasObject';

export type Point = [number, number];

export enum Axis {
    X = 0,
    Y = 1
}

export abstract class AbstractObject implements CanvasObject {
    visible = true;
    x: number;
    y: number;

    public get position(): Point {
        return [this.x, this.y];
    }

    public set position([x, y]: Point) {
        [this.x, this.y] = [x, y];
    }

    public setPositionOnAxis(axis: Axis, value: number): void {
        const pos = this.position;
        pos[axis] = value;
        this.position = pos;
    }

    public abstract draw(ctx: CanvasRenderingContext2D, deltaT: number): void;

    protected constructor(...[x, y]: Point) {
        [this.x, this.y] = [x, y];
    }
}
