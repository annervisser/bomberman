export interface CanvasObject {
    x: number;
    y: number;

    visible: boolean;

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void;
}
