export class Sprite {
    constructor(
        public image: HTMLImageElement,
        public sx: number,
        public sy: number,
        public sWidth: number,
        public sHeight: number,
    ) {
    }

    draw(ctx: CanvasRenderingContext2D, x: number, y: number, dWidth?: number, dHeight?: number): void {
        const width = dWidth || this.sWidth;
        const height = dHeight || this.sHeight / this.sWidth * width;

        ctx.drawImage(
            this.image,
            this.sx,
            this.sy,
            this.sWidth,
            this.sHeight,
            x,
            y,
            width,
            height
        );
    }
}
