// --- GÖRSEL VERİTABANI ---
const categories = {
    animals: [
        { name: 'zebra', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f993.svg' },
        { name: 'elephant', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f418.svg' },
        { name: 'lion', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f981.svg' },
        { name: 'tiger', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f42f.svg' },
        { name: 'giraffe', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f992.svg' },
        { name: 'bear', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f43b.svg' },
        { name: 'fox', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f98a.svg' },
        { name: 'dog', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f436.svg' },
        { name: 'cat', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f431.svg' },
        { name: 'rabbit', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f430.svg' }
    ],
    fruits: [
        { name: 'apple', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f34e.svg' },
        { name: 'banana', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f34c.svg' },
        { name: 'orange', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f34a.svg' },
        { name: 'grapes', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f347.svg' },
        { name: 'strawberry', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f353.svg' },
        { name: 'pineapple', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f34d.svg' },
        { name: 'watermelon', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f349.svg' },
        { name: 'cherries', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f352.svg' },
        { name: 'pear', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f350.svg' },
        { name: 'peach', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f351.svg' }
    ],
    vehicles: [
        { name: 'car', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f697.svg' },
        { name: 'bus', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f68c.svg' },
        { name: 'airplane', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2708.svg' },
        { name: 'bicycle', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f6b2.svg' },
        { name: 'boat', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/26f5.svg' },
        { name: 'truck', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f69a.svg' },
        { name: 'police', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f694.svg' },
        { name: 'fire', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f692.svg' },
        { name: 'train', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f686.svg' },
        { name: 'rocket', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f680.svg' }
    ],
    objects: [
        { name: 'soccer', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/26bd.svg' },
        { name: 'basketball', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f3c0.svg' },
        { name: 'gift', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f381.svg' },
        { name: 'bulb', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4a1.svg' },
        { name: 'camera', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4f7.svg' },
        { name: 'clock', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f570.svg' },
        { name: 'phone', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4f1.svg' },
        { name: 'umbrella', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2602.svg' },
        { name: 'computer', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4bb.svg' },
        { name: 'book', image: 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f4d6.svg' }
    ]
};

// --- SES SİSTEMİ (İnternet Linkleri) ---
const sounds = {
    flip: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-ball-tap-2073.mp3'),
    match: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
    error: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3'),
    win: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-audience-cartoon-applause-348.mp3')
};

function playSound(type) {
    if (sounds[type]) {
        sounds[type].currentTime = 0;
        // Tarayıcı izin verirse çal
        sounds[type].play().catch(e => console.log("Ses oynatma bekleniyor (Tıklama gerekli)"));
    }
}

// --- OYUN DEĞİŞKENLERİ ---
let cards = [];
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchedPairs = 0;
let moves = 0;
let time = 0;
let timerInterval;

// Global HTML değişkenleri
// selectedCat, selectedSize HTML scriptinden gelir

// DOM Elementleri
const grid = document.getElementById('grid');
const moveDisplay = document.getElementById('moves');
const timerDisplay = document.getElementById('timer');
const configScreen = document.getElementById('config-screen');
const gameArea = document.getElementById('game-area');
const winModal = document.getElementById('win-modal');

function startGame() {
    configScreen.style.display = 'none';
    gameArea.style.display = 'flex';

    // Grid Ayarı
    let cols = 4;
    if (selectedSize === 20) cols = 5;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    // Kartları Hazırla
    const items = categories[selectedCat];
    const pairsNeeded = selectedSize / 2;

    // Shuffle and select unique items
    let shuffledItems = [...items].sort(() => 0.5 - Math.random());

    // Fallback if not enough items
    while (shuffledItems.length < pairsNeeded) {
        shuffledItems = [...shuffledItems, ...items];
    }

    let selectedItems = shuffledItems.slice(0, pairsNeeded);

    let deck = [...selectedItems, ...selectedItems];
    deck.sort(() => 0.5 - Math.random());

    // HTML Oluştur
    grid.innerHTML = '';
    deck.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.name = item.name;

        // Ön Yüz (Desen)
        const frontFace = document.createElement('div');
        frontFace.classList.add('front-face');
        frontFace.innerHTML = '?';

        // Arka Yüz (Resim)
        const backFace = document.createElement('div');
        backFace.classList.add('back-face');
        const img = document.createElement('img');
        img.src = item.image;
        backFace.appendChild(img);

        card.appendChild(frontFace);
        card.appendChild(backFace);

        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });

    // Sesleri ısındır
    sounds.flip.load();
    sounds.match.load();

    startTimer();
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flipped');
    playSound('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    moves++;
    moveDisplay.textContent = moves;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.name === secondCard.dataset.name;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    lockBoard = true;

    setTimeout(() => {
        playSound('match');
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');

        matchedPairs++;
        if (matchedPairs === selectedSize / 2) {
            endGame();
        }

        resetBoard();
    }, 500);
}

function unflipCards() {
    lockBoard = true;

    setTimeout(() => {
        playSound('error');
        firstCard.classList.add('wrong');
        secondCard.classList.add('wrong');
    }, 400);

    setTimeout(() => {
        firstCard.classList.remove('flipped', 'wrong');
        secondCard.classList.remove('flipped', 'wrong');
        resetBoard();
    }, 1200);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function startTimer() {
    timerInterval = setInterval(() => {
        time++;
        let m = Math.floor(time / 60);
        let s = time % 60;
        timerDisplay.textContent = `${m}:${s < 10 ? '0' + s : s}`;
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    setTimeout(() => {
        playSound('win');

        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }

        document.getElementById('final-time').textContent = timerDisplay.textContent;
        document.getElementById('final-moves').textContent = moves;

        let stars = "⭐";
        if (moves <= selectedSize) stars = "⭐⭐⭐";
        else if (moves <= selectedSize * 1.5) stars = "⭐⭐";
        document.getElementById('stars').textContent = stars;

        winModal.style.display = 'flex';
    }, 800);
}