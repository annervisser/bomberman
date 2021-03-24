import './style.css';
import {Game} from './src/game';

window.addEventListener('load', () => {
    new Game(<HTMLCanvasElement>document.querySelector('#canvasEl'));
});
