// js/components/current source.js
import { Component } from './component.js';

export class CurrentSource extends Component {
    constructor(x, y) {
        super('Current Source', x, y);
        this.parameters = {
            current: 0.1 // 0.1A
        };
    }
}