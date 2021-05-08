import {Point} from "./interfaces/abstractObject";

type pointAsScalar = string;

/**
 * A coordinate-based map that allows manipulation based on either position or object
 */
export class PositionMap<T> implements Iterable<T> {

    private objectMap = new Map<T, Set<pointAsScalar>>();
    private xMap = new Map<number, Map<number, T>>();
    // All usages of yMap have been commented out, if we ever need to get all blocks in a row uncomment
    // private yMap = new Map<number, Map<number, T>>();

    public set(x: number, y: number, object: T): this {
        this.objectMap.set(
            object,
            (this.objectMap.get(object) ?? new Set()).add((PositionMap.convertPointToScalar(x, y)))
        );
        this.xMap.set(x, (this.xMap.get(x) ?? new Map<number, T>()).set(y, object));
        // this.yMap.set(y, (this.yMap.get(y) ?? new Map<number, T>()).set(x, object));
        return this;
    }

    public get(x: number, y: number): T | undefined {
        const xMapMap = this.xMap.get(x);
        return xMapMap?.get(y);
    }

    public has(x: number, y: number): boolean {
        const xMapMap = this.xMap.get(x);
        return xMapMap?.has(y) || false;
    }

    public delete(x: number, y: number): boolean {
        const xMapMap = this.xMap.get(x);
        const object: T | undefined = xMapMap?.get(y);

        if (object === undefined) {
            return false;
        }

        // const yMapMap = this.yMap.get(y);
        const objectPointSet = this.objectMap.get(object);

        if (!xMapMap /*|| !yMapMap*/ || !objectPointSet) {
            throw new Error('maps should be defined if object exists')
        }

        let deleted = true;
        deleted = xMapMap.delete(y) && deleted;
        // deleted = yMapMap.delete(x) && deleted;
        deleted = objectPointSet.delete(PositionMap.convertPointToScalar(x, y)) && deleted;

        if (xMapMap.size < 1) {
            this.xMap.delete(x);
        }
        // if (yMapMap.size < 1) {
        //     this.yMap.delete(y);
        // }
        if (objectPointSet.size < 1) {
            this.objectMap.delete(object);
        }

        if (!deleted) {
            throw new Error('One of the deletes didn\'t return true');
        }

        return true;
    }

    public deleteObject(object: T): boolean {
        const positionSet = this.objectMap.get(object);
        if (!positionSet) {
            return false;
        }

        let deleted = true;
        for (const position of Array.from(positionSet)) {
            const [x, y] = PositionMap.convertScalarToPoint(position);
            deleted = this.delete(x, y) && deleted;
        }

        if (!deleted) {
            throw new Error('One of the deletes didn\'t return true');
        }

        return true;
    }

    private static convertPointToScalar(...[x, y]: Point): pointAsScalar {
        return `${x},${y}`;
    }

    private static convertScalarToPoint(scalar: pointAsScalar): Point {
        return <Point>scalar
            .split(',', 2)
            .map(v => Number.parseInt(v, 10));
    }

    [Symbol.iterator](): Iterator<T> {
        return this.objectMap.keys();
    }

    public forEach(callback: (value: T, key?: Point) => void): void {
        if (callback.length <= 1) {
            for (const key of this.objectMap.keys()) {
                callback(key);
            }
        } else {
            for (const [point, object] of this.entries()) {
                callback(object, point);
            }
        }
    }

    /**
     * @deprecated This really shouldn't be used until it's converted to an actual iterator
     */
    public entries(): Iterable<[Point, T]> {
        const entries = Array.from(this.xMap.entries())
            .map(([x, yMap]) => {
                const yMapEntries: Array<[number, T]> = Array.from(yMap.entries());
                const entriesForThisX: Array<[Point, T]> = yMapEntries.map(([y, object]) => [[x, y], object]);
                return entriesForThisX;
            });
        return ([] as Array<[Point, T]>).concat(...entries);
    }
}
