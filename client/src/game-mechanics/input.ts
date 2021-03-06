import {BaseGameEvent, EventBus, GameEventType} from "./events";

export interface GameInputEvent extends BaseGameEvent {
    type: GameEventType.Input
    pressedKeys: Array<string>;
    // newKeys: Array<string>;
    // liftedKeys: Array<string>;
}

const reservedKeys = [
    'keyW',
    'keyA',
    'keyS',
    'keyD',
    'Space',
    'AltLeft'
];

export class Input {
    private pressedKeys = new Set<string>();
    private previousEvent: GameInputEvent | null = null;

    constructor(private eventBus: EventBus) {
        document.addEventListener('keydown', (e) => {
            if (reservedKeys.includes(e.code)) {
                e.preventDefault();
            }
            this.pressedKeys.add(e.code);
        }, false);
        document.addEventListener('keyup', (e) => {
            if (reservedKeys.includes(e.code)) {
                e.preventDefault();
            }
            // TODO Does it make sense to delay this until the end of a frame (theoretical: keyup and down between frames)?
            this.pressedKeys.delete(e.code);
        }, false);
        document.addEventListener('blur', () => {
            console.log('blurd');

            this.pressedKeys.clear();
        })
        document.getElementById('canvasEl')?.addEventListener('blur', () => {
            console.log('blur');
            this.pressedKeys.clear();
        })

        eventBus.subscribe((event) => {
            if (event.type === GameEventType.Input) {
                this.previousEvent = event;
            }
        })
    }

    public emit(): void {
        const pressedKeys = Array.from(this.pressedKeys.values());

        if (!pressedKeys.length) {
            return;
        }

        const event: GameInputEvent = {
            type: GameEventType.Input,
            pressedKeys: pressedKeys,
            playerId: 'current'
            // newKeys: pressedKeys.filter((k) => !this.previousEvent?.pressedKeys.includes(k)),
            // liftedKeys: this.previousEvent?.pressedKeys.filter((k) => !pressedKeys.includes(k)) ?? []
        };
        this.eventBus.emit(event)
    }
}
