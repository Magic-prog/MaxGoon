class UIController {
    constructor() {
        this.defaultImages = ['🍎', '🍌', '🍒', '🍉', '🍓', '🍋', '🍑', '🍍'];
        this.customImages = JSON.parse(localStorage.getItem('mahjong_custom_imgs')) || [];
    }

    getActiveImages() {
        return this.customImages.length > 0 ? this.customImages : this.defaultImages;
    }

    switchScreen(screenId) {
        const currentActive = document.querySelector('.screen.active');
        const target = document.getElementById(screenId);

        if (currentActive && currentActive !== target) {
            currentActive.classList.add('slide-out-left');
            setTimeout(() => {
                currentActive.classList.remove('active', 'slide-out-left');
                target.classList.add('active');
            }, 400);
        } else {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active', 'slide-out-left'));
            target.classList.add('active');
        }

        const btnFloat = document.getElementById('btn-global-theme');
        if (screenId === 'start-menu') {
            btnFloat.style.display = 'flex';
        } else {
            btnFloat.style.display = 'none';
        }
    }

    setGlobalTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        localStorage.setItem('mahjong_global_theme', themeName);
    }

    renderBoard(board, onTileClick) {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        
        const expertClass = board.expertMode ? 'expert-on' : 'expert-off';
        boardEl.className = `board ${expertClass}`;
        
        const spacingX = 72; 
        const spacingY = 96; 

        let maxC = 0, maxR = 0;
        board.tiles.forEach(t => {
            if (t.c > maxC) maxC = t.c;
            if (t.r > maxR) maxR = t.r;
        });

        const boardWidth = (maxC + 1) * spacingX;
        const boardHeight = (maxR + 1) * spacingY;

        boardEl.style.width = `${boardWidth}px`;
        boardEl.style.height = `${boardHeight}px`;

        board.tiles.forEach(tile => {
            if (tile.removed) return;

            const el = document.createElement('div');
            el.className = `tile ${tile.isBlocked ? 'blocked' : ''}`;
            el.dataset.id = tile.id;
            
            const leftOffset = tile.c * spacingX - (tile.z * 8);
            const topOffset = tile.r * spacingY - (tile.z * 10);
            
            el.style.left = `${leftOffset}px`;
            el.style.top = `${topOffset}px`;
            el.style.zIndex = (tile.z * 20) + Math.round(tile.r * 10);

            const isCustom = typeof tile.img === 'string' && (tile.img.startsWith('data:image') || tile.img.startsWith('http'));
            
            if (isCustom) {
                const img = document.createElement('img');
                img.src = tile.img;
                el.appendChild(img);
            } else {
                const span = document.createElement('span');
                span.className = 'tile-emoji';
                span.innerText = tile.img;
                el.appendChild(span);
            }

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                onTileClick(tile);
            });
            boardEl.appendChild(el);
        });
    }

    renderPreviews() {
        const grid = document.getElementById('preview-grid');
        grid.innerHTML = '';
        const imgs = this.customImages.length > 0 ? this.customImages : this.defaultImages;
        imgs.forEach(src => {
            if (typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('http'))) {
                const img = document.createElement('img');
                img.src = src;
                grid.appendChild(img);
            } else {
                const div = document.createElement('div');
                div.className = 'preview-emoji';
                div.innerText = src;
                grid.appendChild(div);
            }
        });
    }
}