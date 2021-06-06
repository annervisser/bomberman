interface CustomEventListener<D> {
    (evt: D): void;
}

interface CustomerEventListenerObject<D> {
    handleEvent: CustomEventListener<D>
}

type EventListener<D> =
    | CustomEventListener<D>
    | CustomerEventListenerObject<D>;

export type KeyOf<T> = Exclude<keyof T, number | symbol>;
export type ValueOf<T> = T[keyof T];

export abstract class AbstractEventTarget<Events extends Record<possibleKeys, Event>, possibleKeys extends keyof Events = keyof Events> implements EventTarget {
    private eventListeners = new Map<keyof Events, EventListener<ValueOf<Events>>[]>();

    protected constructor(protected allowedTypes: (keyof Events)[]) {
    }

    private isAllowedType = (type: string): type is KeyOf<Events> => this.allowedTypes.includes(type as keyof Events);

    addEventListener<K extends KeyOf<Events>>(type: K, listener: EventListener<Events[K]> | null): void {
        if (!listener) {
            return;
        }
        const listeners = this.eventListeners.get(type) ?? [];
        listeners.push(<EventListener<ValueOf<Events>>>listener);
        this.eventListeners.set(type, listeners);
    }

    // TODO this doesnt type check that event.type === T
    dispatchEvent<T extends KeyOf<Events> = never>(event: Events[T]): boolean {
        if (!this.isAllowedType(event.type)) {
            throw new Error('Invalid event type dispatched');
        }
        console.debug(
            '%s: %s',
            this.constructor.name.toUpperCase(),
            event.type,
            event instanceof CustomEvent ? event.detail : undefined
        );
        const listeners = this.eventListeners.get(event.type) ?? [];
        for (const listener of listeners) {
            typeof listener === 'function'
                ? listener(event)
                : listener.handleEvent(event);
        }
        return event.defaultPrevented;
    }

    removeEventListener<K extends KeyOf<Events>>(type: K, callback: EventListener<Events[K]> | null): void {
        const listeners = this.eventListeners.get(type);
        if (!listeners || !callback) {
            return;
        }
        const callbackIndex = listeners.indexOf(<EventListener<ValueOf<Events>>>callback);
        if (callbackIndex > -1) {
            listeners.splice(callbackIndex, 1);
        }
    }

    destroy(): void {
        this.eventListeners.clear();
        this.allowedTypes = [];
    }
}
