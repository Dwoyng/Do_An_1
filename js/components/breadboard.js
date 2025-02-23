// js/components/breadboard.js
import { Component } from './component.js';

export class Breadboard extends Component {
    constructor(ctx, x, y) {
        super('breadboard', x, y);
        this.ctx = ctx;
        this.gridSize = 15;
        this.rows = 20;
        this.cols = 30;
        this.holes = [];
        this.powerRailOffset = 30;
        this.init();
        this.initConnections(); // Khởi tạo kết nối giữa các lỗ
    }

    init() {
        this.initHoles();
    }

    initHoles() {
        this.holes = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = this.x + this.powerRailOffset + 20 + col * this.gridSize;
                const y = this.y + 20 + row * this.gridSize;
                this.holes.push({
                    x: x,
                    y: y,
                    row: row,
                    col: col,
                    component: null, // Lưu ý: Chỉ lưu component được kết nối
                    connectedTo: new Set() // Lưu trữ các lỗ được kết nối logic
                });
            }
        }
    }

    initConnections() {
        // Kết nối các lỗ theo hàng (khu vực main)
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const hole = this.getHoleByRowCol(row, col);
                for (let i = 0; i < 5; i++) {
                    const connectedCol = col + i;
                    if (connectedCol < this.cols) {
                        const connectedHole = this.getHoleByRowCol(row, connectedCol);
                        if (hole !== connectedHole) {
                            hole.connectedTo.add(connectedHole);
                            connectedHole.connectedTo.add(hole);
                        }
                    }
                }
            }
        }

        // Kết nối các lỗ theo cột (rail nguồn)
        for (let row = 0; row < this.rows; row++) {
            // Kết nối rail nguồn bên trái
            const leftRailHole = this.getHoleByRowCol(row, 0); //Giả sử cột 0 là rail trái
            if(leftRailHole) {
                for (let i = 1; i < this.rows; i++) {
                    const otherLeftRailHole = this.getHoleByRowCol(i, 0)
                    if (leftRailHole !== otherLeftRailHole && otherLeftRailHole) {
                         leftRailHole.connectedTo.add(otherLeftRailHole);
                         otherLeftRailHole.connectedTo.add(leftRailHole);
                    }
                }
            }

            // Kết nối rail nguồn bên phải (nếu có)
            const rightRailHole = this.getHoleByRowCol(row, this.cols - 1); //Giả sử cột cuối cùng là rail phải
            if(rightRailHole) {
                for (let i = 1; i < this.rows; i++) {
                    const otherRightRailHole = this.getHoleByRowCol(i, this.cols - 1)
                    if (rightRailHole !== otherRightRailHole && otherRightRailHole) {
                         rightRailHole.connectedTo.add(otherRightRailHole);
                         otherRightRailHole.connectedTo.add(rightRailHole);
                    }
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = "#e1d5c9";
        ctx.fillRect(0, 0, this.cols * this.gridSize + this.powerRailOffset * 2 + 20, this.rows * this.gridSize + 40);

        ctx.fillStyle = "#ff9999";
        ctx.fillRect(this.powerRailOffset, 0, 10, this.rows * this.gridSize + 40);
        ctx.fillRect(this.cols * this.gridSize + this.powerRailOffset + 10, 0, 10, this.rows * this.gridSize + 40);

        for (const hole of this.holes) {
            ctx.beginPath();
            ctx.arc(hole.x - this.x, hole.y - this.y, 5, 0, Math.PI * 2);

            // Màu sắc tùy thuộc vào trạng thái kết nối
            if (hole.component) {
                ctx.fillStyle = 'red'; // Highlight nếu có linh kiện
            } else if (this.isHoleConnectedToComponent(hole)) {
                ctx.fillStyle = 'orange'; // Highlight nếu kết nối với linh kiện
            }
            else {
                ctx.fillStyle = "#ccc";
            }

            ctx.fill();

            // (Tùy chọn) Vẽ các đường kết nối logic (khá phức tạp để triển khai)
            // for (const connectedHole of hole.connectedTo) {
            //     ctx.beginPath();
            //     ctx.moveTo(hole.x - this.x, hole.y - this.y);
            //     ctx.lineTo(connectedHole.x - this.x, connectedHole.y - this.y);
            //     ctx.strokeStyle = 'rgba(0, 0, 255, 0.2)'; // Màu xanh nhạt
            //     ctx.stroke();
            // }
        }

        ctx.restore();
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

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
        this.initHoles(); // Chỉ cần cập nhật lại vị trí các lỗ
    }


    connectComponent(component, hole) {
        if (hole && !hole.component) {
            hole.component = component;
            return true; // Kết nối thành công
        }
        return false; // Không thể kết nối (lỗ đã được sử dụng hoặc không tìm thấy)
    }

    disconnectComponent(hole) {
        if (hole && hole.component) {
            hole.component = null;
            return true; // Ngắt kết nối thành công
        }
        return false; // Không thể ngắt kết nối (không có component nào được kết nối)
    }

    isConnected(hole) {
        return hole && hole.component !== null;
    }

    getConnectedComponent(hole) {
        return hole ? hole.component : null;
    }

    getAllConnectedComponents() {
        return this.holes.filter(hole => hole.component !== null).map(hole => hole.component);
    }

    getHoleByRowCol(row, col) {
        return this.holes.find(hole => hole.row === row && hole.col === col);
    }

    // Hàm kiểm tra xem một lỗ có kết nối (logic) đến một lỗ có component hay không
    isHoleConnectedToComponent(hole) {
        for (const connectedHole of hole.connectedTo) {
            if (connectedHole.component) {
                return true;
            }
        }
        return false;
    }

    // Hàm lấy tất cả các lỗ được kết nối (logic) với một lỗ
    getConnectedHoles(hole) {
        return Array.from(hole.connectedTo);
    }
}