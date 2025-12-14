const colorAssets = [
    { id: 'kirmizi', name: 'KIRMIZI', color: '#ff4757', items: ['🍎', '🚗', '🌹', '🎈', '🍓'] },
    { id: 'mavi', name: 'MAVİ', color: '#1e90ff', items: ['🚙', '🐳', '👖', '💎', '🧢'] },
    { id: 'yesil', name: 'YEŞİL', color: '#2ed573', items: ['🐸', '🌲', '🍏', '🥦', '🐢'] },
    { id: 'sari', name: 'SARI', color: '#ffa502', items: ['🌞', '🍌', '🍋', '🧀', '🐥'] },
    { id: 'mor', name: 'MOR', color: '#a55eea', items: ['🍇', '🍆', '☂️', '👾', '🔮'] },
    { id: 'turuncu', name: 'TURUNCU', color: '#ff7f50', items: ['🍊', '🏀', '🥕', '🦊', '🎃'] }
];

let currentLevel = 1;
let score = 0;
let currentTarget = null;
let isProcessing = false;

const grid = document.getElementById('colors-grid');
const instruction = document.getElementById('instruction');
const levelDisplay = document.getElementById('level');
const scoreDisplay = document.getElementById('score');
const feedbackMsg = document.getElementById('feedback-msg');

function startGame() {
    currentLevel = 1;
    score = 0;
    updateHUD();
    loadLevel();
}

function updateHUD() {
    levelDisplay.textContent = currentLevel;
    scoreDisplay.textContent = score;
}

function getGridSize(level) {
    if (level <= 3) return 2; // 2x2 = 4 items
    if (level <= 6) return 3; // 3x3 = 9 items (CSS needs update for this)
    return 3; // Max 3x3 for now to keep icons large
}

function loadLevel() {
    isProcessing = false;
    grid.innerHTML = '';
    feedbackMsg.textContent = '';

    const gridSize = getGridSize(currentLevel);
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // Determine how many items needed
    const numItems = gridSize * gridSize;

    // Pick a target color
    // In early levels, stick to Red/Blue/Green. Later mix all.
    const availableColors = currentLevel <= 2 ? colorAssets.slice(0, 2) : colorAssets;
    currentTarget = availableColors[Math.floor(Math.random() * availableColors.length)];

    // Create the grid items
    const levelItems = [];

    // Add at least one correct item
    levelItems.push({
        type: 'correct',
        data: currentTarget,
        icon: currentTarget.items[Math.floor(Math.random() * currentTarget.items.length)]
    });

    // Fill the rest with distractors
    while (levelItems.length < numItems) {
        const distractorColor = colorAssets.filter(c => c.id !== currentTarget.id)[Math.floor(Math.random() * (colorAssets.length - 1))];
        levelItems.push({
            type: 'wrong',
            data: distractorColor,
            icon: distractorColor.items[Math.floor(Math.random() * distractorColor.items.length)]
        });
    }

    // Shuffle grid
    levelItems.sort(() => 0.5 - Math.random());

    // Update Instruction
    instruction.innerHTML = `<span style="color:${currentTarget.color}">${currentTarget.name}</span> Olanı Bul!`;

    // Render
    levelItems.forEach(item => {
        const el = document.createElement('div');
        el.className = 'color-item';
        el.textContent = item.icon;
        el.style.borderColor = item.data.color; // Subtle hint

        el.onclick = () => handleItemClick(item, el);

        // Pop in animation
        el.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        grid.appendChild(el);
    });
}

function handleItemClick(item, element) {
    if (isProcessing) return;

    if (item.type === 'correct') {
        // Correct
        isProcessing = true;
        score += 10;
        currentLevel++;
        updateHUD();

        feedbackMsg.textContent = "SÜPERSİN! 🌟";
        feedbackMsg.style.color = "var(--success-color)";

        element.style.transform = "scale(1.2) rotate(360deg)";
        element.style.background = "#dff9fb";

        setTimeout(() => {
            loadLevel();
        }, 1500);
    } else {
        // Wrong
        feedbackMsg.textContent = "Dikkatli Bak! 👀";
        feedbackMsg.style.color = "var(--error-color)";

        element.style.animation = 'shake 0.5s';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
}

startGame();
