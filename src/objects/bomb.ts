import {AbstractObject, Point} from "./interfaces/abstractObject";
import {GameMap} from "./gameMap";

export class Bomb extends AbstractObject {
    public static fuseTime = 600;
    public static explosionTime = 400;

    public timer = Bomb.fuseTime;
    public range = 3;

    constructor(position: Point) {
        super(...position);
    }

    draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        if (this.state === 'expired') {
            return;
        }
        this.timer -= deltaT;
        ctx.fillStyle = 'green';
        ctx.beginPath();
        const drawPos: [number, number] = [
            this.position[0] * GameMap.TileSize + GameMap.TileSize / 2,
            this.position[1] * GameMap.TileSize + GameMap.TileSize / 2,
        ];
        ctx.arc(...drawPos, GameMap.TileSize / 2, 0, 2 * Math.PI);
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
