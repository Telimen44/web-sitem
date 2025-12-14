const shapes = [
    { id: 'kare', name: 'KARE', icon: '🟧', class: 'shape-kare' },
    { id: 'daire', name: 'DAİRE', icon: '🔵', class: 'shape-daire' },
    { id: 'ucgen', name: 'ÜÇGEN', icon: '🔺', class: 'shape-ucgen' },
    { id: 'yildiz', name: 'YILDIZ', icon: '⭐', class: 'shape-yildiz' },
    { id: 'dikdortgen', name: 'DİKDÖRTGEN', icon: '▬', class: 'shape-dikdortgen' },
    { id: 'besgen', name: 'BEŞGEN', icon: '⬟', class: 'shape-besgen' }
];

let currentLevel = 1;
let score = 0;
let currentTarget = null;
let isProcessing = false;

const container = document.getElementById('shapes-container');
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

function getDifficulty(level) {
    if (level <= 2) return 2; // 2 shapes
    if (level <= 5) return 3; // 3 shapes
    if (level <= 10) return 4; // 4 shapes
    return 5; // Max 5 shapes
}

function loadLevel() {
    isProcessing = false;
    container.innerHTML = '';
    feedbackMsg.textContent = '';

    // Determine number of shapes based on level
    const numShapes = getDifficulty(currentLevel);

    // Shuffle and pick shapes
    const shuffled = [...shapes].sort(() => 0.5 - Math.random());
    const levelShapes = shuffled.slice(0, numShapes);

    // Pick a target
    currentTarget = levelShapes[Math.floor(Math.random() * levelShapes.length)];

    // Update instruction
    instruction.innerHTML = `<span style="color:var(--primary-color)">${currentTarget.name}</span> Olanı Bul! ${currentTarget.icon}`;

    // Render shapes
    // Shuffle again so target isn't always in same spot relative to selection
    levelShapes.sort(() => 0.5 - Math.random()).forEach(shape => {
        const el = document.createElement('div');
        el.className = `sekil ${shape.class}`;
        el.onclick = () => handleShapeClick(shape, el);

        // Add pop-in animation
        el.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        container.appendChild(el);
    });
}

function handleShapeClick(shape, element) {
    if (isProcessing) return;

    if (shape.id === currentTarget.id) {
        // Correct
        isProcessing = true;
        score += 10;
        currentLevel++;
        updateHUD();

        feedbackMsg.textContent = "HARİKA! 👏";
        feedbackMsg.style.color = "var(--success-color)";

        // Success animation
        element.style.transform = "scale(1.2) rotate(10deg)";

        setTimeout(() => {
            loadLevel();
        }, 1500);
    } else {
        // Wrong
        feedbackMsg.textContent = "Tekrar Dene! 🤔";
        feedbackMsg.style.color = "var(--error-color)";

        // Shake animation
        element.style.animation = 'shake 0.5s';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
}

// Add keyframe for popIn if not in CSS, but it is in CSS from previous step.
// Start the game
startGame();
