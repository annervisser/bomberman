import {ExternalConnectionWebSocket} from './external-connection/websocket';
import {ConnectionEvents} from './external-connection/external-connection';
import {Client} from './client';
import {Room} from './room';

export class Net {
    private connectionInput: HTMLInputElement;
    private connectButton: HTMLButtonElement;
    private messageInput: HTMLInputElement;
    private sendButton: HTMLButtonElement;
    private messageOutput: HTMLPreElement;
    private InputTextArea: HTMLTextAreaElement;
    private InputButton: HTMLButtonElement;
    private OutputTextArea: HTMLTextAreaElement;

    constructor() {
        this.connectionInput = <HTMLInputElement>document.getElementById('connectionInput');
        this.connectButton = <HTMLButtonElement>document.getElementById('connectButton');
        this.messageInput = <HTMLInputElement>document.getElementById('messageInput');
        this.sendButton = <HTMLButtonElement>document.getElementById('sendButton');
        this.messageOutput = <HTMLPreElement>document.getElementById('messageOutput');
        this.InputTextArea = <HTMLTextAreaElement>document.getElementById('INPUTTextArea');
        this.InputButton = <HTMLButtonElement>document.getElementById('INPUTButton');
        this.OutputTextArea = <HTMLTextAreaElement>document.getElementById('OUTPUTTextArea');

        const external = new ExternalConnectionWebSocket('ws://localhost:8080');
        let room: Room;
        external.addEventListener(ConnectionEvents.Open, () => {
            const client = new Client(external);
            room = new Room(client);
        })

        this.InputButton.onclick = () => {
            room.sendMessage(this.InputTextArea.value);
            this.InputTextArea.value = '';
        }
    }

}
