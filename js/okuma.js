const questions = [
    { icon: "🍎", answer: "ELMA", options: ["ELMA", "ARMUT", "MUZ"] },
    { icon: "🚗", answer: "ARABA", options: ["UÇAK", "ARABA", "GEMİ"] },
    { icon: "🐱", answer: "KEDİ", options: ["KÖPEK", "KEDİ", "KUŞ"] },
    { icon: "🏠", answer: "EV", options: ["OKUL", "PARK", "EV"] },
    { icon: "⚽", answer: "TOP", options: ["TOP", "BALON", "KUTU"] },
    { icon: "🚲", answer: "BİSİKLET", options: ["ARABA", "BİSİKLET", "OTOBÜS"] },
    { icon: "🥛", answer: "SÜT", options: ["SU", "SÜT", "ÇAY"] },
    { icon: "🌞", answer: "GÜNEŞ", options: ["AY", "YILDIZ", "GÜNEŞ"] },
    { icon: "🌲", answer: "AĞAÇ", options: ["ÇİÇEK", "AĞAÇ", "YAPRAK"] },
    { icon: "📚", answer: "KİTAP", options: ["DEFTER", "KALEM", "KİTAP"] }
];

let currentQuestion = 0;
let score = 0;
let isAnswering = false;

const questionIcon = document.getElementById('question-icon');
const optionsContainer = document.getElementById('options-container');
const scoreElement = document.getElementById('score');
const feedbackText = document.getElementById('feedback-text');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startGame() {
    score = 0;
    currentQuestion = 0;
    scoreElement.textContent = score;
    loadQuestion();
}

function loadQuestion() {
    isAnswering = true;
    feedbackText.textContent = "Hangi kelime?";
    feedbackText.style.color = "#2c3e50";

    // Pick a random question
    const q = questions[Math.floor(Math.random() * questions.length)];

    questionIcon.textContent = q.icon;
    optionsContainer.innerHTML = '';

    // Shuffle options
    const currentOptions = [...q.options];
    shuffleArray(currentOptions);

    currentOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(btn, opt, q.answer);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(btn, selected, correct) {
    if (!isAnswering) return;
    isAnswering = false;

    if (selected === correct) {
        btn.classList.add('correct');
        score += 10;
        scoreElement.textContent = score;
        feedbackText.textContent = "Harika! Doğru Bildin! 🎉";
        feedbackText.style.color = "var(--success-color)";
        setTimeout(loadQuestion, 1500);
    } else {
        btn.classList.add('wrong');
        feedbackText.textContent = "Tekrar dene bakalım! 🤔";
        feedbackText.style.color = "var(--error-color)";
        isAnswering = true; // Allow trying again
    }
}

// Start the game on load
startGame();
