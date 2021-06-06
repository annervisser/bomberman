export enum MessageTypes {
    // webRTC
    'SDP' = 'SDP',
    'ICE_CANDIDATE' = 'ICE_CANDIDATE',

    // ROME
    'JOINED_ROOM' = 'JOINED_ROOM',

    // USER
    'REQUEST_JOIN' = 'REQUEST_JOIN',
    'USER_JOINED' = 'USER_JOINED',
    // USER_READY = 'USER_READY',
    'USER_LEFT' = 'USER_LEFT',
}

declare interface IceCandidateData {
    'peerId': string;
    'candidate': RTCIceCandidateInit | RTCIceCandidate;
}

declare interface SdpData {
    'peerId': string;
    'sdp': RTCSessionDescriptionInit;
}

declare interface RequestJoinData {
    'peerId': string;
    'roomName': string;
}

declare interface JoinedRoomData {
    'peerIds': string[];
    'roomName': string;
}

export declare interface MessageRequests {
    [MessageTypes.ICE_CANDIDATE]: IceCandidateData,
    [MessageTypes.SDP]: SdpData,
    [MessageTypes.REQUEST_JOIN]: RequestJoinData,
    [MessageTypes.JOINED_ROOM]: never,
    [MessageTypes.USER_JOINED]: never,
    [MessageTypes.USER_LEFT]: never,
}

declare interface UserJoinedData {
    'peerId': string;
}

declare interface UserLeftData {
    'peerId': string;
}

export declare interface MessageResponses extends UserJoinedData {
    [MessageTypes.SDP]: SdpData;
    [MessageTypes.ICE_CANDIDATE]: IceCandidateData;
    [MessageTypes.JOINED_ROOM]: JoinedRoomData;
    [MessageTypes.USER_JOINED]: UserJoinedData;
    [MessageTypes.USER_LEFT]: UserLeftData;
    [MessageTypes.REQUEST_JOIN]: never
}

export declare interface ServerMessage {
    type: MessageTypes,
    data: Record<string, unknown>;
}
