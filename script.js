class Breadboard {
    constructor(ctx) {
        this.ctx = ctx;
        this.gridSize = 20;
        this.rows = 30;
        this.cols = 40;
        this.holes = [];
        this.powerRailOffset = 100;
        this.init();
    }

    init() {
        // Pre-calculate holes and connections
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = this.powerRailOffset + 20 + col * this.gridSize;
                const y = 20 + row * this.gridSize;
                this.holes.push({
                    x: x,
                    y: y,
                    row: row,  // Lưu trữ hàng
                    col: col,  // Lưu trữ cột
                    connections: []
                });
            }
        }
    }

    draw() {
        this.ctx.fillStyle = "#e1d5c9";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.fillStyle = "#ff9999";
        this.ctx.fillRect(this.powerRailOffset, 0, 10, this.ctx.canvas.height);
        this.ctx.fillRect(this.ctx.canvas.width - this.powerRailOffset - 10, 0, 10, this.ctx.canvas.height);

        for (const hole of this.holes) {
            this.ctx.beginPath();
            this.ctx.arc(hole.x, hole.y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = "#ccc";
            this.ctx.fill();
        }
    }

    getNearestHole(x, y) {
        let minDist = Infinity;
        let nearest = null;

        for (const hole of this.holes) {
            const dist = Math.sqrt((x - hole.x) ** 2 + (y - hole.y) ** 2);
            if (dist < 15 && dist < minDist) {
                minDist = dist;
                nearest = hole;
            }
        }
        return nearest;
    }
}

class Component {
    constructor(type, x, y, breadboard) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.breadboard = breadboard;
        this.pins = [];
        this.rotation = 0;
        this.isSelected = false;
        this.isDragging = false;
        this.connectionPoints = [];  // Điểm kết nối

        this.initPins();
        this.initConnectionPoints();
    }

    initPins() {
        // Tìm các lỗ gần nhất và gán cho pins
        switch (this.type) {
            case 'resistor':
                this.pins[0] = this.breadboard.getNearestHole(this.x - 40, this.y);
                this.pins[1] = this.breadboard.getNearestHole(this.x + 40, this.y);
                break;
            case 'led':
                this.pins[0] = this.breadboard.getNearestHole(this.x - 20, this.y);
                this.pins[1] = this.breadboard.getNearestHole(this.x + 20, this.y);
                break;
            case 'battery':
                this.pins[0] = this.breadboard.getNearestHole(this.x, this.y - 40);
                this.pins[1] = this.breadboard.getNearestHole(this.x, this.y + 40);
                break;
            default:
                this.pins = [];
        }
    }

    initConnectionPoints() {  //Khởi tạo điểm kết nối
        switch (this.type) {
            case 'resistor':
                this.connectionPoints = [
                    { x: this.x - 40, y: this.y, component: this, index: 0 },
                    { x: this.x + 40, y: this.y, component: this, index: 1 }
                ];
                break;
            case 'led':
                this.connectionPoints = [
                    { x: this.x - 20, y: this.y, component: this, index: 0 },
                    { x: this.x + 20, y: this.y, component: this, index: 1 }
                ];
                break;
            case 'battery':
                this.connectionPoints = [
                    { x: this.x, y: this.y - 40, component: this, index: 0 },
                    { x: this.x, y: this.y + 40, component: this, index: 1 }
                ];
                break;
            default:
                this.connectionPoints = [];
        }
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

        switch (this.type) {
            case 'resistor':
                ctx.fillStyle = '#856f4b';
                ctx.fillRect(-40, -10, 80, 20);
                break;
            case 'led':
                ctx.fillStyle = '#00ff00';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'battery':
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(-15, -40, 30, 80);
                break;
        }

        ctx.restore();

        // Vẽ điểm kết nối
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
        this.initPins();
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
}

class Wire {
    constructor(startComponent, startPinIndex, endComponent, endPinIndex) {
        this.startComponent = startComponent;
        this.startPinIndex = startPinIndex;
        this.endComponent = endComponent;
        this.endPinIndex = endPinIndex;
        this.color = "#000";
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.startComponent.connectionPoints[this.startPinIndex].x, this.startComponent.connectionPoints[this.startPinIndex].y);
        ctx.lineTo(this.endComponent.connectionPoints[this.endPinIndex].x, this.endComponent.connectionPoints[this.endPinIndex].y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class CircuitSimulator {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.breadboard = new Breadboard(this.ctx);
        this.components = [];
        this.wires = [];
        this.selectedComponent = null;
        this.dragging = false;
        this.mode = 'select'; // Chế độ mặc định là chọn/di chuyển
        this.currentWireStart = null;
        this.isToolbarCollapsed = false;
        this.selectedConnectionPoint = null; // Lưu trữ điểm kết nối đã chọn

        this.initEventListeners();
        this.initSearch();
        this.initToolbarToggle();
        this.redraw();
    }

    initEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        //Kiểm tra xem có click vào điểm kết nối linh kiện hay không
        for (const component of this.components) {
            for (const point of component.connectionPoints) {
                const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                if (dist < 10) {  //Nếu khoảng cách từ điểm click đến điểm kết nối < 10 => click vào điểm kết nối
                    this.selectedConnectionPoint = point;  //gán điểm kết nối vào biến tạm
                    this.redraw();
                    return;
                }
            }
        }

        //Nếu không click vào điểm kết nối, thì tiếp tục di chuyển linh kiện
        this.selectedComponent = this.components.find(component => {
            const points = component.getConnectionPoints();
            return Math.abs(x - component.x) < 40 && Math.abs(y - component.y) < 40;
        });

        if (this.selectedComponent) {
            this.dragging = true;
            this.selectedComponent.isSelected = true;
            this.dragOffsetX = x - this.selectedComponent.x;
            this.dragOffsetY = y - this.selectedComponent.y;
            this.selectedComponent.setIsDragging(true);
            this.redraw();
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.dragging && this.selectedComponent) {  //Nếu đang di chuyển
            this.selectedComponent.updatePosition(x - this.dragOffsetX, y - this.dragOffsetY);
            this.redraw();
        }
    }

    handleMouseUp(e) {
        this.dragging = false; //Dừng kéo
        if (this.selectedComponent) {
            this.selectedComponent.isSelected = false;
            this.selectedComponent.setIsDragging(false); //Khi thả chuột, đặt trạng thái kéo linh kiện = false
            this.selectedComponent = null; //bỏ chọn linh kiện
            this.redraw();
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

         //Kiểm tra xem có thả chuột vào điểm kết nối hay không
        if (this.selectedConnectionPoint) {  //Nếu đã chọn điểm kết nối trước đó
            for (const component of this.components) {
                for (const point of component.connectionPoints) {
                    const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                    if (dist < 10) {  //Nếu điểm thả gần điểm kết nối
                        //Tạo dây nối và lưu thông tin
                        this.wires.push(new Wire(
                            this.selectedConnectionPoint.component,
                            this.selectedConnectionPoint.index,
                            component,
                            point.index
                        ));
                        this.selectedConnectionPoint = null; //reset điểm kết nối
                        this.redraw();
                        return;
                    }
                }
            }
            this.selectedConnectionPoint = null; //Nếu không thả vào điểm kết nối nào thì reset
            this.redraw();
        }
    }

    addComponent(type) {
        const component = new Component(
            type,
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.breadboard
        );
        this.components.push(component);
        this.redraw();
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.breadboard.draw();
        this.components.forEach(component => component.draw(this.ctx));
        this.wires.forEach(wire => wire.draw(this.ctx));
    }

    initSearch() {
        const searchInput = document.getElementById('search');
        const componentList = document.getElementById('component-list');

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            componentList.querySelectorAll('li').forEach(item => {
                item.style.display = item.textContent.toLowerCase().includes(searchTerm) ? 'block' : 'none';
            });
        });

        componentList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                this.addComponent(e.target.dataset.type);
            }
        });
    }

    initToolbarToggle() {
        const toggleButton = document.getElementById('toggle-toolbar');
        const sideToolbar = document.querySelector('.side-toolbar');
        const body = document.querySelector('body');

        toggleButton.addEventListener('click', () => {
            body.classList.toggle('toolbar-collapsed');
            const isCollapsed = body.classList.contains('toolbar-collapsed');
            sideToolbar.classList.toggle('collapsed', isCollapsed);
            this.redraw();
        });
    }
}

const simulator = new CircuitSimulator();