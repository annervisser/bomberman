import {Rectangle} from "./objects/rectangle";

export class Game {
    private readonly ctx: CanvasRenderingContext2D;
    private rect = new Rectangle(10, 10, 20, 5);

    private get width(): number {
        return this.ctx.canvas.width
    }

    private get height(): number {
        return this.ctx.canvas.height;
    }

    private get size(): [number, number] {
        return [this.width, this.height];
    }

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
        console.log('game constructor');


        requestAnimationFrame(this.handleAnimationFrame.bind(this));
    }

    handleAnimationFrame(time: number, prevTime: number = 0) {
        this.draw(time - prevTime);
        requestAnimationFrame((t) => this.handleAnimationFrame(t, time));
    }

    draw(deltaT: number) {
        this.ctx.clearRect(0, 0, ...this.size);
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(0, 0, ...this.size)
        this.rect.draw(this.ctx, deltaT);
    }
}