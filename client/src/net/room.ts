import {Client, MessageTypes} from './client';
import {Peer} from './peer';
import {generateId} from '../util/id';

export class Room {
    private peers = new Map<string, Peer>();
    private pendingSdp = new Map<string, RTCSessionDescriptionInit>();
    private pendingCandidates = new Map<string, Array<RTCIceCandidateInit | RTCIceCandidate>>();

    constructor(private client: Client) {
        this.addEventListeners();
        this.client.send(MessageTypes.REQUEST_JOIN, {
            peerId: generateId(),
            roomName: 'room'
        });
    }

    private addEventListeners() {
        this.client.addEventListener(MessageTypes.SDP, (event) => {
            const peerId = event.detail.peerId;
            const sdp = event.detail.sdp;

            const peer = this.peers.get(peerId);
            if (peer) {
                peer.setSdp(sdp);
            } else {
                console.log('adding pending sdp');
                this.pendingSdp.set(peerId, sdp);
            }
        });

        this.client.addEventListener(MessageTypes.ICE_CANDIDATE, (event) => {
            const peerId = event.detail.peerId;
            const candidate = event.detail.candidate;
            const peer = this.peers.get(peerId);
            if (peer) {
                void peer.addIceCandidate(candidate).catch();
            } else {
                console.log('adding pending candidate');
                const pendingCandidates = this.pendingCandidates.get(peerId) ?? [];
                pendingCandidates.push(candidate);
                this.pendingCandidates.set(peerId, pendingCandidates);
            }
        });

        this.client.addEventListener(MessageTypes.JOINED_ROOM, (event) => {
            // TODO emit 'joined' event (internally)
            console.log('joined room %s', event.detail.roomName);
            for (const peerId of event.detail.peerIds) {
                this.initiatePeerConnection(peerId, true);
            }
        });

        this.client.addEventListener(MessageTypes.USER_JOINED, (event) => {
            const peerId = event.detail.peerId;
            console.log('someone joined room: %s', peerId);
            this.initiatePeerConnection(peerId, false);
        })

        this.client.addEventListener(MessageTypes.USER_LEFT, (event) => {
            const peerId = event.detail.peerId;
            const peer = this.peers.get(peerId);
            peer?.destroy();
            this.peers.delete(peerId);
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
