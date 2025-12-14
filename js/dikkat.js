const cardsArray = [
    { name: 'dog', icon: '🐶' },
    { name: 'cat', icon: '🐱' },
    { name: 'mouse', icon: '🐭' },
    { name: 'hamster', icon: '🐹' },
    { name: 'rabbit', icon: '🐰' },
    { name: 'fox', icon: '🦊' },
    { name: 'bear', icon: '🐻' },
    { name: 'panda', icon: '🐼' }
];

let moves = 0;
let matches = 0;
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;

const grid = document.getElementById('memory-grid');
const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');

function resetGame() {
    grid.innerHTML = '';
    moves = 0;
    matches = 0;
    movesDisplay.textContent = moves;
    matchesDisplay.textContent = matches;
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];

    // Duplicate and shuffle
    const gameCards = [...cardsArray, ...cardsArray];
    gameCards.sort(() => 0.5 - Math.random());

    gameCards.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.name = item.name;

        const front = document.createElement('div');
        front.classList.add('front-face');
        front.textContent = item.icon;

        const back = document.createElement('div');
        back.classList.add('back-face');
        back.textContent = '?';

        card.appendChild(front);
        card.appendChild(back);
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

function checkForMatch() {
    moves++;
    movesDisplay.textContent = moves;

    let isMatch = firstCard.dataset.name === secondCard.dataset.name;

    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    matches++;
    matchesDisplay.textContent = matches;

    if (matches === cardsArray.length) {
        setTimeout(() => alert('Tebrikler! Oyunu bitirdiniz! 🎉'), 500);
    }

    resetBoard();
}

function unflipCards() {
    lockBoard = true;

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

// Start game
resetGame();
