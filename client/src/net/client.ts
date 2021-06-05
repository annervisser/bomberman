import {ConnectionEvents, ExternalConnection,} from './external-connection/external-connection';
import {AbstractEventTarget} from './external-connection/abstract-event-target';

export enum MessageTypes {
    // webRTC
    SDP = 'SDP',
    ICE_CANDIDATE = 'ICE_CANDIDATE',

    // ROME
    JOINED_ROOM = 'JOINED_ROOM',

    // USER
    REQUEST_JOIN = 'REQUEST_JOIN',
    USER_JOINED = 'USER_JOINED',
    // USER_READY = 'USER_READY',
    USER_LEFT = 'USER_LEFT',
}

type IceCandidateData = {
    peerId: string;
    candidate: RTCIceCandidateInit | RTCIceCandidate;
};

type SdpData = {
    peerId: string;
    sdp: RTCSessionDescriptionInit;
};

export interface MessageRequests {
    [MessageTypes.ICE_CANDIDATE]: IceCandidateData,
    [MessageTypes.SDP]: SdpData,
    [MessageTypes.REQUEST_JOIN]: {
        peerId: string;
        roomName: string;
    },
    [MessageTypes.JOINED_ROOM]: never,
    [MessageTypes.USER_JOINED]: never,
    [MessageTypes.USER_LEFT]: never,
}

export interface MessageResponses {
    [MessageTypes.SDP]: CustomEvent<SdpData>;
    [MessageTypes.ICE_CANDIDATE]: CustomEvent<IceCandidateData>;
    [MessageTypes.JOINED_ROOM]: CustomEvent<{
        roomName: string;
        peerIds: string[];
    }>;
    [MessageTypes.USER_JOINED]: CustomEvent<{
        peerId: string;
    }>;
    [MessageTypes.USER_LEFT]: CustomEvent<{
        peerId: string;
    }>;
    [MessageTypes.REQUEST_JOIN]: never
}

export interface ServerMessage {
    type: MessageTypes,
    data: Record<string, unknown>;
}

export class Client extends AbstractEventTarget<MessageResponses> {
    constructor(private connection: ExternalConnection) {
        super(Object.values(MessageTypes));
        connection.addEventListener(ConnectionEvents.Message, (messageEvent) => {
            console.log('received message:', messageEvent);
            const message = messageEvent.detail;
            if (Client.validateServerEvent(message)) {
                const event = new CustomEvent(message.type, {
                    detail: message.data
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.dispatchEvent<typeof message.type>(<any>event);
            }
        });
    }

    public send<T extends keyof MessageRequests>(type: T, data: MessageRequests[T]): void {
        const request: ServerMessage = {
            type: type,
            data: data
        }
        return this.connection.send(JSON.stringify(request));
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
}
