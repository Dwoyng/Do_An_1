// js/core/simulator.js
import { Component } from '../components/component.js';
import { Wire } from '../components/wire.js';
import { Breadboard } from '../components/breadboard.js';

export class CircuitSimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.components = [];
        this.wires = [];
        this.selectedComponent = null;
        this.selectedComponents = []; // Mảng để lưu nhiều component được chọn
        this.dragging = false;
        this.selecting = false;  // Thêm trạng thái chọn vùng
        this.selectionStartX = 0;
        this.selectionStartY = 0;
        this.selectedConnectionPoint = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
    }

    init() {
        this.initEventListeners();
    }

    initEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        const shiftKey = e.shiftKey;

        // Check for connection points first (ưu tiên kết nối)
        for (const component of this.components) {
            if(component instanceof Breadboard) continue; // Không kết nối điểm với breadboard
            for (const point of component.connectionPoints) {
                const dist = Math.sqrt((this.mouseX - point.x) ** 2 + (this.mouseY - point.y) ** 2);
                if (dist < 10) {
                    this.selectedConnectionPoint = point;
                    this.dragging = false;  // Hủy kéo nếu chọn điểm kết nối
                    this.selecting = false;
                    this.selectedComponents.forEach(c => c.isSelected = false);
                    this.selectedComponents = [];
                    this.selectedComponent = null;
                    this.redraw();
                    return;
                }
            }
        }

        // Check for component selection
        let clickedComponent = this.components.find(component => {
            return Math.abs(this.mouseX - component.x) < 40 && Math.abs(this.mouseY - component.y) < 40;
        });

        if (clickedComponent) {
            if (shiftKey) {
                clickedComponent.isSelected = !clickedComponent.isSelected;
                if (clickedComponent.isSelected) {
                    this.selectedComponents.push(clickedComponent);
                } else {
                    this.selectedComponents = this.selectedComponents.filter(c => c!== clickedComponent);
                }
                this.dragging = false;
                this.selecting = false;
                this.selectedComponent = null;
                this.redraw();
                return;
            }

            //Select single component
            this.dragging = true; // Cho phép kéo
            this.selectedComponent = clickedComponent;
            this.dragOffsetX = this.mouseX - this.selectedComponent.x;
            this.dragOffsetY = this.mouseY - this.selectedComponent.y;
            this.selectedComponent.setIsDragging(true);
            this.selectedComponents.forEach(c => c.isSelected = false);
            this.selectedComponents = [];
            clickedComponent.isSelected = true;
            this.selectedComponents.push(clickedComponent);
            this.selecting = false;
            this.redraw();
            return;
        }

        // If no connection point or component is selected, begin the selection area
        this.selecting = true;
        this.dragging = false;
        this.selectionStartX = this.mouseX;
        this.selectionStartY = this.mouseY;
        this.selectedComponents.forEach(c => c.isSelected = false);
        this.selectedComponents = [];
        this.selectedComponent = null;
        this.redraw();
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;

        if (this.dragging && this.selectedComponent) {
            this.selectedComponent.updatePosition(this.mouseX - this.dragOffsetX, this.mouseY - this.dragOffsetY);
            this.redraw();
        }

        if (this.selecting) {
            this.redraw();
        }
    }

    handleMouseUp(e) {
        if (this.selecting) {
            // Finish selection area
            this.selecting = false;
            const selectionEndX = this.mouseX;
            const selectionEndY = this.mouseY;

            const selectionRect = {  // Tạo đối tượng hình chữ nhật để dễ dùng
                x: Math.min(this.selectionStartX, selectionEndX),
                y: Math.min(this.selectionStartY, selectionEndY),
                width: Math.abs(this.selectionStartX - selectionEndX),
                height: Math.abs(this.selectionStartY - selectionEndY)
            };

            // Xác định các component nằm trong vùng chọn
            this.components.forEach(component => {
                if (component instanceof Breadboard) return; // Không chọn breadboard

                const componentX = component.x - 40; // căn chỉnh theo hình
                const componentY = component.y - 20;
                // Kiểm tra xem component có nằm hoàn toàn trong hình chữ nhật chọn hay không
                if (componentX > selectionRect.x &&
                    componentX + 80 < selectionRect.x + selectionRect.width &&
                    componentY > selectionRect.y &&
                    componentY + 40 < selectionRect.y + selectionRect.height)
                {
                   component.isSelected = true;
                   if (!this.selectedComponents.includes(component)) {
                       this.selectedComponents.push(component);
                   }
                } else {
                    component.isSelected = false;
                      this.selectedComponents = this.selectedComponents.filter(c => c != component);
                }

            });
            this.redraw();
        }  else if(this.selectedConnectionPoint) {
             // Clear selections when starting to create a wire

           this.selectedComponents.forEach(c => c.isSelected = false);
           this.selectedComponents = [];
           this.redraw();

            for (const component of this.components) {
                if(component instanceof Breadboard) continue; //Không tạo dây nối vào breadboard
                for (const point of component.connectionPoints) {
                    const dist = Math.sqrt((this.mouseX - point.x) ** 2 + (this.mouseY - point.y) ** 2);
                    if (dist < 10) {
                        this.wires.push(new Wire(
                            this.selectedConnectionPoint.component,
                            this.selectedConnectionPoint.index,
                            component,
                            point.index
                        ));
                        this.selectedConnectionPoint = null;
                        this.redraw();
                        return;
                    }
                }
            }
            this.selectedConnectionPoint = null;
            this.redraw();
        }

        this.dragging = false;
        this.selecting = false;

    }

    addComponent(type) {
        let component;
        if (type === 'breadboard') {
            component = new Breadboard(this.ctx, this.canvas.width / 2, this.canvas.height / 2); // pass x, y
        } else {
            component = new Component(type, this.canvas.width / 2, this.canvas.height / 2);
        }
        this.components.push(component);
        this.redraw();
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Vẽ breadboard trước
        this.components.filter(component => component instanceof Breadboard).forEach(component => component.draw(this.ctx));
        // Sau đó vẽ các linh kiện khác
        this.components.filter(component => !(component instanceof Breadboard)).forEach(component => component.draw(this.ctx));
        this.wires.forEach(wire => wire.draw(this.ctx));

        // Vẽ hình chữ nhật chọn
        if (this.selecting) {
            this.ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';  // Màu nền trong suốt (tùy chỉnh)
            this.ctx.fillRect(this.selectionStartX, this.selectionStartY, this.mouseX - this.selectionStartX, this.mouseY -this.selectionStartY);

            this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)'; // Màu viền (tùy chỉnh)
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.selectionStartX, this.selectionStartY, this.mouseX - this.selectionStartX, this.mouseY -this.selectionStartY);
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // Delete selected components
            this.deleteSelectedComponents();
            this.redraw();
        }
            switch (e.key) {
                case 'ArrowLeft':
                     if(this.selectedComponent) this.selectedComponent.rotate(-15);
                    this.redraw();
                    break;
                case 'ArrowRight':
                    if(this.selectedComponent)   this.selectedComponent.rotate(15);
                    this.redraw();
                    break;
                case 'ArrowUp':
                    if(this.selectedComponent) this.selectedComponent.rotate(-45);
                    this.redraw();
                    break;
                case 'ArrowDown':
                    if(this.selectedComponent)   this.selectedComponent.rotate(45);
                    this.redraw();
                    break;
            }
    }

     // New function to connect a component to the breadboard
    connectComponentToBreadboard(component, breadboard, x, y) {
        const nearestHole = breadboard.getNearestHole(x, y);
        if (nearestHole) {
            nearestHole.component = component;
            console.log(`Connected ${component.type} to breadboard at row ${nearestHole.row}, col ${nearestHole.col}`);
        }
    }

    deleteSelectedComponents() {
        // First, disconnect the components from any breadboard holes
        for (const breadboard of this.components.filter(c => c instanceof Breadboard)) {
            for (const hole of breadboard.holes) {
                if (this.selectedComponents.includes(hole.component)) {
                    hole.component = null; // Disconnect from breadboard
                }
            }
        }

        // Remove wires connected to the components to be deleted
        this.wires = this.wires.filter(wire =>
            !this.selectedComponents.includes(wire.startComponent) &&
            !this.selectedComponents.includes(wire.endComponent)
        );

        // Finally, remove the components themselves
        this.components = this.components.filter(component => !this.selectedComponents.includes(component));
        this.selectedComponents.forEach(c => c.isSelected = false);
        this.selectedComponents = []; // Clear the selection
        this.selectedComponent = null;
    }
}