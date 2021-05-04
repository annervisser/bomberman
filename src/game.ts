import {GameData} from './utils/gameData';
import {Sprites} from './utils/spriteStore';
import {Player} from './objects/player';
import {AbstractWall, DestructibleBlock, GameMap, SolidWall} from "./objects/gameMap";
import {AbstractObject, Axis, Point} from "./objects/interfaces/abstractObject";
import {Bomb} from "./objects/bomb";

export class Game {
    private readonly ctx: CanvasRenderingContext2D;
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
        this.gameData.spriteStore.loadSprite(Sprites.SolidBlue);

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
        try {
            this.draw(time - prevTime);
        } catch (e) {
            if (e instanceof Error) {
                alert('An error occured: ' + e.toString())
            }
            throw e;
        }
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
        'Space': () => {
            if (this.bombBlocked) {
                return;
            }
            this.bombBlocked = true;
            // TODO handle debouncing better (or dont debounce, but disallow double bombs & limit amount)
            setTimeout(() => this.bombBlocked = false, 500);
            const size = AbstractWall.size;
            const bombPos: Point = [
                Math.round(this.player.x / size) * size,
                Math.round(this.player.y / size) * size
            ];
            this.map.bombs.push(new Bomb(bombPos));
        }
    }

    private bombBlocked = false;

    private direction: Axis | null = null;

    draw(deltaT: number): void {
        const originalPlayerLocation = this.player.position;

        this.pressedKeys.forEach((k) => this.keyMap[k]?.(10))

        if (originalPlayerLocation.join() !== this.player.position.join()) {
            this.checkCollision(originalPlayerLocation);
        }

        this.direction = null;

        // If we've still moved, AFTER collision detection
        if (originalPlayerLocation.join() !== this.player.position.join()) {
            const xMovement = Math.abs(this.player.x - originalPlayerLocation[Axis.X]);
            const yMovement = Math.abs(this.player.y - originalPlayerLocation[Axis.Y]);
            if (xMovement !== yMovement) {
                this.direction = xMovement > yMovement ? Axis.X : Axis.Y;
            }
        }

        this.ctx.clearRect(0, 0, ...this.size);
        this.map.draw(this.ctx, deltaT)
        this.player.draw(this.ctx, deltaT);
    }

    /** TODO The whole collision detection needs a lot of cleanup. Having a bbox instead of position and size might help*/
    private checkCollision(originalPlayerLocation: [number, number]) {
        const collisions = this.map.walls
            .filter(wall => !(wall instanceof DestructibleBlock))
            .filter(wall => this.isCollision(Axis.X, wall) && this.isCollision(Axis.Y, wall));

        if (collisions.length) {
            this.correctPositionForCollisions(originalPlayerLocation, collisions);
        }
    }

    private isCollision(
        axis: Axis,
        object: AbstractObject,
        playerPosition = this.player.position,
        tolerance = 0
    ) {
        return object.position[axis] < playerPosition[axis] + Player.size - tolerance
            && object.position[axis] + AbstractWall.size - tolerance > playerPosition[axis];
    }

    private correctPositionForCollisions(originalPlayerLocation: Point, solidCollisions: SolidWall[]) {
        const xAlreadyCollided = solidCollisions.some(c => this.isCollision(Axis.X, c, originalPlayerLocation));
        const yAlreadyCollided = solidCollisions.some(c => this.isCollision(Axis.Y, c, originalPlayerLocation));

        if (xAlreadyCollided && yAlreadyCollided) {
            // ramming into a corner diagonally (ex: corner: |_ direction: ↙)
            this.player.position = originalPlayerLocation;
            return;
        }

        let newCollisionAxis;
        if (xAlreadyCollided) {
            newCollisionAxis = Axis.Y;
        } else if (yAlreadyCollided) {
            newCollisionAxis = Axis.X;
        } else if (this.direction !== null) {
            newCollisionAxis = this.direction;
        } else {
            // There is no option but to have SOME sort of bias, we just try our best to avoid this
            newCollisionAxis = Axis.X;
        }

        const alreadyCollidingAxis: Axis = Math.abs(newCollisionAxis - 1);
        const tolerance = 32; // we might consider being more lenient

        const movingInBothDirections = originalPlayerLocation[Axis.X] !== this.player.x && originalPlayerLocation[Axis.Y] !== this.player.y;

        // Switch axis if direction is allowed when tolerant
        const switchCorrectionAxis = !movingInBothDirections && solidCollisions.every(
            c => !this.isCollision(alreadyCollidingAxis, c, originalPlayerLocation, tolerance)
        );
        const axisToCorrect = switchCorrectionAxis ? alreadyCollidingAxis : newCollisionAxis;
        this.correctAxis(originalPlayerLocation, solidCollisions, axisToCorrect);
    }

    private correctAxis(originalPlayerLocation: Point, solidCollisions: SolidWall[], axisToCorrect: Axis) {
        const [min, max] = this.getMinMaxPositions(solidCollisions, axisToCorrect);
        const [moveToNegative, moveToPositive] = [min - Player.size, max + AbstractWall.size];

        const cur = originalPlayerLocation[axisToCorrect];
        let direction = cur - this.player.position[axisToCorrect];
        if (direction === 0) {
            // Move player in direction that is closest to current pos
            direction = Math.abs(cur - moveToNegative) - Math.abs(cur - moveToPositive);
        }

        this.player.setPositionOnAxis(axisToCorrect, direction < 0 ? moveToNegative : moveToPositive);
    }

    private getMinMaxPositions(objects: AbstractObject[], axis: Axis): [number, number] {
        // TODO take all collisions into account (or deduce relevant ones?)
        return objects.slice(0, 1)
            .reduce((previousValue, currentValue) => {
                return [
                    Math.min(previousValue[0], currentValue.position[axis]),
                    Math.max(previousValue[1], currentValue.position[axis])
                ];
            }, [Number.MAX_VALUE, -1]);
    }
}
