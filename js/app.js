document.addEventListener('DOMContentLoaded', async () => {
    const splash = document.getElementById('splash-screen');
    const statusText = document.getElementById('splash-status-text');
    const barFill = document.getElementById('loader-bar-fill');
    const percentText = document.getElementById('loader-percentage');

    function updateProgress(percent, message) {
        if (barFill) barFill.style.width = `${percent}%`;
        if (percentText) percentText.innerText = `${Math.round(percent)}%`;
        if (statusText) statusText.innerText = message;
    }

    // Inicializar Audio
    try {
        soundFX.init();
        soundFX.playSplash();
    } catch (e) {
        console.log('Audio en espera de interacción');
    }

    const ui = new UIController();
    const imagesToLoad = [
        'images/logo-empresa.png',
        'images/logo-juego.png',
        ...ui.getActiveImages().filter(img => typeof img === 'string' && (img.startsWith('data:image') || img.startsWith('http')))
    ];

    function preloadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }

    // CARGA CONTROLADA A 5 SEGUNDOS MÍNIMOS
    const minDuration = 5000; // 5 segundos exactos
    const startTime = performance.now();
    let loadedCount = 0;
    const totalToLoad = imagesToLoad.length;

    // Precargar imágenes en paralelo mientras corre el tiempo
    const imagePromises = imagesToLoad.map(async (src) => {
        await preloadImage(src);
        loadedCount++;
    });

    // Animación fluida de la barra de progreso basada en los 5 segundos
    const progressInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        let progress = (elapsed / minDuration) * 100;

        if (progress > 100) progress = 100;

        let msg = 'Cargando recursos corporativos...';
        if (progress > 60) msg = 'Preparando tableros y perfiles...';
        if (progress > 90) msg = '¡Todo listo!';

        updateProgress(progress, msg);

        if (elapsed >= minDuration && loadedCount >= totalToLoad) {
            clearInterval(progressInterval);
            finishSplash();
        }
    }, 50);

    async function finishSplash() {
        updateProgress(100, '¡Bienvenido!');
        await new Promise(r => setTimeout(r, 300));

        if (splash) {
            // Transición de desplazamiento de derecha a izquierda de 1 segundo
            splash.classList.add('slide-out-left');
            setTimeout(() => {
                splash.style.display = 'none';
                document.getElementById('start-menu').classList.add('active');
            }, 1000); // 1000ms = 1 segundo exacto de duración
        }
    }

    const board = new MahjongBoard();
    let selectedTile = null;
    let score = 0;
    let timerInterval = null;
    let secondsElapsed = 0;

    // Conectar sonidos a todos los botones
    document.querySelectorAll('.animated-btn, .btn, .btn-theme-opt, .btn-icon').forEach(btn => {
        btn.addEventListener('mouseenter', () => soundFX.playButtonHover());
        btn.addEventListener('click', () => {
            soundFX.playButtonClick();
            btn.classList.add('shake-anim');
            setTimeout(() => btn.classList.remove('shake-anim'), 300);
        });
    });

    const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ee5f96"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';

    let userProfile = JSON.parse(localStorage.getItem('mahjong_user_profile')) || {
        name: 'Jugador 1',
        avatar: '',
        totalTimeSeconds: 0,
        lastScore: 0,
        maxScore: 0,
        totalScore: 0,
        lastGameDetails: 'Sin partidas recientes'
    };

    function saveProfile() {
        localStorage.setItem('mahjong_user_profile', JSON.stringify(userProfile));
        updateProfileUI();
    }

    function updateProfileUI() {
        const activeAvatar = userProfile.avatar && userProfile.avatar.trim() !== '' ? userProfile.avatar : DEFAULT_AVATAR;

        document.getElementById('user-name-display').innerText = userProfile.name;
        document.getElementById('user-avatar-img').src = activeAvatar;
        document.getElementById('stat-total-time').innerText = formatHMS(userProfile.totalTimeSeconds);
        document.getElementById('stat-last-score').innerText = `${userProfile.lastScore} pts`;
        document.getElementById('stat-max-score').innerText = `${userProfile.maxScore || 0} pts`;
        document.getElementById('stat-total-score').innerText = `${userProfile.totalScore || 0} pts`;
        document.getElementById('stat-last-details').innerText = userProfile.lastGameDetails;

        document.getElementById('game-user-name').innerText = userProfile.name;
        document.getElementById('game-user-avatar').src = activeAvatar;
    }

    function formatHMS(totalSec) {
        const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    document.getElementById('btn-edit-name').addEventListener('click', () => {
        const nameDisplay = document.getElementById('user-name-display');
        const currentName = userProfile.name || 'Jugador 1';

        // Si ya hay un input abierto, no crear otro
        if (nameDisplay.querySelector('input')) return;

        // Crear un input de texto dinámico para editar el nombre en línea
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'custom-name-input';
        input.style.cssText = 'background: var(--bg-inner); color: var(--text-main); border: 1px solid var(--accent); border-radius: 4px; padding: 2px 6px; font-size: 1rem; width: 120px; outline: none;';

        nameDisplay.innerText = '';
        nameDisplay.appendChild(input);
        input.focus();
        input.select();

        const saveNewName = () => {
            const newName = input.value.trim();
            if (newName !== '') {
                userProfile.name = newName;
                saveProfile();
            } else {
                updateProfileUI(); // Restaurar si está vacío
            }
        };

        // Guardar al presionar Enter o al hacer clic fuera del input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveNewName();
            } else if (e.key === 'Escape') {
                updateProfileUI();
            }
        });

        input.addEventListener('blur', () => {
            saveNewName();
        });
    });

    const avatarInput = document.getElementById('avatar-file-input');
    document.getElementById('btn-edit-avatar').addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                userProfile.avatar = ev.target.result;
                saveProfile();
            };
            reader.readAsDataURL(file);
        }
    });

    updateProfileUI();

    // PAN Y ZOOM
    let scale = 1, panX = 0, panY = 0, isDragging = false, startX = 0, startY = 0;
    const viewport = document.getElementById('game-viewport');
    const container = document.getElementById('board-container');

    function updateTransform() {
        container.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`;
    }

    function resetView() {
        scale = 1; panX = 0; panY = 0;
        updateTransform();
    }

    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = 0.1;
        scale = e.deltaY < 0 ? Math.min(scale + factor, 2.5) : Math.max(scale - factor, 0.5);
        updateTransform();
    }, { passive: false });

    viewport.addEventListener('mousedown', (e) => {
        if (e.button === 0) { isDragging = true; startX = e.clientX - panX; startY = e.clientY - panY; }
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panX = e.clientX - startX; panY = e.clientY - startY;
        updateTransform();
    });
    window.addEventListener('mouseup', () => { isDragging = false; });

    document.getElementById('btn-reset-zoom').addEventListener('click', resetView);

    // TEMAS
    const savedTheme = localStorage.getItem('mahjong_global_theme') || 'black';
    ui.setGlobalTheme(savedTheme);

    const themeModal = document.getElementById('theme-menu-modal');
    document.getElementById('btn-global-theme').addEventListener('click', () => themeModal.classList.remove('hidden'));
    document.getElementById('btn-game-theme').addEventListener('click', () => themeModal.classList.remove('hidden'));
    document.getElementById('btn-close-theme-modal').addEventListener('click', () => themeModal.classList.add('hidden'));

    document.querySelectorAll('.btn-theme-opt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            ui.setGlobalTheme(e.currentTarget.dataset.theme);
            themeModal.classList.add('hidden');
        });
    });

    // NAVEGACIÓN
    document.getElementById('btn-start-game').addEventListener('click', startGame);
    document.getElementById('btn-custom-images').addEventListener('click', () => {
        ui.renderPreviews();
        ui.switchScreen('custom-screen');
    });
    document.getElementById('btn-back-menu').addEventListener('click', () => ui.switchScreen('start-menu'));
    document.getElementById('btn-quit').addEventListener('click', stopGame);
    document.getElementById('btn-dialog-menu').addEventListener('click', stopGame);
    document.getElementById('btn-dialog-restart').addEventListener('click', startGame);

    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    document.getElementById('btn-add-url').addEventListener('click', () => {
        const input = document.getElementById('url-input');
        if (input.value.trim()) {
            ui.customImages.push(input.value.trim());
            saveCustomImages();
            input.value = '';
        }
    });

    document.getElementById('btn-clear-images').addEventListener('click', () => {
        ui.customImages = [];
        saveCustomImages();
    });

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                ui.customImages.push(e.target.result);
                saveCustomImages();
            };
            reader.readAsDataURL(file);
        });
    }

    function saveCustomImages() {
        localStorage.setItem('mahjong_custom_imgs', JSON.stringify(ui.customImages));
        ui.renderPreviews();
    }

    let currentDifficultyName = 'Medio';
    let currentLayoutName = 'Tradicional';
    let isExpertActive = false;

    function startGame() {
        document.getElementById('dialog-overlay').classList.add('hidden');
        score = 0;
        secondsElapsed = 0;
        selectedTile = null;

        resetView();

        const diffEl = document.getElementById('difficulty-select');
        const layEl = document.getElementById('layout-select');
        
        currentDifficultyName = diffEl.options[diffEl.selectedIndex].text;
        currentLayoutName = layEl.options[layEl.selectedIndex].text;
        isExpertActive = document.getElementById('expert-mode-checkbox').checked;

        board.generateTiles(ui.getActiveImages(), diffEl.value, layEl.value, isExpertActive);
        ui.switchScreen('game-screen');
        
        updateStats();
        startTimer();
        ui.renderBoard(board, handleTileClick);
    }

    function recordGameStats() {
        userProfile.totalTimeSeconds += secondsElapsed;
        userProfile.lastScore = score;
        userProfile.totalScore = (userProfile.totalScore || 0) + score;
        if (score > (userProfile.maxScore || 0)) {
            userProfile.maxScore = score;
        }
        userProfile.lastGameDetails = `${currentDifficultyName} | ${currentLayoutName} (${isExpertActive ? 'Experto' : 'Normal'})`;
        saveProfile();
    }

    function stopGame() {
        clearInterval(timerInterval);
        recordGameStats();
        document.getElementById('dialog-overlay').classList.add('hidden');
        ui.switchScreen('start-menu');
    }

    function handleTileClick(tile) {
        const tileElements = document.querySelectorAll('.tile');
        const el = Array.from(tileElements).find(e => e.dataset.id == tile.id);

        if (tile.isBlocked) {
            soundFX.playTileError();
            if (el) {
                el.classList.add('shake-anim', 'selected');
                setTimeout(() => {
                    el.classList.remove('shake-anim', 'selected');
                }, 350);
            }
            return;
        }

        if (!selectedTile) {
            selectedTile = tile;
            soundFX.playTileSelect();
            if (el) el.classList.add('selected');
        } else if (selectedTile.id === tile.id) {
            selectedTile = null;
            soundFX.playTileSelect();
            if (el) el.classList.remove('selected');
        } else if (selectedTile.img === tile.img) {
            soundFX.playMatchSuccess();
            board.history.push([selectedTile.id, tile.id]);
            selectedTile.removed = true;
            tile.removed = true;
            selectedTile = null;
            score += 100;

            board.updateBlockedState();
            updateStats();
            ui.renderBoard(board, handleTileClick);
            checkGameStatus();
        } else {
            soundFX.playTileError();
            tileElements.forEach(e => e.classList.remove('selected'));
            selectedTile = tile;
            if (el) el.classList.add('selected');
        }
    }

    document.getElementById('btn-undo').addEventListener('click', () => {
        if (board.history.length === 0) return;
        const lastPair = board.history.pop();
        lastPair.forEach(id => {
            const tile = board.tiles.find(t => t.id === id);
            if (tile) tile.removed = false;
        });
        selectedTile = null;
        score = Math.max(0, score - 50);
        board.updateBlockedState();
        updateStats();
        ui.renderBoard(board, handleTileClick);
    });

    document.getElementById('btn-shuffle').addEventListener('click', () => {
        board.shuffleRemaining();
        selectedTile = null;
        ui.renderBoard(board, handleTileClick);
        checkGameStatus();
    });

    function checkGameStatus() {
        const remaining = board.tiles.filter(t => !t.removed).length;
        if (remaining === 0) {
            clearInterval(timerInterval);
            recordGameStats();
            soundFX.playWin();
            showDialog('¡Felicidades!', `Has completado el juego con ${score} pts en ${formatTime(secondsElapsed)}.`, true);
        } else if (!board.hasAvailableMoves()) {
            soundFX.playLose();
            showDialog('Sin movimientos', '¡No quedan parejas libres! Usa la opción Mezclar para continuar.', false);
        }
    }

    function showDialog(title, msg, isWin) {
        document.getElementById('dialog-title').innerText = title;
        document.getElementById('dialog-message').innerText = msg;
        
        const iconContainer = document.getElementById('dialog-icon-container');
        if (isWin) {
            iconContainer.innerHTML = '🎉🏆✨';
        } else {
            iconContainer.innerHTML = '😢💔💧';
        }

        document.getElementById('dialog-overlay').classList.remove('hidden');
    }

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            secondsElapsed++;
            document.getElementById('timer').innerText = formatTime(secondsElapsed);
        }, 1000);
    }

    function formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateStats() {
        document.getElementById('score').innerText = score;
        document.getElementById('tiles-left').innerText = board.tiles.filter(t => !t.removed).length;
    }
});