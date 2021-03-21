import {AbstractObject} from "./ObjectI";

interface Sizable {
    width: number;
    height: number;
    dimensions: [number, number];
}

export class Rectangle extends AbstractObject implements Sizable {
    height: number;
    width: number;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y);
        this.width = width;
        this.height = height;
    }

    get dimensions(): [number, number] {
        return [this.width, this.height];
    }

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        const velocity = [.02 * deltaT, -.01 * deltaT];
        this.position = [
            this.position[0] + velocity[0],
            this.position[1] + velocity[1]
        ];
        ctx.fillStyle = 'green';
        ctx.fillRect(...this.position, ...this.dimensions)
    }
}