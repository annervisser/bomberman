import {AbstractObject} from './abstract-object';
import {Sprites, SpriteStore} from "../graphics/sprite-store";
import {Sprite} from "../graphics/sprite";

export class Player extends AbstractObject {
    private sprite: Sprite;
    public static size = 64;

    constructor(x: number, y: number, spriteStore: SpriteStore) {
        super(x, y);
        this.sprite = spriteStore.getSprite(Sprites.SolidBlue);
    }

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        this.sprite.draw(ctx, this.position[0], this.position[1], Player.size, Player.size);
    }
}
