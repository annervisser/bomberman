import {AbstractObject} from './abstract-object';
import {Sprites, SpriteStore} from "../graphics/sprite-store";
import {Sprite} from "../graphics/sprite";
import {generateId} from "../util/id";
import {Point} from "../util/point";

export class Player extends AbstractObject {
    private sprite: Sprite;
    public static size = 64;
    public invincible: number | null = null;
    public spawn: Point = [1, 1];
    public readonly id = 'player-' + generateId();

    constructor(x: number, y: number, spriteStore: SpriteStore) {
        super(x, y);
        this.sprite = spriteStore.getSprite(Sprites.SolidBlue);
    }

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        if (this.invincible && this.invincible < new Date().getTime() - 1000) {
            this.invincible = null;
        }
        const a = ctx.globalAlpha;
        ctx.globalAlpha = this.invincible ? 0.5 : 1;
        this.sprite.draw(ctx, this.pos[0], this.pos[1], Player.size, Player.size);
        ctx.globalAlpha = a;
    }
}
