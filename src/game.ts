import {Rectangle} from './objects/rectangle';
import {GameData} from './utils/gameData';
import {Sprites} from './utils/spriteStore';
import {Player} from './objects/player';
import {AbstractWall, DestructibleBlock, GameMap} from "./objects/gameMap";
import {AbstractObject} from "./objects/interfaces/abstractObject";

export enum AxisIndex {
    X = 0,
    Y = 1
}

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
        this.player = new Player(64, 64, this.gameData);

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
        const originalPlayerLocation = this.player.position;

        this.pressedKeys.forEach((k) => this.keyMap[k]?.(10))

        if (originalPlayerLocation.join() !== this.player.position.join()) {
            this.checkCollision(originalPlayerLocation);
        }

        this.ctx.clearRect(0, 0, ...this.size);
        this.rect.draw(this.ctx, deltaT);

        this.map.walls.forEach(w => w.draw(this.ctx, deltaT));

        this.player.draw(this.ctx, deltaT);
    }

    private checkCollision(originalPlayerLocation: [number, number]) {
        const isCollision = (axis: AxisIndex, object: AbstractObject, playerPosition = this.player.position) =>
            object.position[axis] < playerPosition[axis] + this.player.size
            && object.position[axis] + AbstractWall.size > playerPosition[axis];

        const allCollisions = this.map.walls.filter(value => {
            const xCollision = isCollision(AxisIndex.X, value);
            const yCollision = isCollision(AxisIndex.Y, value);
            return xCollision && yCollision;
        });

        const collisions = allCollisions.filter(wall => !(wall instanceof DestructibleBlock));

        // Remove destructible walls on collision
        // TODO remove this when bombs are a thing
        const collisionsWithDestructible = allCollisions.filter(wall => wall instanceof DestructibleBlock);
        this.map.walls = this.map.walls.filter((wall) => !collisionsWithDestructible.includes(wall))

        if (collisions.length) {
            const xAlreadyCollided = collisions.some((c) => isCollision(AxisIndex.X, c, originalPlayerLocation));
            const yAlreadyCollided = collisions.some((c) => isCollision(AxisIndex.Y, c, originalPlayerLocation));

            if (!xAlreadyCollided) {
                const [min, max] = this.getMinMaxPositions(collisions, AxisIndex.X);
                this.player.x = originalPlayerLocation[AxisIndex.X] < this.player.x
                    ? min - AbstractWall.size
                    : max + AbstractWall.size;
            } else if (!yAlreadyCollided) {
                const [min, max] = this.getMinMaxPositions(collisions, AxisIndex.Y);
                this.player.y = originalPlayerLocation[AxisIndex.Y] < this.player.y
                    ? min - AbstractWall.size
                    : max + AbstractWall.size;
            } else {
                this.player.position = originalPlayerLocation;
            }
        }
    }

    private getMinMaxPositions(objects: AbstractObject[], axis: AxisIndex): [number, number] {
        // TODO take all collisions into account (or deduce relevenat ones?)
        return objects.slice(0, 1)
            .reduce((previousValue, currentValue) => {
                return [
                    Math.min(previousValue[0], currentValue.position[axis]),
                    Math.max(previousValue[1], currentValue.position[axis])
                ];
            }, [Number.MAX_VALUE, -1]);
    }
}
