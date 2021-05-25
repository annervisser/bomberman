import {AbstractObject} from "./abstract-object";
import {GameMap} from "./game-map";
import {generateId} from "../util/id";
import {Point} from "../util/point";

export class Bomb extends AbstractObject {
    public static fuseTime = 1200;
    public static explosionTime = 400;

    public readonly id = 'bomb-' + generateId();
    public timer = Bomb.fuseTime;
    public range = 3;
    public playerHasLetGo = false; // we dont want to push bombs until we've "untouched" them
    public velocity: Point | null = null;
    public exploded = false;

    constructor(position: Point) {
        super(...position);
    }

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        this.timer -= deltaT;
        ctx.fillStyle = 'green';
        ctx.beginPath();
        const drawPosX = this.position[0] * GameMap.TileSize + GameMap.TileSize / 2;
        const drawPosY = this.position[1] * GameMap.TileSize + GameMap.TileSize / 2;
        ctx.arc(drawPosX, drawPosY, GameMap.TileSize / 2, 0, 2 * Math.PI);
        ctx.fill();
    }

    get state(): 'fused' | 'exploding' | 'expired' {
        if (this.timer > 0) {
            return 'fused';
        }

        if (this.timer > -Bomb.explosionTime) {
            return 'exploding';
        }

        return 'expired';
    }

}
