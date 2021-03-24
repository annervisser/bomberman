import {CanvasObject} from './canvasObject';

export abstract class AbstractObject implements CanvasObject {
    visible = true;
    x: number;
    y: number;

    public get position(): [number, number] {
        return [this.x, this.y];
    }

    public set position([x, y]: [number, number]) {
        [this.x, this.y] = [x, y];
    }

    public abstract draw(ctx: CanvasRenderingContext2D, deltaT: number): void;

    protected constructor(x: number, y: number) {
        [this.x, this.y] = [x, y];
    }
}
