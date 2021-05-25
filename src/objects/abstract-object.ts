import {Point} from "../util/point";

export enum Axis {
    X = 0,
    Y = 1
}

export abstract class AbstractObject {
    position: Point;

    get x(): number {
        return this.position[Axis.X]
    }

    set x(value: number) {
        this.position[Axis.X] = value
    }

    get y(): number {
        return this.position[Axis.Y]
    }

    set y(value: number) {
        this.position[Axis.Y] = value
    }

    public abstract draw(ctx: CanvasRenderingContext2D, deltaT: number): void;

    protected constructor(...position: Point) {
        this.position = position;
    }
}
