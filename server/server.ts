import WebSocket, {Server} from 'ws';

const wss = new Server({
    port: 8080
});

console.log('Starting server...');
type playerConnectionMap = Map<string, WebSocket>;
const rooms = new Map<string, playerConnectionMap>();

wss.on('connection', (socket, request) => {
    console.log('connection:', request.socket.remoteAddress)
    let connRoomName: string | null = null;
    let connPeerId: string | null = null;

    socket.on('message', (data) => {
        if (data === 'ping') {
            socket.send('pong');
        }
        console.log('received:', data);
        if (typeof data === 'string') {
            const message = JSON.parse(data);
            switch (message.type) {
                case 'REQUEST_JOIN':
                    connRoomName = joinRoom(message.data, socket);
                    connPeerId = message.data.peerId;
                    break;
                case 'SDP':
                case 'ICE_CANDIDATE':
                    const data = {...message.data}
                    data.peerId = connPeerId;
                    sendData(getSocket(connRoomName, message.data.peerId), {
                        type: message.type,
                        data: data
                    });
            }
        }
    });

    socket.on('close', () => {
        if (connRoomName && connPeerId) {
            console.log('removing peer %s from room %s', connPeerId, connRoomName);
            rooms.get(connRoomName)?.delete(connPeerId);
        }
    });
})

function joinRoom(data: any, socket: WebSocket): string {
    const peerId = data.peerId;
    const roomName = data.roomName;

    const room = rooms.get(roomName) ?? new Map<string, WebSocket>();
    const peerIds = Array.from(room.keys());

    sendData(socket, {
        type: 'JOINED_ROOM',
        data: {
            roomName: roomName,
            peerIds: peerIds
        }
    });

    for (const socket of room.values()) {
        sendData(socket, {
            type: 'USER_JOINED',
            data: {
                peerId: peerId
            }
        })
    }

    room.set(peerId, socket);
    rooms.set(roomName, room);
    return roomName;
}

function getSocket(room: string | null, peer: string): WebSocket {
    if (room === null) {
        throw Error('Received SDP before roomname set')
    }
    const socket = rooms.get(room)?.get(peer);
    if (!socket) {
        throw Error('Remote socket not found');
    }
    return socket;
}

function sendData(socket: WebSocket, data: any) {
    const json = JSON.stringify(data);
    console.log('sent:', json)
    socket.send(json)
}
