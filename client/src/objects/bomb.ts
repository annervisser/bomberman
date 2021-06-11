import {AbstractObject} from "./abstract-object";
import {GameMap} from "./game-map";
import {generateId} from "../util/id";
import {Point} from "../util/point";

export class Bomb extends AbstractObject {
    public static fuseTime = 1200;
    public static explosionTime = 400;

    public readonly id: string;
    public readonly playerId: string;
    public timer = Bomb.fuseTime;
    public range = 3;
    // TODO keep track of this per player
    public playerHasLetGo = false; // we dont want to push bombs until we've "untouched" them
    public velocity: Point | null = null;
    public exploded = false;
    public explosionArea: Point[] = [];

    constructor(position: Point, playerId: string, bombId = 'bomb-' + generateId()) {
        super(...position);
        this.playerId = playerId;
        this.id = bombId;
    }

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        this.timer -= deltaT;
        ctx.fillStyle = 'green';
        ctx.beginPath();
        const drawPosX = this.pos[0] * GameMap.TileSize + GameMap.TileSize / 2;
        const drawPosY = this.pos[1] * GameMap.TileSize + GameMap.TileSize / 2;
        ctx.arc(drawPosX, drawPosY, GameMap.TileSize / 2, 0, 2 * Math.PI);
        ctx.fill();
    }

    get state(): 'fused' | 'exploding' | 'expired' {
        if (this.timer > 0 && !this.exploded) {
            return 'fused';
        }

        if (this.timer > -Bomb.explosionTime) {
            return 'exploding';
        }

        return 'expired';
    }

}
