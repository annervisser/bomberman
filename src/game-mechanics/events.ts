import {GameInputEvent} from "./input";
import {generateId} from "../util/id";
import {Point} from "../util/point";

export enum GameEventType {
    PlayerMove = 'playerMove',
    Input = 'input',
    BombPlaced = 'bombPlaced',
    Explosion = 'explosion',
    PlayerDeath = 'playerDeath',
}

export type GameEvent =
    | PlayerMoveEvent
    | BombPlacedEvent
    | GameInputEvent
    | ExplosionEvent
    | PlayerDeathEvent;

export interface BaseGameEvent {
    id?: string;
    type: GameEventType;
}

export interface PlayerMoveEvent extends BaseGameEvent {
    type: GameEventType.PlayerMove
    playerId: string | 'current';
    originalPosition: Point;
    position: Point;
}

export interface BombPlacedEvent extends BaseGameEvent {
    type: GameEventType.BombPlaced
    playerId: string | 'current';
    position: Point;
}

export interface ExplosionEvent extends BaseGameEvent {
    type: GameEventType.Explosion
    bombId: string;
    playerId: string | 'current';
    position: Point;
}

export interface PlayerDeathEvent extends BaseGameEvent {
    type: GameEventType.PlayerDeath
    bombId: string;
    playerId: string | 'current';
}

export type EventHandlerFn<T extends GameEvent> = (event: T) => T | void;

interface EventHandler<T extends GameEvent> {
    handle: EventHandlerFn<T>;
    priority: number;
}

export class EventBus {
    private eventCounter = 0;
    // private subscriptions = new Map<number, EventHandler<GameEvent>>();
    private handlers: Array<EventHandler<GameEvent>> = [];

    public subscribe(handlerFn: EventHandlerFn<GameEvent>, priority = 0): number {
        const handler: EventHandler<GameEvent> = {
            handle: handlerFn,
            priority: priority
        };

        // this.subscriptions.set(this.eventCounter, handler);
        this.handlers.push(handler);
        this.handlers.sort((a, b) => a.priority - b.priority);
        return this.eventCounter++;
    }

    // public unsubscribe(subscriptionId: number): boolean {
    //     const subscription = this.subscriptions.get(subscriptionId);
    //     if (subscription === undefined) {
    //         throw new Error('Trying to unsubscribe non-existent subscription')
    //     }
    //     // This leaves us with a sparse array, which is fine
    //     delete this.handlers[this.handlers.indexOf(subscription)];
    //     return this.subscriptions.delete(subscriptionId);
    // }

    public emit<T extends GameEvent>(newEvent: T): void {
        let event: GameEvent = newEvent;
        event.id = event.id ?? 'event-' + generateId();
        for (const handler of this.handlers) {
            event = handler.handle(event) || event;
        }
    }
}
