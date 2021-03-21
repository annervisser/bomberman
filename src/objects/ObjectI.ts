export interface ObjectI {
    x: number;
    y: number;

    visible: boolean;

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void;
}

export abstract class AbstractObject implements ObjectI {
    visible: boolean = true;
    x: number;
    y: number;

    public get position(): [number, number] {
        return [this.x, this.y]
    }

    public set position([x, y]: [number, number]) {
        [this.x, this.y] = [x, y];
    }

    public abstract draw(ctx: CanvasRenderingContext2D, deltaT: number): void

    protected constructor(x: number, y: number) {
        [this.x, this.y] = [x, y];
    }
}