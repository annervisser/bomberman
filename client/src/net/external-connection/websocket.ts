import {ConnectionEvents, ExternalConnection,} from './external-connection';
import {ServerMessage} from '../client';

export class ExternalConnectionWebSocket extends ExternalConnection {
    private socket: WebSocket;
    private ready = false;

    constructor(url: string) {
        super();
        this.socket = new WebSocket(url);
        this.initSocket();
    }

    private initSocket() {
        this.socket.onopen = () => {
            this.ready = true;
            this.dispatchEvent<ConnectionEvents.Open>(new Event(ConnectionEvents.Open));
        };
        this.socket.onclose = () => {
            this.ready = false;
            this.dispatchEvent<ConnectionEvents.Open>(new Event(ConnectionEvents.Closed));
        };
        this.socket.onmessage = (message: MessageEvent) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const serverMessage = JSON.parse(message.data);

            console.log('received:', serverMessage);
            this.dispatchEvent<ConnectionEvents.Message>(
                new CustomEvent<ServerMessage>(ConnectionEvents.Message, {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    detail: serverMessage
                })
            );
        }
    }

    send(data: string | ArrayBufferLike): void {
        if (!this.ready) {
            throw new Error('Cant send data before connection is ready');
        }
        console.log('WS SENT:', data);
        this.socket.send(data);
    }

}
