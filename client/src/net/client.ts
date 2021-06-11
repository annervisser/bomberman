import {ConnectionEvents, ExternalConnection,} from './external-connection/external-connection';
import {AbstractEventTarget} from './external-connection/abstract-event-target';
import {MessageRequests, MessageResponses, MessageTypes, ServerMessage} from '@api/api';

export type WrappedInEvent<T extends Record<string, any>> = {
    [key in keyof T]: CustomEvent<T[key]>;
}

export class Client extends AbstractEventTarget<WrappedInEvent<MessageResponses>> {
    constructor(private connection: ExternalConnection) {
        super(Object.values(MessageTypes));
        connection.addEventListener(ConnectionEvents.Message, (messageEvent) => {
            const message = messageEvent.detail;
            if (Client.validateServerEvent(message)) {
                const event = new CustomEvent(message.type, {
                    detail: message.data
                })
                this.dispatchEvent<typeof message.type>(<any>event);
            }
        });
    }

    get ready(): boolean {
        return this.connection.ready;
    }

    private static validateServerEvent(message: Partial<ServerMessage>): message is ServerMessage {
        if (!message.type || !Object.values(MessageTypes).includes(message.type)) {
            throw new Error('No or invalid event type');
        }

        if (message.data === undefined) {
            throw new Error('No data');
        }

        return true;
    }

    public send<T extends keyof MessageRequests>(type: T, data: MessageRequests[T]): void {
        const request: ServerMessage = {
            'type': type,
            'data': <Record<string, unknown>><unknown>data
        }
        return this.connection.send(JSON.stringify(request));
    }
}
