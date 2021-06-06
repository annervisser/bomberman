import {Client} from './client';
import {Peer} from './peer';
import {generateId} from '../util/id';
import {MessageTypes} from '@api/api';
import {AbstractEventTarget} from './external-connection/abstract-event-target';

declare interface RoomEvents {
    'joined': CustomEvent<{ roomName: string, peers: string[] }>;
    'user_joined': CustomEvent<{ peer: string }>;
    'user_left': CustomEvent<{ peer: string }>;
    'peer_message': CustomEvent<any>;
}

export class Room extends AbstractEventTarget<RoomEvents> {
    public ownID = generateId();
    public roomName: string;

    public get peerIds(): string[] {
        return Array.from(this.peers.keys());
    }

    private peers = new Map<string, Peer>();
    private pendingSdp = new Map<string, RTCSessionDescriptionInit>();
    private pendingCandidates = new Map<string, Array<RTCIceCandidateInit | RTCIceCandidate>>();

    constructor(private client: Client, roomName: string) {
        super(['joined', 'user_joined', 'user_left', 'peer_message']);

        this.roomName = roomName;
        this.addEventListeners();
        this.client.send(MessageTypes.REQUEST_JOIN, {
            'peerId': this.ownID,
            'roomName': this.roomName
        });
    }

    private addEventListeners() {
        this.client.addEventListener(MessageTypes.SDP, (event) => {
            const peerId = event.detail['peerId'];
            const sdp = event.detail['sdp'];

            const peer = this.peers.get(peerId);
            if (peer) {
                peer.setSdp(sdp);
            } else {
                console.debug('adding pending sdp');
                this.pendingSdp.set(peerId, sdp);
            }
        });

        this.client.addEventListener(MessageTypes.ICE_CANDIDATE, (event) => {
            const peerId = event.detail['peerId'];
            const candidate = event.detail['candidate'];
            const peer = this.peers.get(peerId);
            if (peer) {
                void peer.addIceCandidate(candidate).catch();
            } else {
                console.debug('adding pending candidate');
                const pendingCandidates = this.pendingCandidates.get(peerId) ?? [];
                pendingCandidates.push(candidate);
                this.pendingCandidates.set(peerId, pendingCandidates);
            }
        });

        this.client.addEventListener(MessageTypes.JOINED_ROOM, (event) => {
            for (const peerId of event.detail['peerIds']) {
                this.initiatePeerConnection(peerId, true);
            }

            this.dispatchEvent<'joined'>(new CustomEvent('joined', {
                detail: {
                    roomName: event.detail['roomName'],
                    peers: event.detail['peerIds']
                }
            }));
        });

        this.client.addEventListener(MessageTypes.USER_JOINED, (event) => {
            const peerId = event.detail['peerId'];
            this.initiatePeerConnection(peerId, false);

            this.dispatchEvent<'user_joined'>(new CustomEvent('user_joined', {
                detail: {
                    peer: event.detail['peerId']
                }
            }));
        })

        this.client.addEventListener(MessageTypes.USER_LEFT, (event) => {
            const peerId = event.detail['peerId'];
            const peer = this.peers.get(peerId);
            peer?.destroy();
            this.peers.delete(peerId);

            this.dispatchEvent<'user_left'>(new CustomEvent('user_left', {
                detail: {
                    peer: event.detail['peerId']
                }
            }));
        })
    }

    private initiatePeerConnection(userId: string, initiator: boolean) {
        const peer = new Peer(initiator, userId);

        peer.addEventListener(
            MessageTypes.SDP,
            e => this.client.send(MessageTypes.SDP, e.detail)
        );

        peer.addEventListener(
            MessageTypes.ICE_CANDIDATE,
            e => this.client.send(MessageTypes.ICE_CANDIDATE, e.detail)
        );

        peer.addEventListener(
            'message',
            (e) => this.dispatchEvent<'peer_message'>(new CustomEvent('peer_message', {
                detail: e.detail
            }))
        )

        const pendingSdp = this.pendingSdp.get(userId);
        if (pendingSdp) {
            peer.setSdp(pendingSdp);
        }

        const pendingCandidates = this.pendingCandidates.get(userId);
        if (pendingCandidates) {
            pendingCandidates.forEach((c) => void peer.addIceCandidate(c));
        }

        this.peers.set(userId, peer);
    }

    sendMessage(message: string): void {
        for (const peer of this.peers.values()) {
            peer.sendMessage(message);
        }
    }
}
