import {Net} from './net/net';

window.addEventListener('load', () => {
    const canvasEl = <HTMLCanvasElement>document.querySelector('#canvasEl');
    // new Game(canvasEl);

    canvasEl.hidden = true;
    new Net();
});
