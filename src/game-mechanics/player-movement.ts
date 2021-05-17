import {GameMap} from "../objects/game-map";
import {Point} from "../util/point";
import {BombPlacedEvent, EventBus, GameEventType, PlayerMoveEvent} from "./events";
import {Player} from "../objects/player";
import {GameInputEvent} from "./input";

let bombBlocked = false;

export function handleInputEvent(event: GameInputEvent, player: Player, eventBus: EventBus): void {
    const originalPosition: Point = [...player.position];
    const newPos: Point = [...player.position];

    const keyMap: { [key: string]: (a: number) => void } = {
        'KeyW': (a) => newPos[1] -= a,
        'KeyS': (a) => newPos[1] += a,
        'KeyA': (a) => newPos[0] -= a,
        'KeyD': (a) => newPos[0] += a,
        'Space': () => {
            if (bombBlocked) {
                return;
            }
            bombBlocked = true;
            // TODO handle debouncing better (or dont debounce, but disallow double bombs & limit amount)
            setTimeout(() => bombBlocked = false, 500);
            const size = GameMap.TileSize;
            const bombPos: Point = [
                Math.round(player.x / size),
                Math.round(player.y / size)
            ];
            const event: BombPlacedEvent = {
                type: GameEventType.BombPlaced,
                playerId: 1, // TODO
                position: bombPos
            }
            eventBus.emit(event);
        }
    }

    const speed = 16; // Keep in mind this can't be >= tilesize / 2 with current collision detection
    event.pressedKeys.forEach((k) => keyMap[k]?.(speed))
    if (originalPosition.join() !== newPos.join()) {
        eventBus.emit<PlayerMoveEvent>({
            type: GameEventType.PlayerMove,
            originalPosition: originalPosition,
            position: newPos,
            playerId: 1 // TODO
        });
    }
}
