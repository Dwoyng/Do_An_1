// js/app.js
import { CircuitSimulator } from './core/simulator.js';
import { Toolbar } from './ui/toolbar.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const simulator = new CircuitSimulator(canvas); // No default breadboard
    const toolbar = new Toolbar(simulator);
    toolbar.init();

    simulator.init();
    simulator.redraw();
});