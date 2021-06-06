import {AbstractEventTarget} from './abstract-event-target';
import {ServerMessage} from '@api/api';

export enum ConnectionEvents {
    Open = 'open',
    Closed = 'closed',
    Message = 'message'
}

interface ServerResponses {
    [ConnectionEvents.Open]: Event;
    [ConnectionEvents.Closed]: Event;
    [ConnectionEvents.Message]: CustomEvent<Partial<ServerMessage>>;
}

export abstract class ExternalConnection extends AbstractEventTarget<ServerResponses> {
    protected constructor() {
        super(Object.values(ConnectionEvents));
    }

    abstract send(data: string | ArrayBufferLike): void;
}
