// js/components/component.js
export class Component {
    constructor(type, x, y) { // No breadboard here
        this.type = type;
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.isSelected = false;
        this.isDragging = false;
        this.connectionPoints = [];

        this.image = new Image();
        this.image.src = `assets/components/${type}.svg`;

        this.initConnectionPoints(); // Only init connection points
    }

    initConnectionPoints() {
        let x1, y1, x2, y2;
        switch (this.type) {
            case 'resistor':
                x1 = this.x - 40;
                y1 = this.y;
                x2 = this.x + 40;
                y2 = this.y;
                break;
            case 'led':
                x1 = this.x - 11;
                y1 = this.y + 8;
                x2 = this.x + 11;
                y2 = this.y + 8;
                break;
            case 'voltage source':
                x1 = this.x - 28;
                y1 = this.y - 5;
                x2 = this.x + 28;
                y2 = this.y - 5;
                break;
            case 'capacitor':
                x1 = this.x - 27;
                y1 = this.y - 4;
                x2 = this.x + 27;
                y2 = this.y - 4;
                break;
             case 'diode':
                x1 = this.x - 40;
                y1 = this.y - 4;
                x2 = this.x + 40;
                y2 = this.y - 4;
                break;
            case 'transistor':
                x1 = this.x - 20;
                y1 = this.y;
                x2 = this.x + 20;
                y2 = this.y;
                break;
            case 'inductor':
                x1 = this.x - 36;
                y1 = this.y;
                x2 = this.x + 36;
                y2 = this.y;
                break;
            case 'current source':
                x1 = this.x - 30;
                y1 = this.y - 3;
                x2 = this.x + 30;
                y2 = this.y - 3;
                break;
            case 'breadboard': // Breadboard has no connection points
                this.connectionPoints = [];
                return;
            default:
                this.connectionPoints = [];
                return;
        }

        const angleRad = this.rotation * Math.PI / 180;
        const rotatedX1 = (x1 - this.x) * Math.cos(angleRad) - (y1 - this.y) * Math.sin(angleRad) + this.x;
        const rotatedY1 = (x1 - this.x) * Math.sin(angleRad) + (y1 - this.y) * Math.cos(angleRad) + this.y;
        const rotatedX2 = (x2 - this.x) * Math.cos(angleRad) - (y2 - this.y) * Math.sin(angleRad) + this.x;
        const rotatedY2 = (x2 - this.x) * Math.sin(angleRad) + (y2 - this.y) * Math.cos(angleRad) + this.y;

        this.connectionPoints = [
            { x: rotatedX1, y: rotatedY1, component: this, index: 0 },
            { x: rotatedX2, y: rotatedY2, component: this, index: 1 }
        ];
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);

        if (this.isSelected) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(-25, -15, 50, 30);
        }

        ctx.drawImage(this.image, -40, -20, 80, 40);

        ctx.restore();

        // Draw connection points
        this.connectionPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'blue';
            ctx.fill();
        });
    }

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
        this.initConnectionPoints();
    }

    getConnectionPoints() {
        return this.connectionPoints;
    }

    setIsDragging(dragging) {
        this.isDragging = dragging;
    }

    getIsDragging() {
        return this.isDragging;
    }

    rotate(angle) {
        this.rotation += angle;
        this.rotation %= 360;
        this.initConnectionPoints();
    }
}