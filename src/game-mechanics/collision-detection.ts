import {AbstractObject, Axis, Point} from "../objects/abstract-object";
import {Player} from "../objects/player";
import {GameMap} from "../objects/game-map";
import {Bomb} from "../objects/bomb";
import {AbstractWall} from "../objects/wall";

/** TODO The whole collision detection needs a lot of cleanup. Having a bbox instead of position and size might help*/
let directionBias: Axis | null = null;

export function correctPositionForCollisions(
    originalPosition: Point,
    newPosition: Point,
    objects: Iterable<AbstractObject>
): Point {
    const collisions = Array.from(objects)
        .filter(wall => isCollision(wall, newPosition));

    if (!collisions.length) {
        return newPosition;
    }

    const xAlreadyCollided = collisions.some(c => isCollisionOnAxis(Axis.X, c, originalPosition));
    const yAlreadyCollided = collisions.some(c => isCollisionOnAxis(Axis.Y, c, originalPosition));

    if (xAlreadyCollided && yAlreadyCollided) {
        // ramming into a corner diagonally (ex: corner: |_ direction: ↙)
        return <Point>[...newPosition].map(v => Math.round(v / 64) * 64);
    }

    let newCollisionAxis;
    if (xAlreadyCollided) {
        newCollisionAxis = Axis.Y;
    } else if (yAlreadyCollided) {
        newCollisionAxis = Axis.X;
    } else if (directionBias !== null) {
        newCollisionAxis = directionBias;
    } else {
        // There is no option but to have SOME sort of bias, we just try our best to avoid this
        newCollisionAxis = Axis.X;
    }

    const alreadyCollidingAxis: Axis = Math.abs(newCollisionAxis - 1);
    const tolerance = 32; // we might consider being more lenient

    const deltaPos = getDistance(originalPosition, newPosition);
    const movingInBothDirections = deltaPos[Axis.X] !== 0 && deltaPos[Axis.Y] !== 0;

    // Switch axis if direction is allowed when tolerant
    const switchCorrectionAxis = !movingInBothDirections && collisions.every(
        c => !isCollisionOnAxis(alreadyCollidingAxis, c, originalPosition, tolerance)
    );
    const axisToCorrect = switchCorrectionAxis ? alreadyCollidingAxis : newCollisionAxis;

    const correctedPosition: Point = [...newPosition];
    correctedPosition[axisToCorrect] = correctAxis(originalPosition, newPosition, collisions, axisToCorrect);

    directionBias = null;
    if (correctedPosition.join() !== newPosition.join()) {
        const deltaPos = getDistance(correctedPosition, originalPosition);
        // Adjust direction bias
        if (deltaPos[Axis.X] !== deltaPos[Axis.Y]) {
            directionBias = deltaPos[Axis.X] > deltaPos[Axis.Y] ? Axis.X : Axis.Y;
        }
    }

    return correctedPosition;
}

export function checkBombCollisions(
    originalPosition: Point,
    newPosition: Point,
    bombs: Iterable<Bomb>
): void {
    const collisions: Bomb[] = [];
    for (const bomb of bombs) {
        // convert tile-based to coordinate based
        const position: Point = [bomb.x * GameMap.TileSize, bomb.y * GameMap.TileSize];
        if (isCollision({position}, newPosition)) {
            collisions.push(bomb);
        } else if (!bomb.playerHasLetGo) {
            bomb.playerHasLetGo = true;
        }
    }

    for (const collision of collisions) {
        if (!collision.playerHasLetGo) {
            continue;
        }
        const deltaPos: Point = getDistance(originalPosition, newPosition);

        const correctionAxis =
            Math.abs(deltaPos[Axis.Y]) > Math.abs(deltaPos[Axis.X]) ? Axis.Y : Axis.X;
        const velocity: Point = [0, 0];
        velocity[correctionAxis] = deltaPos[correctionAxis] > 0 ? -1 : 1;
        collision.velocity = velocity;
    }

}

function getDistance(pointA: Point, pointB: Point): Point {
    return [
        pointA[Axis.X] - pointB[Axis.X],
        pointA[Axis.Y] - pointB[Axis.Y]
    ];
}

function isCollision(object: { position: Point }, position: Point) {
    return isCollisionOnAxis(Axis.X, object, position)
        && isCollisionOnAxis(Axis.Y, object, position);
}

function isCollisionOnAxis(
    axis: Axis,
    object: { position: Point },
    playerPosition: Point,
    tolerance = 0
): boolean {
    return object.position[axis] < playerPosition[axis] + Player.size - tolerance
        && object.position[axis] + GameMap.TileSize - tolerance > playerPosition[axis];
}

function correctAxis(
    originalPlayerLocation: Point,
    newPlayerLocation: Point,
    solidCollisions: AbstractObject[],
    axisToCorrect: Axis): number {
    const [min, max] = getMinMaxPositions(solidCollisions, axisToCorrect);
    const
        moveToNegative = min - Player.size,
        moveToPositive = max + AbstractWall.size;

    const cur = originalPlayerLocation[axisToCorrect];
    let direction = cur - newPlayerLocation[axisToCorrect];
    if (direction === 0) {
        // Move player in direction that is closest to current pos
        direction = Math.abs(cur - moveToNegative) - Math.abs(cur - moveToPositive);
    }

    return direction < 0 ? moveToNegative : moveToPositive;
}

// TODO add switch for min vs max instead of returning both
function getMinMaxPositions(objects: AbstractObject[], axis: Axis): [number, number] {
    // TODO take all collisions into account (or deduce relevant ones?)
    return objects.slice(0, 1)
        .reduce((previousValue, currentValue) => {
            return [
                Math.min(previousValue[0], currentValue.position[axis]),
                Math.max(previousValue[1], currentValue.position[axis])
            ];
        }, [Number.MAX_VALUE, -1]);
}
