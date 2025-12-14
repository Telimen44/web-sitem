// ============================================
// GÖRSEL ALGI DÜNYASI V3.0 - AKILLI TAHTA İÇİN OPTİMİZE
// Zamanlama ve Görsel Vurgu Ayarları
// ============================================

const gameState = {
    currentLevel: 0,
    currentRound: 1,
    score: 0,
    levels: ['level-1', 'level-2', 'level-3'],
    levelConfig: {
        'level-1': { maxRounds: 3, pointsPerRound: 10 },
        'level-2': { maxRounds: 10, pointsPerRound: 10 },
        'level-3': { maxRounds: 5, pointsPerRound: 10 }
    },
    usedAssets: [],
    selectedObject: null
};

// Asset Kütüphanesi
const assetLibrary = {
    animals: ['🦁', '🐘', '🐵', '🦒', '🦓', '🐯', '🐻', '🐰', '🦊', '🐨', '🐼', '🐸', '🐮', '🐷', '🐹', '🐭', '🐱', '🐶', '🦆', '🐢'],
    fruits: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍋', '🍉', '🍒', '🥝', '🍑', '🥭', '🍍', '🫐', '🍐'],
    ocean: ['🐟', '🐠', '🐡', '🐙', '🦀', '🦞', '🦐', '🦑', '🐬', '🐳', '🦈', '🐋', '🐢', '🦎'],
    objects: ['🚗', '🚕', '🚙', '🚌', '🏎️', '🚓', '🚑', '🚒', '🚲', '🛵', '🚂', '✈️', '🚁', '⛵', '🎈', '⭐']
};

const allAssets = [
    ...assetLibrary.animals,
    ...assetLibrary.fruits,
    ...assetLibrary.ocean,
    ...assetLibrary.objects
];

// ============================================
// SES SİSTEMİ (AudioContext ile gömülü)
// ============================================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    initAudio();
    const now = audioCtx.currentTime;

    if (type === 'correct' || type === 'ding') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'wrong' || type === 'bop') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'click' || type === 'select') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'win' || type === 'victory') {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, now + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.4);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.4);
        });
    } else if (type === 'levelComplete') {
        const notes = [392, 523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.5);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.5);
        });
    }
}

// ============================================
// KONFETİ ANİMASYONU
// ============================================
function createConfetti() {
    const container = document.getElementById('game-container');
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'];

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -20px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
            animation-delay: ${Math.random() * 0.5}s;
            z-index: 1000;
        `;
        container.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4000);
    }
}

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================
function getUniqueAssets(count, exclude = []) {
    const available = allAssets.filter(a => !exclude.includes(a) && !gameState.usedAssets.includes(a));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    gameState.usedAssets.push(...selected);
    return selected;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
}

function updateLevelHeader(levelId) {
    const config = gameState.levelConfig[levelId];
    const header = document.querySelector(`#${levelId} .level-header p`);
    if (header) {
        header.textContent = `Tur: ${gameState.currentRound} / ${config.maxRounds}`;
    }
}

// ============================================
// BÖLÜM GEÇİŞ EKRANı (Tebrikler + Konfeti)
// ============================================
function showLevelTransition(levelName, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'level-transition-overlay';
    overlay.innerHTML = `
        <div class="transition-content">
            <h2>🎉 Tebrikler! 🎉</h2>
            <p>${levelName} Tamamlandı!</p>
            <div class="transition-stars">⭐⭐⭐</div>
        </div>
    `;
    document.getElementById('game-container').appendChild(overlay);

    playSound('levelComplete');
    createConfetti();

    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 500);
    }, 2500);
}

// ============================================
// OYUN BAŞLATMA
// ============================================
document.getElementById('start-btn').addEventListener('click', () => {
    initAudio();
    playSound('click');
    startGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    playSound('click');
    location.reload();
});

function startGame() {
    gameState.currentLevel = 0;
    gameState.currentRound = 1;
    gameState.score = 0;
    gameState.usedAssets = [];
    gameState.selectedObject = null;
    loadLevel(gameState.currentLevel);
}

function loadLevel(levelIndex) {
    if (levelIndex >= gameState.levels.length) {
        showVictory();
        return;
    }

    const levelId = gameState.levels[levelIndex];
    gameState.currentRound = 1;
    gameState.selectedObject = null;
    showScreen(levelId);
    updateLevelHeader(levelId);

    if (levelId === 'level-1') initLevel1();
    else if (levelId === 'level-2') initLevel2();
    else if (levelId === 'level-3') initLevel3();
}

function nextRound() {
    const levelId = gameState.levels[gameState.currentLevel];
    const config = gameState.levelConfig[levelId];

    if (gameState.currentRound < config.maxRounds) {
        playSound('correct');
        gameState.currentRound++;
        gameState.selectedObject = null;
        updateLevelHeader(levelId);

        setTimeout(() => {
            if (levelId === 'level-1') initLevel1();
            else if (levelId === 'level-2') initLevel2();
            else if (levelId === 'level-3') initLevel3();
        }, 300);
    } else {
        const levelNames = {
            'level-1': 'Gölge Ormanı',
            'level-2': 'Farklı Olanı Bul',
            'level-3': 'Örüntü Treni'
        };

        showLevelTransition(levelNames[levelId], () => {
            gameState.currentLevel++;
            loadLevel(gameState.currentLevel);
        });
    }
}

// ============================================
// BÖLÜM 1: GÖLGE ORMANI (TIKLA-EŞLEŞTİR)
// V2.1: Nefes alan seçim animasyonu
// ============================================
function initLevel1() {
    const selectedAssets = getUniqueAssets(3);
    gameState.selectedObject = null;

    const shadowsContainer = document.querySelector('.shadows-container');
    const animalsContainer = document.querySelector('.animals-container');

    shadowsContainer.innerHTML = '';
    animalsContainer.innerHTML = '';

    const shadowOrder = shuffleArray(selectedAssets);
    const animalOrder = shuffleArray(selectedAssets);

    // Gölgeleri oluştur
    shadowOrder.forEach(emoji => {
        const shadowZone = document.createElement('div');
        shadowZone.classList.add('drop-zone');
        shadowZone.dataset.animal = emoji;

        const span = document.createElement('span');
        span.textContent = emoji;
        span.classList.add('emoji-asset', 'shadow');
        shadowZone.appendChild(span);

        shadowZone.addEventListener('click', () => handleShadowClick(shadowZone, emoji));
        shadowsContainer.appendChild(shadowZone);
    });

    // Renkli objeleri oluştur
    animalOrder.forEach(emoji => {
        const objectItem = document.createElement('div');
        objectItem.classList.add('clickable-item');
        objectItem.dataset.animal = emoji;

        const span = document.createElement('span');
        span.textContent = emoji;
        span.classList.add('emoji-asset');
        objectItem.appendChild(span);

        objectItem.addEventListener('click', () => handleObjectClick(objectItem, emoji));
        animalsContainer.appendChild(objectItem);
    });
}

function handleObjectClick(objectItem, emoji) {
    if (objectItem.classList.contains('matched')) return;

    playSound('select');

    document.querySelectorAll('.clickable-item.selected').forEach(item => {
        item.classList.remove('selected');
    });

    objectItem.classList.add('selected');
    gameState.selectedObject = { element: objectItem, emoji: emoji };
}

function handleShadowClick(shadowZone, shadowEmoji) {
    if (shadowZone.classList.contains('matched')) return;

    if (!gameState.selectedObject) {
        shadowZone.classList.add('shake');
        setTimeout(() => shadowZone.classList.remove('shake'), 300);
        return;
    }

    const { element: objectItem, emoji: objectEmoji } = gameState.selectedObject;

    if (objectEmoji === shadowEmoji) {
        playSound('correct');

        shadowZone.classList.add('matched');
        const shadowSpan = shadowZone.querySelector('.shadow');
        if (shadowSpan) {
            shadowSpan.classList.remove('shadow');
        }

        animateObjectToShadow(objectItem, shadowZone, () => {
            objectItem.classList.add('matched');
            objectItem.style.visibility = 'hidden';
            gameState.selectedObject = null;
            checkLevel1Completion();
        });

    } else {
        playSound('bop');
        shadowZone.classList.add('shake');
        objectItem.classList.remove('selected');
        gameState.selectedObject = null;

        setTimeout(() => shadowZone.classList.remove('shake'), 300);
    }
}

function animateObjectToShadow(objectItem, shadowZone, callback) {
    const objectRect = objectItem.getBoundingClientRect();
    const shadowRect = shadowZone.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();

    const startX = objectRect.left - containerRect.left;
    const startY = objectRect.top - containerRect.top;
    const endX = shadowRect.left - containerRect.left + (shadowRect.width - objectRect.width) / 2;
    const endY = shadowRect.top - containerRect.top + (shadowRect.height - objectRect.height) / 2;

    const clone = objectItem.cloneNode(true);
    clone.classList.remove('selected', 'clickable-item');
    clone.classList.add('flying-clone');
    clone.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: ${objectRect.width}px;
        height: ${objectRect.height}px;
        z-index: 100;
        transition: all 0.4s ease-in-out;
        pointer-events: none;
    `;

    document.getElementById('game-container').appendChild(clone);

    requestAnimationFrame(() => {
        clone.style.left = `${endX}px`;
        clone.style.top = `${endY}px`;
        clone.style.transform = 'scale(0.8)';
    });

    setTimeout(() => {
        clone.remove();
        if (callback) callback();
    }, 400);
}

function checkLevel1Completion() {
    const total = document.querySelectorAll('.drop-zone').length;
    const matched = document.querySelectorAll('.drop-zone.matched').length;
    if (total === matched) {
        setTimeout(nextRound, 500);
    }
}

// ============================================
// BÖLÜM 2: FARKLI OLANI BUL (KADEMELİ ZORLUK)
// V3.0: Zafer animasyonu - scale(1.1) + 1000ms bekleme
// ============================================
function initLevel2() {
    const grid = document.querySelector('.fish-grid');
    grid.innerHTML = '';

    let gridSize;
    if (gameState.currentRound <= 3) {
        gridSize = 2;
    } else if (gameState.currentRound <= 7) {
        gridSize = 3;
    } else {
        gridSize = 4;
    }

    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    const totalItems = gridSize * gridSize;
    const correctIndex = Math.floor(Math.random() * totalItems);
    const themeAsset = getUniqueAssets(1)[0];

    for (let i = 0; i < totalItems; i++) {
        const item = document.createElement('div');
        item.classList.add('fish-item');

        const span = document.createElement('span');
        span.textContent = themeAsset;
        span.classList.add('emoji-asset');

        if (i === correctIndex) {
            item.dataset.correct = 'true';

            if (gameState.currentRound <= 3) {
                span.style.filter = 'hue-rotate(120deg) saturate(1.5)';
            } else if (gameState.currentRound <= 5) {
                span.style.transform = 'scale(0.6)';
            } else if (gameState.currentRound <= 7) {
                span.style.transform = 'rotate(180deg) scale(0.85)';
            } else if (gameState.currentRound <= 9) {
                span.style.filter = 'hue-rotate(45deg)';
                span.style.transform = 'rotate(30deg)';
            } else {
                span.style.opacity = '0.6';
                span.style.filter = 'grayscale(30%)';
            }
        }

        item.appendChild(span);

        item.addEventListener('click', () => {
            if (item.classList.contains('disabled')) return;

            if (item.dataset.correct) {
                // V2.1: Zafer Animasyonu
                playSound('correct');

                document.querySelectorAll('.fish-item').forEach(fi => fi.classList.add('disabled'));

                // Doğru kartı büyüt (victory class)
                item.classList.add('victory');

                // V3.0: 1000ms bekle (1 saniye) - öğrenci başarısını algılasın
                setTimeout(nextRound, 1000);
            } else {
                // Hatasız Öğretim
                playSound('bop');
                item.classList.add('shake', 'faded', 'disabled');

                setTimeout(() => {
                    item.classList.remove('shake');
                }, 300);
            }
        });

        grid.appendChild(item);
    }
}

// ============================================
// BÖLÜM 3: ÖRÜNTÜ TRENİ (DEVASA BUTONLAR)
// V2.1: 160px+ butonlar
// ============================================
function initLevel3() {
    const patternRow = document.querySelector('.pattern-row');
    const optionsRow = document.querySelector('.options-row');

    patternRow.innerHTML = '';
    optionsRow.innerHTML = '';

    let patternType;
    if (gameState.currentRound <= 2) {
        patternType = 'ABAB';
    } else if (gameState.currentRound <= 4) {
        patternType = 'AAB';
    } else {
        patternType = 'ABC';
    }

    const selectedAssets = getUniqueAssets(3);
    const itemA = selectedAssets[0];
    const itemB = selectedAssets[1];
    const itemC = selectedAssets[2];

    let sequence = [];
    let answer = '';
    let options = [];

    if (patternType === 'ABAB') {
        sequence = [itemA, itemB, itemA];
        answer = itemB;
        options = [itemA, itemB, itemC];
    } else if (patternType === 'AAB') {
        sequence = [itemA, itemA, itemB, itemA];
        answer = itemA;
        options = [itemA, itemB, itemC];
    } else if (patternType === 'ABC') {
        sequence = [itemA, itemB, itemC];
        answer = itemA;
        options = [itemA, itemB, itemC];
    }

    sequence.forEach(emoji => {
        const item = document.createElement('div');
        item.classList.add('pattern-item');
        const span = document.createElement('span');
        span.textContent = emoji;
        span.classList.add('emoji-asset');
        item.appendChild(span);
        patternRow.appendChild(item);
    });

    const emptySlot = document.createElement('div');
    emptySlot.classList.add('pattern-item', 'empty');
    emptySlot.id = 'empty-slot';
    const questionMark = document.createElement('span');
    questionMark.textContent = '❓';
    questionMark.classList.add('question-mark');
    emptySlot.appendChild(questionMark);
    patternRow.appendChild(emptySlot);

    const shuffledOptions = shuffleArray(options);

    shuffledOptions.forEach(emoji => {
        const optionBtn = document.createElement('div');
        optionBtn.classList.add('option-item', 'large-option');
        const span = document.createElement('span');
        span.textContent = emoji;
        span.classList.add('emoji-asset');
        optionBtn.appendChild(span);

        optionBtn.addEventListener('click', () => {
            if (optionBtn.classList.contains('disabled')) return;

            document.querySelectorAll('.option-item').forEach(opt => opt.classList.add('disabled'));

            if (emoji === answer) {
                playSound('correct');
                optionBtn.classList.add('correct-choice');

                animateOptionToSlot(optionBtn, emptySlot, emoji, () => {
                    setTimeout(nextRound, 500);
                });
            } else {
                playSound('bop');
                optionBtn.classList.add('shake', 'wrong-choice');

                setTimeout(() => {
                    optionBtn.classList.remove('shake');
                    optionBtn.style.opacity = '0.3';
                    document.querySelectorAll('.option-item:not(.wrong-choice)').forEach(opt => {
                        opt.classList.remove('disabled');
                    });
                }, 300);
            }
        });

        optionsRow.appendChild(optionBtn);
    });
}

function animateOptionToSlot(optionBtn, emptySlot, emoji, callback) {
    const optionRect = optionBtn.getBoundingClientRect();
    const slotRect = emptySlot.getBoundingClientRect();
    const containerRect = document.getElementById('game-container').getBoundingClientRect();

    const startX = optionRect.left - containerRect.left;
    const startY = optionRect.top - containerRect.top;
    const endX = slotRect.left - containerRect.left + (slotRect.width - optionRect.width) / 2;
    const endY = slotRect.top - containerRect.top + (slotRect.height - optionRect.height) / 2;

    const clone = document.createElement('div');
    clone.classList.add('flying-option');
    const span = document.createElement('span');
    span.textContent = emoji;
    span.classList.add('emoji-asset');
    clone.appendChild(span);

    clone.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: ${optionRect.width}px;
        height: ${optionRect.height}px;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
        transition: all 0.4s ease-in-out;
        pointer-events: none;
        background: rgba(255,255,255,0.2);
        border-radius: 15px;
    `;

    document.getElementById('game-container').appendChild(clone);
    optionBtn.style.visibility = 'hidden';

    requestAnimationFrame(() => {
        clone.style.left = `${endX}px`;
        clone.style.top = `${endY}px`;
    });

    setTimeout(() => {
        clone.remove();

        emptySlot.innerHTML = '';
        emptySlot.classList.remove('empty');
        const newSpan = document.createElement('span');
        newSpan.textContent = emoji;
        newSpan.classList.add('emoji-asset');
        emptySlot.appendChild(newSpan);
        emptySlot.classList.add('filled');

        if (callback) callback();
    }, 400);
}

// ============================================
// ZAFER EKRANI
// ============================================
function showVictory() {
    showScreen('victory-screen');
    playSound('victory');

    setTimeout(createConfetti, 300);
    setTimeout(createConfetti, 800);
}