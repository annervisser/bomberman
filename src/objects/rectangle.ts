import {Sizable} from './interfaces/sizable';
import {AbstractObject} from './interfaces/abstractObject';

export class Rectangle extends AbstractObject implements Sizable {
    constructor(
        x: number,
        y: number,
        public width: number,
        public height: number,
    ) {
        super(x, y);
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
        ctx.fillRect(...this.position, ...this.dimensions);
    }
}
