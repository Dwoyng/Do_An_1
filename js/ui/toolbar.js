// js/ui/toolbar.js
export class Toolbar {
    constructor(simulator) {
        this.simulator = simulator;
        this.initSearch = this.initSearch.bind(this);
        this.initToolbarToggle = this.initToolbarToggle.bind(this);
    }

    init() {
        this.initSearch();
        this.initToolbarToggle();
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
                this.simulator.addComponent(e.target.dataset.type);
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
            this.simulator.redraw();
        });
    }
}