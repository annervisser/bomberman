import {AbstractObject, Point} from './interfaces/abstractObject';
import {GameData} from '../utils/gameData';
import {Sprites} from '../utils/spriteStore';
import {Sprite} from '../utils/image';

export class Player extends AbstractObject {
    private sprite: Sprite;
    public static size = 64;

    public get dimensions(): Point {
        return [Player.size, Player.size];
    }

    constructor(x: number, y: number, gameData: GameData) {
        super(x, y);
        this.sprite = gameData.spriteStore.getSprite(Sprites.SolidBlue);
    }

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        this.sprite.draw(ctx, ...this.position, ...this.dimensions);
    }
}
