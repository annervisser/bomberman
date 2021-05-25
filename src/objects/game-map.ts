import {Axis} from "./abstract-object";
import {Bomb} from "./bomb";
import {PositionMap} from "../util/position-map";
import {AbstractWall, DestructibleBlock, SolidWall, Wall, WallType} from "./wall";
import {EventBus, ExplosionEvent, GameEventType} from "../game-mechanics/events";
import {Point} from "../util/point";

export class GameMap {
    public walls = new PositionMap<Wall>();
    public static TileSize = 64;

    bombs: Set<Bomb> = new Set<Bomb>();
    deaths: Set<string> = new Set<string>();

    constructor(private eventBus: EventBus) {
        const size = AbstractWall.size;
        GameMap.getMap()
            .forEach((row, y) => {
                row.forEach((block, x) => {
                    if (!block) return;
                    const w = new block(x * size, y * size);
                    this.walls.set(x, y, w);
                });
            });
    }

    public draw(ctx: CanvasRenderingContext2D, deltaT: number): void {
        this.walls.forEach(w => w.draw(ctx, deltaT));
        for (const bomb of this.bombs) {
            switch (bomb.state) {
                case 'fused':
                    if (bomb.velocity) {
                        this.handleBombGliding(bomb, deltaT);
                    }
                    break;
                case 'exploding':
                    this.handleExplosion(bomb, ctx);
                    break;
                case 'expired':
                    this.bombs.delete(bomb);
                    continue;
            }
            bomb.draw(ctx, deltaT);
        }
    }

    private handleBombGliding(bomb: Bomb, deltaT: number) {
        if (!bomb.velocity) {
            return;
        }
        const originalPosition = [...bomb.position];
        const velocity = bomb.velocity;
        bomb.position = <Point>bomb.position.map(
            (value, index) => value + velocity[index] * deltaT * .02
        );
        const roundFn = Math.min(...bomb.velocity) < 0 ? Math.floor : Math.ceil;

        const searchPos: Point = <Point>bomb.position.map(v => roundFn(v));
        const wallAtLocation = this.walls.get(...searchPos);
        if (wallAtLocation) {
            bomb.position = <Point>originalPosition.map(v => roundFn(v));
            bomb.velocity = null;
        }
    }

    private handleExplosion(bomb: Bomb, ctx: CanvasRenderingContext2D) {
        let roundFn = Math.round;
        if (bomb.velocity) {
            roundFn = Math.min(...bomb.velocity) < 0 ? Math.floor : Math.ceil;
        }

        bomb.position = [
            roundFn(bomb.position[0]),
            roundFn(bomb.position[1]),
        ]

        ctx.fillStyle = 'orange';
        let firstRun = true;

        for (const direction of [-1, 1]) {
            for (const axis of [Axis.X, Axis.Y]) {
                const searchPos: Point = [...bomb.position];
                for (let i = 0 - +firstRun; i < bomb.range; i++) {
                    searchPos[axis] += direction * +!firstRun;
                    firstRun = false;
                    const wallAtLocation = this.walls.get(...searchPos);
                    if (wallAtLocation instanceof SolidWall) {
                        break;
                    }
                    if (!bomb.exploded) {
                        if (wallAtLocation instanceof DestructibleBlock) {
                            this.walls.delete(...searchPos);
                        }
                        this.eventBus.emit<ExplosionEvent>({
                            type: GameEventType.Explosion,
                            position: searchPos,
                            bombId: bomb.id,
                            playerId: 'current'
                        });
                    }
                    ctx.fillRect(searchPos[0] * 64, searchPos[1] * 64, 64, 64)
                }
            }
        }
        bomb.exploded = true;
    }

    private static getMap() {
        const _ = null;
        const x = DestructibleBlock;
        const H = SolidWall;

        const map: Array<Array<WallType | null>> = [
            [H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H],
            [H, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, H],
            [H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H],
            [H, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, H],
            [H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H],
            [H, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, H],
            [H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H],
            [H, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, _, x, H],
            [H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H, _, H],
            [H, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, H],
            [H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H],
        ];
        return map;
    }
}
