import {Game} from './src/game';

window.addEventListener('load', () => {
    const canvasEl = <HTMLCanvasElement>document.querySelector('#canvasEl');
    new Game(canvasEl);
});
