import {ConnectionEvents, ExternalConnection,} from './external-connection';
import {ServerMessage} from '@api/api';

export class ExternalConnectionWebSocket extends ExternalConnection {
    private socket: WebSocket;

    constructor(url: string) {
        super();
        this.socket = new WebSocket(url);
        this.initSocket();
    }

    private _ready = false;

    get ready(): boolean {
        return this._ready;
    }

    send(data: string | ArrayBufferLike): void {
        if (!this._ready) {
            throw new Error('Cant send data before connection is ready');
        }
        console.debug('WS SENT:', data);
        this.socket.send(data);
    }

    private initSocket() {
        this.socket.onopen = () => {
            this._ready = true;
            this.dispatchEvent<ConnectionEvents.Open>(new Event(ConnectionEvents.Open));
        };
        this.socket.onclose = () => {
            this._ready = false;
            this.dispatchEvent<ConnectionEvents.Open>(new Event(ConnectionEvents.Closed));
        };
        this.socket.onmessage = (message: MessageEvent) => {
            const serverMessage = <ServerMessage>JSON.parse(message.data);

            this.dispatchEvent<ConnectionEvents.Message>(
                new CustomEvent<ServerMessage>(ConnectionEvents.Message, {
                    detail: serverMessage
                })
            );
        }
    }

}
