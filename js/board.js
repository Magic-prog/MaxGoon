class MahjongBoard {
    constructor() {
        this.tiles = [];
        this.history = [];
        this.currentDifficulty = 'medium';
        this.currentShape = 'traditional';
        this.expertMode = false;
    }

    getLayoutPositions(difficulty, shape) {
        // Cantidades duplicadas al doble
        const counts = { easy: 64, medium: 112, hard: 208 };
        const totalTarget = counts[difficulty] || 112;
        let coords = [];

        if (shape === 'cross') {
            for (let z = 0; z < 5; z++) {
                for (let r = z; r <= 6 - z; r++) for (let c = 4 + z; c <= 6 - z; c++) coords.push({ r, c, z });
                for (let r = 2 + z; r <= 4 - z; r++) for (let c = z; c <= 10 - z; c++) if (c < 4 || c > 6) coords.push({ r, c, z });
            }
        } 
        else if (shape === 'xshape') {
            for (let z = 0; z < 4; z++) {
                for (let i = z; i <= 6 - z; i++) {
                    coords.push({ r: i, c: i * 1.5 + z, z });
                    coords.push({ r: i, c: 9 - i * 1.5 - z, z });
                }
            }
        } 
        else if (shape === 'square') {
            for (let z = 0; z < 4; z++) {
                for (let c = z; c <= 9 - z; c++) { coords.push({ r: z, c, z }); coords.push({ r: 5 - z, c, z }); }
                for (let r = z + 1; r <= 4 - z; r++) { coords.push({ r, c: z, z }); coords.push({ r, c: 9 - z, z }); }
            }
        } 
        else if (shape === 'ring') {
            for (let z = 0; z < 3; z++) {
                const rx = 5.5 - z, ry = 2.5 - (z * 0.5), cx = 5.5, cy = 2.5;
                for (let a = 0; a < 360; a += 15) {
                    const rad = a * Math.PI / 180;
                    coords.push({ 
                        r: Math.round((cy + Math.sin(rad) * ry) * 10) / 10, 
                        c: Math.round((cx + Math.cos(rad) * rx) * 10) / 10, 
                        z 
                    });
                }
            }
        } 
        else {
            // TRADICIONAL / TORTUGA CON APILAMIENTO DENSO EN NIVELES (Z)
            // Capa base masiva (Z=0)
            for (let r = 0; r <= 5; r++) {
                for (let c = 0; c <= 12; c++) coords.push({ r, c, z: 0 });
            }
            // Capa intermedia amplia (Z=1)
            for (let r = 0.5; r <= 4.5; r++) {
                for (let c = 1; c <= 11; c++) coords.push({ r, c, z: 1 });
            }
            // Capa alta (Z=2)
            for (let r = 1; r <= 4; r++) {
                for (let c = 3; c <= 9; c++) coords.push({ r, c, z: 2 });
            }
            // Capa superior (Z=3)
            for (let r = 1.5; r <= 3.5; r++) {
                for (let c = 4; c <= 8; c++) coords.push({ r, c, z: 3 });
            }
            // Cúspide (Z=4 y Z=5)
            for (let r = 2; r <= 3; r++) {
                for (let c = 5; c <= 7; c++) {
                    coords.push({ r, c, z: 4 });
                    coords.push({ r, c, z: 5 });
                }
            }
        }

        const targetPairs = Math.floor(totalTarget / 2);
        let finalCoords = [...coords];

        // Rellenar o duplicar si faltan coordenadas para alcanzar la meta exacta
        while (finalCoords.length < targetPairs * 2) {
            const base = finalCoords[finalCoords.length % coords.length];
            finalCoords.push({ r: base.r, c: base.c, z: base.z + 1 });
        }

        return finalCoords.slice(0, targetPairs * 2);
    }

    generateTiles(imagesPool, difficulty = 'medium', shape = 'traditional', expert = false) {
        this.currentDifficulty = difficulty;
        this.currentShape = shape;
        this.expertMode = expert;
        this.tiles = [];
        this.history = [];

        const layoutConfig = this.getLayoutPositions(difficulty, shape);
        const totalPairs = layoutConfig.length / 2;

        const defaultPool = ['🍎', '🍌', '🍒', '🍉', '🍓', '🍋', '🍑', '🍍', '🥝', '🍇', '🥥', '🥑', '🥕', '🌽', '🍞', '🧀', '🍔', '🍕', '🌮', '🍣'];
        let activePool = [...imagesPool];
        
        if (activePool.length < totalPairs) {
            for (let d of defaultPool) {
                if (!activePool.includes(d) && activePool.length < totalPairs) {
                    activePool.push(d);
                }
            }
        }

        let imagePool = [];
        for (let i = 0; i < totalPairs; i++) {
            const imgSrc = activePool[i % activePool.length];
            imagePool.push(imgSrc, imgSrc);
        }

        imagePool.sort(() => Math.random() - 0.5);

        this.tiles = layoutConfig.map((pos, index) => ({
            id: index,
            r: pos.r,
            c: pos.c,
            z: pos.z,
            img: imagePool[index],
            removed: false
        }));

        this.updateBlockedState();
    }

    updateBlockedState() {
        this.tiles.forEach(tile => {
            if (tile.removed) return;

            const isCovered = this.tiles.some(other => 
                !other.removed && 
                other.z > tile.z && 
                Math.abs(other.r - tile.r) < 0.8 && 
                Math.abs(other.c - tile.c) < 0.8
            );

            const hasLeft = this.tiles.some(other => 
                !other.removed && 
                other.z === tile.z && 
                Math.abs(other.r - tile.r) < 0.5 && 
                other.c < tile.c && (tile.c - other.c) <= 1
            );

            const hasRight = this.tiles.some(other => 
                !other.removed && 
                other.z === tile.z && 
                Math.abs(other.r - tile.r) < 0.5 && 
                other.c > tile.c && (other.c - tile.c) <= 1
            );

            tile.isBlocked = isCovered || (hasLeft && hasRight);
        });
    }

    hasAvailableMoves() {
        const freeTiles = this.tiles.filter(t => !t.removed && !t.isBlocked);
        for (let i = 0; i < freeTiles.length; i++) {
            for (let j = i + 1; j < freeTiles.length; j++) {
                if (freeTiles[i].img === freeTiles[j].img) return true;
            }
        }
        return false;
    }

    shuffleRemaining() {
        const activeTiles = this.tiles.filter(t => !t.removed);
        const images = activeTiles.map(t => t.img).sort(() => Math.random() - 0.5);
        activeTiles.forEach((tile, index) => {
            tile.img = images[index];
        });
        this.updateBlockedState();
    }
}