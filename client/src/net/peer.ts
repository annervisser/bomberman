import {NetConfig} from './config';
import {WrappedInEvent} from './client';
import {MessageResponses, MessageTypes} from '@api/api';
import {AbstractEventTarget} from './external-connection/abstract-event-target';

type serverEvents = Pick<WrappedInEvent<MessageResponses>, MessageTypes.SDP | MessageTypes.ICE_CANDIDATE>;
type peerEvents = {
    'message': CustomEvent
};

export class Peer extends AbstractEventTarget<serverEvents & peerEvents> {
    private readonly peerConnection: RTCPeerConnection;
    private dataChannel: RTCDataChannel | null = null;

    private pendingCandidates: Array<RTCIceCandidateInit | RTCIceCandidate> = [];

    constructor(private readonly initiator: boolean, private readonly id: string) {
        super([MessageTypes.SDP, MessageTypes.ICE_CANDIDATE, 'message']);
        this.peerConnection = this.createPeerConnection();
        if (initiator) {
            const dataChannel = this.createDataChannel();
            this.openDataChannel(dataChannel);
            this.initiateConnection();
        }
    }

    setSdp(sdp: RTCSessionDescriptionInit): void {
        const rsd = new RTCSessionDescription(sdp);
        this.peerConnection.setRemoteDescription(rsd)
            .then(() => {
                this.debugLogger('Set remote description from SDP');
                return Promise.all(
                    this.pendingCandidates.map((c) => this.addIceCandidate(c))
                );
            })
            .then(() => {
                if (!this.initiator) {
                    this.initiateConnection();
                }
            })
            .catch(this.errorLogger('setSdp'));

    }

    async addIceCandidate(candidate: RTCIceCandidateInit | RTCIceCandidate): Promise<void> {
        if (!this.peerConnection.remoteDescription) {
            this.pendingCandidates.push(candidate);
        }
        try {
            await this.peerConnection.addIceCandidate(candidate);
            this.debugLogger('Added ICE candidate:', candidate.candidate);
        } catch (e) {
            this.errorLogger('addRemoteCandidate')(e);
        }
    }

    destroy(): void {
        this.peerConnection.close();
        this.dataChannel?.close()
        this.pendingCandidates = [];
        super.destroy();
    }

    private createPeerConnection(): RTCPeerConnection {
        const connection = new RTCPeerConnection({
            iceServers: NetConfig.ICE_SERVERS
        });

        connection.onicecandidate = (e: RTCPeerConnectionIceEvent): void => {
            if (e.candidate) {
                this.debugLogger('ICE candidate:', e.candidate.candidate);
                this.dispatchEvent<MessageTypes.ICE_CANDIDATE>(new CustomEvent(MessageTypes.ICE_CANDIDATE, {
                    detail: {
                        'peerId': this.id,
                        'candidate': e.candidate
                    }
                }))
            } else {
                this.debugLogger('No more candidates', e);
            }
        };

        connection.oniceconnectionstatechange = (e: Event): void => {
            const state = e.target instanceof RTCPeerConnection
                ? e.target.iceConnectionState : 'UNKNOWN';
            this.debugLogger('Connection status change:', state);
            return;
        };

        if (!this.initiator) {
            connection.ondatachannel = (e: RTCDataChannelEvent): void => {
                this.openDataChannel(e.channel);
            };
        }

        return connection;
    }

    private createDataChannel(): RTCDataChannel {
        return this.peerConnection.createDataChannel(NetConfig.CHANNEL_NAME, {
            ordered: false
        });
    }

    private openDataChannel(dataChannel: RTCDataChannel) {
        this.dataChannel = dataChannel;

        dataChannel.onopen = () => {
            this.debugLogger('Data channel open');
        };

        dataChannel.onclose = () => {
            this.debugLogger('Data channel closed');
        };

        dataChannel.onmessage = (e: MessageEvent) => {
            this.debugLogger('Data channel message:', e.data);
            this.dispatchEvent<'message'>(new CustomEvent('message', {
                detail: <unknown>JSON.parse(e.data)
            }))
        };
    }

    private initiateConnection() {
        const conn = this.peerConnection;
        const description = this.initiator
            ? conn.createOffer()
            : conn.createAnswer();

        description
            .then((offer) => conn.setLocalDescription(offer))
            .then(() => this.dispatchEvent<MessageTypes.SDP>(new CustomEvent(MessageTypes.SDP, {
                    detail: {
                        'peerId': this.id,
                        'sdp': <RTCSessionDescriptionInit>conn.localDescription
                    }
                }))
            )
            .catch(this.errorLogger('initiateConnection'));
    }

    private debugLogger(...data: any[]) {
        console.debug(...data);
    }

    private errorLogger(label: string): (e: unknown) => void {
        return e => console.error(label, e);
    }

    sendMessage(message: string): void {
        this.dataChannel?.send(message);
    }
}
