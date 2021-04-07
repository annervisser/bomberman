import {Rectangle} from './objects/rectangle';
import {GameData} from './utils/gameData';
import {Sprites} from './utils/spriteStore';
import {Player} from './objects/player';
import {GameMap} from "./objects/gameMap";

export class Game {
    private readonly ctx: CanvasRenderingContext2D;
    private rect = new Rectangle(10, 10, 20, 5);
    private gameData: GameData = new GameData();
    private player!: Player;
    private pressedKeys = new Set<string>();
    private map = new GameMap();

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

        canvas.width = 64 * 21;
        canvas.height = 64 * 11;
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

        document.addEventListener('keydown', (e) => {
            this.pressedKeys.add(e.code);
        }, false);
        document.addEventListener('keyup', (e) => {
            // TODO Does it make sense to delay this until the end of a frame (theoretical: keyup and down between frames)?
            this.pressedKeys.delete(e.code);
        }, false);
    }

    private readonly keyMap: { [key: string]: (a: number) => void } = {
        'KeyW': (a) => this.player.y -= a,
        'KeyS': (a) => this.player.y += a,
        'KeyA': (a) => this.player.x -= a,
        'KeyD': (a) => this.player.x += a,
    }

    draw(deltaT: number): void {
        this.pressedKeys.forEach((k) => this.keyMap[k]?.(10))

        this.ctx.clearRect(0, 0, ...this.size);
        this.rect.draw(this.ctx, deltaT);

        this.map.walls.forEach(w => w.draw(this.ctx, deltaT));

        this.player.draw(this.ctx, deltaT);
    }
}
