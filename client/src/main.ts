import {Game} from './game';
import {ExternalConnectionWebSocket} from './net/external-connection/websocket';
import {Room} from './net/room';
import {ConnectionEvents} from './net/external-connection/external-connection';
import {Client} from './net/client';

window.addEventListener('load', () => {
    const canvasEl = <HTMLCanvasElement>document.querySelector('#canvasEl');
    new Game(canvasEl);

    const external = new ExternalConnectionWebSocket('ws://localhost:8080');
    external.addEventListener(ConnectionEvents.Open, () => {
        const client = new Client(external);
        const roomName = prompt('Room:', 'room') ?? 'room'
        const room = new Room(client, roomName);
        room.addEventListener('joined', () => updateUI(room));
        room.addEventListener('user_joined', () => updateUI(room));
        room.addEventListener('user_left', () => updateUI(room));
    })
});

const ui = {
    playerName: <HTMLSpanElement>document.getElementById('playerName'),
    roomName: <HTMLSpanElement>document.getElementById('roomName'),
    peers: <HTMLSpanElement>document.getElementById('players')
}

function updateUI(room: Room) {
    ui.playerName.innerText = room.ownID
    ui.roomName.innerText = room.roomName
    ui.peers.innerText = room.peerIds.join(', ')
}
