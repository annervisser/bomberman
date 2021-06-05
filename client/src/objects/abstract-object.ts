import {Point} from "../util/point";

export enum Axis {
    X = 0,
    Y = 1
}

export abstract class AbstractObject {
    pos: Point;

    get x(): number {
        return this.pos[Axis.X]
    }

    set x(value: number) {
        this.pos[Axis.X] = value
    }

    get y(): number {
        return this.pos[Axis.Y]
    }

    set y(value: number) {
        this.pos[Axis.Y] = value
    }

    public abstract draw(ctx: CanvasRenderingContext2D, deltaT: number): void;

    protected constructor(...position: Point) {
        this.pos = position;
    }
}
