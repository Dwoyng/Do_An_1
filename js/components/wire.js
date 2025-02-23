// js/components/wire.js
export class Wire {
    constructor(startComponent, startPinIndex, endComponent, endPinIndex) {
        this.startComponent = startComponent;
        this.startPinIndex = startPinIndex;
        this.endComponent = endComponent;
        this.endPinIndex = endPinIndex;
        this.color = "#000";
    }

    draw(ctx) {
        if (!this.startComponent || !this.endComponent || !this.startComponent.connectionPoints || !this.endComponent.connectionPoints) {
            console.warn("Invalid wire:", this);
            return;
        }
        
        const startPoint = this.startComponent.getConnectionPoints()[this.startPinIndex];
        const endPoint = this.endComponent.getConnectionPoints()[this.endPinIndex];
    
        if (!startPoint || !endPoint) {
            console.warn("Invalid wire endpoint:", this);
            return;
        }
    
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}