import {Rectangle} from './objects/rectangle';
import {GameData} from './utils/gameData';
import {Sprites} from './utils/spriteStore';
import {Player} from './objects/player';

export class Game {
    private readonly ctx: CanvasRenderingContext2D;
    private rect = new Rectangle(10, 10, 20, 5);
    private gameData: GameData = new GameData();
    private player!: Player;

    private get width(): number {
        return this.ctx.canvas.width;
    }

    private get height(): number {
        return this.ctx.canvas.height;
    }

    private get size(): [number, number] {
        return [this.width, this.height];
    }

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = <CanvasRenderingContext2D>canvas.getContext('2d');

        canvas.width = 1200;
        canvas.height = 900;
        const root = document.documentElement;
        root.style.setProperty('--canvas-width', `${canvas.width}px`)
        root.style.setProperty('--canvas-height', `${canvas.height}px`)

        this.ctx.imageSmoothingEnabled = false; // We want crispy pixels

        this.gameData.spriteStore.loadSprite(Sprites.Heart);

        this.gameData.spriteStore.loadAllSprites()
            .then(() => {
                this.setup();
                requestAnimationFrame(this.handleAnimationFrame.bind(this));
            })
            .catch((err) => {
                console.error('sprite loading error', err);
                alert('Error while loading sprites');
            });
    }

    handleAnimationFrame(time: number, prevTime = 0): void {
        this.draw(time - prevTime);
        requestAnimationFrame((t) => this.handleAnimationFrame(t, time));
    }

    setup(): void {
        this.player = new Player(100, 100, this.gameData);
    }

    draw(deltaT: number): void {
        this.ctx.clearRect(0, 0, ...this.size);
        this.ctx.fillStyle = '#19142B';
        this.ctx.fillRect(0, 0, ...this.size);
        this.rect.draw(this.ctx, deltaT);
        this.player.draw(this.ctx, deltaT);
    }
}
