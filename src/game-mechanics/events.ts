import {Point} from "../objects/abstract-object";
import {GameInputEvent} from "./input";

export enum GameEventType {
    PlayerMove = 'playerMove',
    Input = 'input',
    BombPlaced = 'bombPlaced'
}

export type GameEvent = PlayerMoveEvent | BombPlacedEvent | GameInputEvent;

export interface BaseGameEvent {
    id?: number;
    type: GameEventType;
}

export interface PlayerMoveEvent extends BaseGameEvent {
    type: GameEventType.PlayerMove
    playerId: number;
    originalPosition: Point;
    position: Point;
}

export interface BombPlacedEvent extends BaseGameEvent {
    type: GameEventType.BombPlaced
    playerId: number;
    position: Point;
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
        for (const handler of this.handlers) {
            event = handler.handle(event) || event;
        }
    }
}
