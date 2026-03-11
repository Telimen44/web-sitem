(function () {
    const root = document.getElementById('counting-expedition-app');
    const screenEl = document.getElementById('appScreen');
    const toastEl = document.getElementById('feedbackToast');
    const particleLayer = document.getElementById('particleLayer');
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    const STORAGE_KEY = 'sayi-treni-seferi-progress-v1';
    const OBJECT_ICONS = ['🍎', '⭐', '🚂', '🧩', '🪁', '🎈', '🌼', '🟡'];
    const POSITIVE_MESSAGES = ['Harika!', 'Süper!', 'Doğru cevap!', 'Mükemmel gitti!', 'Bravo!'];
    const GENTLE_MESSAGES = ['Biraz daha dikkat!', 'Tekrar deneyelim!', 'Yaklaştın, yeniden bak!', 'İpucunu kontrol et!'];

    const DIFFICULTIES = {
        easy: {
            id: 'easy',
            label: 'Kolay',
            subtitle: '1-10 arası güvenli başlangıç',
            description: 'Nesne sayma, 1’er ileri sayma ve basit eşleştirme görevleri.',
            range: { min: 1, max: 10 },
            pathSteps: [1],
            canGoBackward: false,
            challengeSeconds: 50
        },
        medium: {
            id: 'medium',
            label: 'Orta',
            subtitle: '1-20 arası akıllı görevler',
            description: 'Eksik sayı, geri sayma ve 2’şer ritmik sayma çalışmaları.',
            range: { min: 1, max: 20 },
            pathSteps: [1, 2],
            canGoBackward: true,
            challengeSeconds: 45
        },
        hard: {
            id: 'hard',
            label: 'Zor',
            subtitle: '5 ve 10 adımlı uzun yol',
            description: '5’er, 10’ar ve karışık uzun dizilerle ileri seviye tekrar.',
            range: { min: 5, max: 100 },
            pathSteps: [2, 5, 10],
            canGoBackward: true,
            challengeSeconds: 40
        }
    };

    const MODES = [
        { id: 'recognize', title: 'Sayıyı Tanı', shortTitle: 'Sayıyı Tanı', icon: '🔢', color: '#2f7df6', description: 'Büyük sayıyı, adını ve nesne miktarını birlikte keşfet.' },
        { id: 'count', title: 'Nesne Say ve Eşleştir', shortTitle: 'Nesne Say', icon: '🍎', color: '#11b9b5', description: 'Ekrandaki nesneleri say, doğru sayı kartını seç.' },
        { id: 'sequence', title: 'Sıralamayı Tamamla', shortTitle: 'Sıralama', icon: '🧠', color: '#ff9f43', description: 'Eksik kutuları dokunarak doldur, sayı akışını koru.' },
        { id: 'path', title: 'Ritmik Sayma Yolu', shortTitle: 'Ritim Yolu', icon: '🚂', color: '#ff6f91', description: 'Doğru ritmi yakala, sayı trenini istasyondan istasyona taşı.' },
        { id: 'missing', title: 'Eksik Sayıları Bul', shortTitle: 'Eksik Sayılar', icon: '🧩', color: '#6c63ff', description: 'Birden fazla boşluğu doldur, örüntüyü çöz.' },
        { id: 'challenge', title: 'Hızlı Tur', shortTitle: 'Hızlı Tur', icon: '⚡', color: '#2dcf78', description: 'Kısa sürede seri yap, öğrendiklerini eğlenceli bir turla pekiştir.' }
    ];

    const state = {
        screen: 'start',
        difficulty: 'easy',
        activeMode: null,
        round: 0,
        totalRounds: 5,
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        streak: 0,
        bestStreak: 0,
        stars: 0,
        feedback: null,
        feedbackMs: 0,
        task: null,
        optionState: null,
        challengeMs: 0,
        journeyProgress: 0,
        pathPlan: null,
        modeStats: loadProgress(),
        audioEnabled: true
    };

    class ClassroomAudioManager {
        constructor() {
            this.ctx = null;
            this.enabled = true;
            this.voiceReady = 'speechSynthesis' in window;
        }

        setEnabled(enabled) {
            this.enabled = enabled;
        }

        ensureContext() {
            if (!this.enabled) return null;
            if (!this.ctx) {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (Ctx) this.ctx = new Ctx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => { });
            }
            return this.ctx;
        }

        playTone(frequency, duration, type, gainValue) {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
            gain.gain.setValueAtTime(gainValue, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + duration);
        }

        playClick() {
            this.playTone(440, 0.08, 'triangle', 0.05);
        }

        playSuccess() {
            this.playTone(740, 0.14, 'sine', 0.08);
            setTimeout(() => this.playTone(987, 0.18, 'sine', 0.06), 80);
        }

        playError() {
            this.playTone(220, 0.16, 'sawtooth', 0.05);
        }

        speakNumber(number) {
            if (!this.enabled || !this.voiceReady || !window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(numberToTurkish(number));
            utterance.lang = 'tr-TR';
            utterance.rate = 0.88;
            utterance.pitch = 1.08;
            window.speechSynthesis.speak(utterance);
        }
    }

    const audioManager = new ClassroomAudioManager();
    let rafId = null;
    let lastFrame = performance.now();

    init();

    function init() {
        soundToggleBtn.addEventListener('click', () => {
            state.audioEnabled = !state.audioEnabled;
            audioManager.setEnabled(state.audioEnabled);
            soundToggleBtn.textContent = state.audioEnabled ? '🔊' : '🔇';
            soundToggleBtn.setAttribute('aria-label', state.audioEnabled ? 'Sesi kapat' : 'Sesi aç');
            audioManager.playClick();
        });

        fullscreenBtn.addEventListener('click', async () => {
            audioManager.playClick();
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen().catch(() => { });
            } else {
                await document.exitFullscreen().catch(() => { });
            }
        });

        document.addEventListener('fullscreenchange', updateFullscreenIcon);
        window.addEventListener('keydown', handleKeydown);
        root.addEventListener('click', handleRootClick);
        root.addEventListener('dragstart', handleDragStart);
        root.addEventListener('dragover', handleDragOver);
        root.addEventListener('drop', handleDrop);

        if (applyQueryBootstrap()) {
            return;
        }

        render();
        startLoop();
    }

    function startLoop() {
        cancelAnimationFrame(rafId);
        lastFrame = performance.now();
        const frame = (now) => {
            processTime(Math.min(80, now - lastFrame));
            lastFrame = now;
            rafId = requestAnimationFrame(frame);
        };
        rafId = requestAnimationFrame(frame);
    }

    function processTime(delta) {
        if (state.feedbackMs > 0) {
            state.feedbackMs = Math.max(0, state.feedbackMs - delta);
            if (state.feedbackMs === 0) hideToast();
        }

        if (state.screen === 'game' && state.activeMode === 'challenge' && state.challengeMs > 0) {
            state.challengeMs = Math.max(0, state.challengeMs - delta);
            const timerEl = document.querySelector('[data-role="challenge-timer"]');
            if (timerEl) timerEl.textContent = formatSeconds(state.challengeMs);
            if (state.challengeMs === 0) finishMode();
        }
    }

    function handleKeydown(event) {
        if (event.key.toLowerCase() === 'f') fullscreenBtn.click();
    }

    function updateFullscreenIcon() {
        fullscreenBtn.textContent = document.fullscreenElement ? '⤡' : '⤢';
        fullscreenBtn.setAttribute('aria-label', document.fullscreenElement ? 'Tam ekrandan çık' : 'Tam ekran aç');
    }

    function applyQueryBootstrap() {
        const params = new URLSearchParams(window.location.search);
        const requestedDifficulty = params.get('difficulty');
        if (requestedDifficulty && DIFFICULTIES[requestedDifficulty]) {
            state.difficulty = requestedDifficulty;
        }

        const requestedScreen = params.get('screen');
        if (requestedScreen === 'modes') {
            state.screen = 'modes';
            render();
            startLoop();
            return true;
        }

        const requestedMode = params.get('mode');
        if (params.get('autostart') === '1' && MODES.some((mode) => mode.id === requestedMode)) {
            beginMode(requestedMode);
            startLoop();
            return true;
        }

        return false;
    }

    function handleRootClick(event) {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) return;
        const { action, value, index } = actionEl.dataset;
        audioManager.playClick();

        if (action === 'set-difficulty') {
            state.difficulty = value;
            render();
            return;
        }
        if (action === 'go-modes') {
            state.screen = 'modes';
            render();
            return;
        }
        if (action === 'back-start') {
            state.screen = 'start';
            render();
            return;
        }
        if (action === 'start-mode') {
            beginMode(value);
            return;
        }
        if (action === 'select-answer') {
            evaluateAnswer(Number(value) === state.task.answer);
            return;
        }
        if (action === 'select-blank') {
            state.optionState.activeBlank = Number(index);
            render();
            return;
        }
        if (action === 'pick-option') {
            fillBlank(Number(value));
            return;
        }
        if (action === 'clear-blanks') {
            clearBlanks();
            return;
        }
        if (action === 'submit-sequence') {
            submitSequenceAnswer();
            return;
        }
        if (action === 'hear-number') {
            playPromptAudio();
            return;
        }
        if (action === 'play-again') {
            beginMode(state.activeMode);
            return;
        }
        if (action === 'change-mode') {
            state.screen = 'modes';
            state.activeMode = null;
            render();
            return;
        }
        if (action === 'change-difficulty') {
            state.screen = 'start';
            render();
        }
    }

    function handleDragStart(event) {
        const optionEl = event.target.closest('[data-draggable-option]');
        if (!optionEl || optionEl.classList.contains('is-used')) return;
        event.dataTransfer.setData('text/plain', optionEl.dataset.value);
    }

    function handleDragOver(event) {
        if (event.target.closest('[data-drop-slot]')) event.preventDefault();
    }

    function handleDrop(event) {
        const slotEl = event.target.closest('[data-drop-slot]');
        if (!slotEl) return;
        event.preventDefault();
        state.optionState.activeBlank = Number(slotEl.dataset.index);
        fillBlank(Number(event.dataTransfer.getData('text/plain')));
    }

    function beginMode(modeId) {
        state.activeMode = modeId;
        state.screen = 'game';
        state.round = 0;
        state.score = 0;
        state.correctCount = 0;
        state.wrongCount = 0;
        state.streak = 0;
        state.bestStreak = 0;
        state.stars = 0;
        state.feedback = null;
        state.feedbackMs = 0;
        state.journeyProgress = 0;
        state.pathPlan = null;
        state.challengeMs = modeId === 'challenge' ? DIFFICULTIES[state.difficulty].challengeSeconds * 1000 : 0;
        state.totalRounds = 5;
        nextTask();
        render();
    }

    function nextTask() {
        state.task = buildTask(state.activeMode);
        if (state.task.answerType === 'multi') {
            state.optionState = {
                activeBlank: 0,
                values: new Array(state.task.answers.length).fill(null)
            };
        } else {
            state.optionState = null;
        }
    }

    function evaluateAnswer(isCorrect) {
        if (isCorrect) {
            state.score += state.task.points || 10;
            state.correctCount += 1;
            state.streak += 1;
            state.bestStreak = Math.max(state.bestStreak, state.streak);
            audioManager.playSuccess();
            showFeedback(true, `${sample(POSITIVE_MESSAGES)} ${state.task.successText || ''}`.trim());
            burstParticles();
            advanceAfterSuccess();
            return;
        }

        state.wrongCount += 1;
        state.streak = 0;
        audioManager.playError();
        showFeedback(false, `${sample(GENTLE_MESSAGES)} ${state.task.errorText || ''}`.trim());
    }

    function advanceAfterSuccess() {
        if (state.activeMode === 'challenge') {
            nextTask();
            render();
            return;
        }

        state.round += 1;
        if (state.activeMode === 'path') state.journeyProgress += 1;

        if (state.round >= state.totalRounds) {
            finishMode();
            return;
        }

        nextTask();
        render();
    }

    function fillBlank(value) {
        if (!state.optionState) return;
        const values = state.optionState.values.slice();
        let target = state.optionState.activeBlank;
        if (values[target] != null) target = values.findIndex((item) => item == null);
        if (target === -1) target = state.optionState.activeBlank;
        values[target] = value;
        state.optionState.values = values;
        const nextEmpty = values.findIndex((item) => item == null);
        state.optionState.activeBlank = nextEmpty === -1 ? target : nextEmpty;
        render();
    }

    function clearBlanks() {
        if (!state.optionState) return;
        state.optionState.values = new Array(state.task.answers.length).fill(null);
        state.optionState.activeBlank = 0;
        render();
    }

    function submitSequenceAnswer() {
        if (!state.optionState) return;
        if (state.optionState.values.some((value) => value == null)) {
            showFeedback(false, 'Önce tüm boş kutuları dolduralım.');
            return;
        }
        const isCorrect = state.optionState.values.every((value, index) => value === state.task.answers[index]);
        evaluateAnswer(isCorrect);
    }

    function finishMode() {
        state.stars = calculateStars();
        saveModeStats();
        state.screen = 'summary';
        render();
    }

    function calculateStars() {
        const accuracy = getAccuracy();
        if (state.activeMode === 'challenge') {
            if (state.score >= 120) return 3;
            if (state.score >= 80) return 2;
            return 1;
        }
        if (accuracy >= 90) return 3;
        if (accuracy >= 65) return 2;
        return 1;
    }

    function saveModeStats() {
        const key = `${state.activeMode}:${state.difficulty}`;
        const previous = state.modeStats[key] || { bestStars: 0, bestScore: 0, plays: 0 };
        state.modeStats[key] = {
            bestStars: Math.max(previous.bestStars, state.stars),
            bestScore: Math.max(previous.bestScore, state.score),
            plays: previous.plays + 1
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.modeStats));
    }

    function render() {
        if (state.screen === 'start') {
            renderStartScreen();
        } else if (state.screen === 'modes') {
            renderModeScreen();
        } else if (state.screen === 'game') {
            renderGameScreen();
        } else {
            renderSummaryScreen();
        }
        syncTestingHooks();
    }

    function renderStartScreen() {
        const selected = DIFFICULTIES[state.difficulty];
        screenEl.innerHTML = `
            <div class="ce-start-layout">
                <section class="ce-panel ce-hero-card">
                    <span class="ce-hero-eyebrow">🚂 Yeni sınıf görevi</span>
                    <h2 class="ce-hero-title">Sayıları sıraya diz,<br>ritmi yakala,<br>treni finale ulaştır.</h2>
                    <p class="ce-hero-text">Bu görev paketi sayı tanıma, nesne sayma, ileri-geri sayma, eksik sayı bulma ve 2’şer, 5’er, 10’ar ritmik saymayı tek oyunda birleştirir.</p>
                    <div class="ce-skill-pills" style="margin:22px 0 18px;">
                        <span class="ce-skill-pill">🔢 Sayıyı tanı</span>
                        <span class="ce-skill-pill">🧮 Nesne say</span>
                        <span class="ce-skill-pill">🧠 Sırayı tamamla</span>
                        <span class="ce-skill-pill">⬆️⬇️ İleri / geri say</span>
                        <span class="ce-skill-pill">🎯 2, 5, 10 ritmi</span>
                    </div>
                    <div class="ce-train-preview">
                        <div class="ce-track-line"></div>
                        <div class="ce-track-stations"><span></span><span></span><span></span><span></span><span></span></div>
                        <div class="ce-train-engine" aria-hidden="true"><div class="ce-wheel-row"><span></span><span></span><span></span></div></div>
                    </div>
                </section>

                <aside class="ce-panel ce-side-card">
                    <div>
                        <h3 class="ce-card-title">Seviyeni seç</h3>
                        <p class="ce-meta-text">Her zorluk seviyesi farklı sayı aralıkları ve görev türleriyle hazırlanmıştır.</p>
                    </div>
                    <div class="ce-difficulty-grid">${Object.values(DIFFICULTIES).map(renderDifficultyButton).join('')}</div>
                    <div class="ce-panel" style="padding:20px; border-radius:26px; background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(235,245,255,0.96));">
                        <p class="ce-hero-eyebrow" style="margin:0 0 10px;">Seçilen rota</p>
                        <h3 class="ce-card-title" style="margin-bottom:6px;">${selected.label}</h3>
                        <p class="ce-meta-text">${selected.description}</p>
                    </div>
                    <div class="ce-action-row"><button type="button" class="ce-primary-btn" data-action="go-modes">Görevleri Aç <span aria-hidden="true">→</span></button></div>
                    <p class="ce-section-caption">İstersen her modülü ayrı oynayabilir ya da hızlı turda karışık tekrar yapabilirsin.</p>
                </aside>
            </div>
        `;
    }

    function renderModeScreen() {
        screenEl.innerHTML = `
            <div class="ce-mode-layout">
                <section class="ce-panel ce-mode-card">
                    <div class="ce-mode-toolbar">
                        <div>
                            <p class="ce-hero-eyebrow">🎓 Görev merkezi</p>
                            <h2 class="ce-section-title">Bugün hangi modda çalışmak istersin?</h2>
                            <p class="ce-meta-text">${DIFFICULTIES[state.difficulty].label} seviyesinde görevler hazırlandı.</p>
                        </div>
                        <button type="button" class="ce-secondary-btn" data-action="back-start">Seviye Değiştir</button>
                    </div>
                    <div class="ce-mode-grid">${MODES.map(renderModeButton).join('')}</div>
                </section>
            </div>
        `;
    }

    function renderGameScreen() {
        const mode = getMode();
        const progressText = state.activeMode === 'challenge' ? 'Hızlı tekrar turu' : `${Math.min(state.round + 1, state.totalRounds)} / ${state.totalRounds}`;
        screenEl.innerHTML = `
            <div class="ce-game-layout">
                <section class="ce-panel ce-board">
                    <div class="ce-game-header">
                        <div>
                            <p class="ce-hero-eyebrow">${mode.icon} ${mode.shortTitle}</p>
                            <h2 class="ce-section-title">${mode.title}</h2>
                            <p class="ce-meta-text">${DIFFICULTIES[state.difficulty].label} seviye görevi</p>
                        </div>
                        <div class="ce-progress-pill"><span>İlerleme</span><strong>${progressText}</strong></div>
                    </div>
                    <div class="ce-progress-track"><div class="ce-progress-fill" style="width:${getProgressPercent()}%;"></div></div>
                    ${renderTaskMarkup()}
                </section>

                <aside class="ce-side-stack">
                    <section class="ce-panel" style="padding:22px;">
                        <div class="ce-stat-grid">
                            <article class="ce-stat-card"><span class="ce-stat-icon" style="background: rgba(47,125,246,0.14);">⭐</span><div class="ce-stat-copy"><strong>${state.score}</strong><span>Toplam puan</span></div></article>
                            <article class="ce-stat-card"><span class="ce-stat-icon" style="background: rgba(45,207,120,0.14);">🔥</span><div class="ce-stat-copy"><strong>${state.bestStreak}</strong><span>En iyi seri</span></div></article>
                            <article class="ce-stat-card"><span class="ce-stat-icon" style="background: rgba(255,159,67,0.16);">⏱️</span><div class="ce-stat-copy"><strong data-role="challenge-timer">${state.activeMode === 'challenge' ? formatSeconds(state.challengeMs) : 'Hazır'}</strong><span>${state.activeMode === 'challenge' ? 'Kalan süre' : 'Sınıf modu'}</span></div></article>
                        </div>
                    </section>
                    <section class="ce-panel" style="padding:22px;">
                        <h3 class="ce-card-title">Öğretmen notu</h3>
                        <p class="ce-meta-text">${getTeacherTip()}</p>
                        <div class="ce-badge-row" style="margin-top:16px;">
                            <span class="ce-badge">✔ Büyük dokunmatik alan</span>
                            <span class="ce-badge">✔ Türkçe yönergeler</span>
                            <span class="ce-badge">✔ Ses yapısı hazır</span>
                        </div>
                    </section>
                    <section class="ce-panel" style="padding:22px;">
                        <h3 class="ce-card-title">Hızlı araçlar</h3>
                        <div class="ce-tool-row" style="margin-top:16px;">
                            <button type="button" class="ce-mini-btn" data-action="hear-number">Dinle</button>
                            ${state.task && state.task.answerType === 'multi' ? '<button type="button" class="ce-mini-btn" data-action="clear-blanks">Boşlukları Temizle</button>' : ''}
                            <button type="button" class="ce-mini-btn" data-action="change-mode">Moda Dön</button>
                        </div>
                    </section>
                </aside>
            </div>
        `;
    }

    function renderSummaryScreen() {
        const key = `${state.activeMode}:${state.difficulty}`;
        const saved = state.modeStats[key] || { bestStars: state.stars, bestScore: state.score, plays: 1 };
        screenEl.innerHTML = `
            <div class="ce-summary-layout">
                <section class="ce-panel ce-summary-card">
                    <p class="ce-hero-eyebrow">🏁 Tur tamamlandı</p>
                    <h2 class="ce-summary-title">${getMode().title} görevini bitirdin!</h2>
                    <p class="ce-summary-text">Sayı trenin hedef durağa ulaştı. Şimdi sonuçları birlikte gözden geçirelim.</p>
                    <div class="ce-badge-row">${new Array(3).fill(0).map((_, index) => `<span class="ce-badge">${index < state.stars ? '⭐ Kazanıldı' : '☆ Bekliyor'}</span>`).join('')}</div>
                    <div class="ce-summary-stats">
                        <div class="ce-summary-stat"><strong>${state.score}</strong><span>Puan</span></div>
                        <div class="ce-summary-stat"><strong>${getAccuracy()}%</strong><span>Doğruluk</span></div>
                        <div class="ce-summary-stat"><strong>${state.bestStreak}</strong><span>En iyi seri</span></div>
                    </div>
                    <div class="ce-badge-row">
                        <span class="ce-badge">Toplam oyun: ${saved.plays}</span>
                        <span class="ce-badge">En iyi puan: ${saved.bestScore}</span>
                        <span class="ce-badge">En iyi yıldız: ${saved.bestStars}</span>
                    </div>
                    <div class="ce-action-row">
                        <button type="button" class="ce-primary-btn" data-action="play-again">Aynı Modu Tekrar Oyna</button>
                        <button type="button" class="ce-secondary-btn" data-action="change-mode">Başka Mod Seç</button>
                        <button type="button" class="ce-secondary-btn" data-action="change-difficulty">Seviye Değiştir</button>
                    </div>
                </section>
                <aside class="ce-panel ce-summary-card">
                    <h3 class="ce-card-title">Bugün neleri çalıştın?</h3>
                    <div class="ce-badge-row">${getLearnedSkills().map((item) => `<span class="ce-badge">${item}</span>`).join('')}</div>
                    <p class="ce-summary-text">${getSummaryRecommendation()}</p>
                </aside>
            </div>
        `;
    }

    function renderDifficultyButton(difficulty) {
        const selected = difficulty.id === state.difficulty ? 'is-selected' : '';
        return `<button type="button" class="ce-chip-btn ${selected}" data-action="set-difficulty" data-value="${difficulty.id}"><strong>${difficulty.label}</strong><span>${difficulty.subtitle}</span></button>`;
    }

    function renderModeButton(mode) {
        const stat = state.modeStats[`${mode.id}:${state.difficulty}`];
        return `<button type="button" class="ce-mode-btn" data-action="start-mode" data-value="${mode.id}"><span class="ce-badge" style="background:${hexToRgba(mode.color, 0.16)}; color:${mode.color};">${mode.icon} ${mode.shortTitle}</span><strong>${mode.title}</strong><span>${mode.description}</span><span>${stat ? `En iyi: ${stat.bestScore} puan` : 'İlk tur seni bekliyor'}</span></button>`;
    }

    function renderTaskMarkup() {
        if (state.activeMode === 'path') return renderPathTask();
        if (state.task.answerType === 'multi') return renderMultiTask();
        return renderSingleTask();
    }

    function renderSingleTask() {
        const task = state.task;
        return `
            <div class="ce-task-surface">
                <article class="ce-task-card">
                    <span class="ce-task-eyebrow">${task.eyebrow}</span>
                    <h3 class="ce-task-title">${task.prompt}</h3>
                    <p class="ce-task-subtitle">${task.support}</p>
                    ${task.visual === 'number' || task.challengeKind === 'recognize' ? `
                        <div class="ce-number-spotlight" style="margin-top:20px;">
                            <div class="ce-big-number"><div><div class="ce-big-number-value">${task.number}</div><div class="ce-big-number-word">${numberToTurkish(task.number)}</div></div></div>
                            <div class="ce-objects-grid">${task.objects.map((icon) => `<div class="ce-object-chip">${icon}</div>`).join('')}</div>
                        </div>` : ''}
                    ${task.visual === 'objects' || task.challengeKind === 'count' ? `<div class="ce-objects-grid" style="margin-top:22px;">${task.objects.map((icon) => `<div class="ce-object-chip">${icon}</div>`).join('')}</div>` : ''}
                    ${task.challengeKind === 'sequence-preview' ? `<div class="ce-sequence-row" style="margin-top:22px;">${task.sequence.map((item, idx) => `<div class="${task.blankIndexes.includes(idx) ? 'ce-blank-slot' : 'ce-sequence-chip'}">${task.blankIndexes.includes(idx) ? '?' : item}</div>`).join('')}</div>` : ''}
                </article>
                <div class="ce-answer-grid">${task.options.map((option) => `<button type="button" class="ce-answer-btn" data-action="select-answer" data-value="${option}"><strong>${option}</strong><span>${numberToTurkish(option)}</span></button>`).join('')}</div>
            </div>
        `;
    }

    function renderMultiTask() {
        const values = state.optionState.values;
        return `
            <div class="ce-task-surface">
                <article class="ce-task-card">
                    <span class="ce-task-eyebrow">${state.task.eyebrow}</span>
                    <h3 class="ce-task-title">${state.task.prompt}</h3>
                    <p class="ce-task-subtitle">${state.task.support}</p>
                    <div class="ce-sequence-row" style="margin-top:18px;">
                        ${state.task.sequence.map((item, seqIndex) => {
                const blankIndex = state.task.blankIndexes.indexOf(seqIndex);
                if (blankIndex === -1) return `<div class="ce-sequence-chip">${item}</div>`;
                const active = state.optionState.activeBlank === blankIndex ? 'is-active' : '';
                return `<button type="button" class="ce-blank-slot ${active}" data-action="select-blank" data-index="${blankIndex}" data-drop-slot="true">${values[blankIndex] == null ? '?' : values[blankIndex]}</button>`;
            }).join('')}
                    </div>
                    <div class="ce-option-bank">
                        ${state.task.options.map((option) => `<button type="button" class="ce-option-pill ${values.includes(option) ? 'is-used' : ''}" data-action="pick-option" data-value="${option}" data-draggable-option="true" draggable="${!values.includes(option)}">${option}</button>`).join('')}
                    </div>
                    <div class="ce-tool-row">
                        <button type="button" class="ce-primary-btn" data-action="submit-sequence">Kontrol Et</button>
                        <button type="button" class="ce-secondary-btn" data-action="clear-blanks">Temizle</button>
                    </div>
                </article>
            </div>
        `;
    }

    function renderPathTask() {
        const totalStations = state.task.pathNumbers.length;
        const trainPosition = (state.journeyProgress / (totalStations - 1)) * 100;
        return `
            <div class="ce-task-surface">
                <article class="ce-task-card">
                    <span class="ce-task-eyebrow">${state.task.eyebrow}</span>
                    <h3 class="ce-task-title">${state.task.prompt}</h3>
                    <p class="ce-task-subtitle">${state.task.support}</p>
                    <div class="ce-rail-scene" style="margin-top:18px;">
                        <div class="ce-hill ce-hill-1"></div>
                        <div class="ce-hill ce-hill-2"></div>
                        ${state.task.pathNumbers.map((number, index) => `
                            <div class="ce-station ${index < state.journeyProgress ? 'is-cleared' : ''} ${index === state.journeyProgress ? 'is-current' : ''}" style="left:${(index / (totalStations - 1)) * 100}%;">
                                <div class="ce-station-marker">${index <= state.journeyProgress ? number : '?'}</div>
                                <div class="ce-station-label">${index === totalStations - 1 ? 'Hedef' : `Durak ${index + 1}`}</div>
                            </div>`).join('')}
                        <div class="ce-train" style="left:${trainPosition}%;">
                            <div class="ce-train-body"></div><div class="ce-train-cabin"></div><div class="ce-train-front"></div><div class="ce-train-wheel w1"></div><div class="ce-train-wheel w2"></div>
                        </div>
                    </div>
                </article>
                <div class="ce-answer-grid">${state.task.options.map((option) => `<button type="button" class="ce-answer-btn" data-action="select-answer" data-value="${option}"><strong>${option}</strong><span>${numberToTurkish(option)}</span></button>`).join('')}</div>
            </div>
        `;
    }

    function syncTestingHooks() {
        window.render_game_to_text = () => JSON.stringify({
            coordinateSystem: 'DOM layout, top-left origin, x increases rightward, y increases downward.',
            screen: state.screen,
            difficulty: DIFFICULTIES[state.difficulty].label,
            mode: state.activeMode ? getMode().title : null,
            round: state.round,
            totalRounds: state.totalRounds,
            score: state.score,
            streak: state.streak,
            bestStreak: state.bestStreak,
            challengeSecondsLeft: state.activeMode === 'challenge' ? Number((state.challengeMs / 1000).toFixed(1)) : null,
            prompt: state.task ? state.task.prompt : null,
            support: state.task ? state.task.support : null,
            answerType: state.task ? state.task.answerType : null,
            options: state.task ? state.task.options : null,
            blanks: state.optionState ? state.optionState.values : null,
            pathNumbers: state.task && state.task.pathNumbers ? state.task.pathNumbers : null,
            pathProgress: state.journeyProgress,
            feedback: state.feedback
        });

        window.advanceTime = (ms) => {
            const step = 1000 / 60;
            let remaining = Math.max(0, ms);
            while (remaining > 0) {
                const chunk = Math.min(step, remaining);
                processTime(chunk);
                remaining -= chunk;
            }
        };
    }

    function buildTask(modeId) {
        if (modeId === 'challenge') return buildChallengeTask();
        if (modeId === 'recognize') return buildRecognitionTask();
        if (modeId === 'count') return buildCountingTask();
        if (modeId === 'sequence') return buildSequenceTask(false);
        if (modeId === 'path') return buildPathTask();
        return buildSequenceTask(true);
    }

    function buildRecognitionTask() {
        const range = state.difficulty === 'hard' ? DIFFICULTIES.medium.range : DIFFICULTIES[state.difficulty].range;
        const number = randomInt(range.min, range.max);
        return {
            eyebrow: 'Sayıyı Tanı',
            prompt: 'Bu sayı hangi kartla eşleşiyor?',
            support: 'Büyük sayıya, ismine ve nesne sayısına birlikte bak.',
            visual: 'number',
            number,
            objects: createObjects(number),
            answerType: 'single',
            answer: number,
            options: buildOptions(number, range.max, 4),
            points: 10,
            successText: `${number} sayısını çok iyi tanıdın.`,
            errorText: `${numberToTurkish(number)} sayısını yeniden incele.`
        };
    }

    function buildCountingTask() {
        const max = state.difficulty === 'easy' ? 10 : state.difficulty === 'medium' ? 16 : 24;
        const answer = randomInt(3, max);
        return {
            eyebrow: 'Nesne Say ve Eşleştir',
            prompt: 'Kaç nesne var? Doğru sayı kartını seç.',
            support: 'Nesneleri tek tek işaret ederek sayabilirsin.',
            visual: 'objects',
            objects: createObjects(answer),
            answerType: 'single',
            answer,
            options: buildOptions(answer, Math.max(answer + 4, 12), 4),
            points: 10,
            successText: `Toplam ${answer} nesneyi doğru saydın.`,
            errorText: 'Nesneleri soldan sağa yeniden say.'
        };
    }

    function buildSequenceTask(isMissingMode) {
        const diff = DIFFICULTIES[state.difficulty];
        const descending = diff.canGoBackward && Math.random() > 0.62;
        const stepPool = state.difficulty === 'easy' ? [1] : state.difficulty === 'medium' ? [1, 2] : [2, 5, 10];
        const step = sample(stepPool);
        const length = state.difficulty === 'hard' ? 6 : 5;
        let start = randomInt(diff.range.min, diff.range.max);
        if (descending) start = Math.max(start, step * (length + 1));
        const sequence = Array.from({ length }, (_, index) => start + (descending ? -index * step : index * step));
        const blankCount = isMissingMode ? (state.difficulty === 'easy' ? 2 : Math.min(3, length - 2)) : (state.difficulty === 'hard' ? 2 : 1);
        const blankIndexes = shuffle(Array.from({ length }, (_, i) => i).filter((i) => i !== 0 || isMissingMode)).slice(0, blankCount).sort((a, b) => a - b);
        const answers = blankIndexes.map((index) => sequence[index]);
        return {
            eyebrow: isMissingMode ? 'Eksik Sayıları Bul' : 'Sıralamayı Tamamla',
            prompt: isMissingMode ? 'Boş kutuları doldur ve örüntüyü tamamla.' : 'Dizideki eksik sayıyı bul.',
            support: `${descending ? 'Geriye doğru' : 'İleriye doğru'} ${stepLabel(step)} ilerliyoruz.`,
            sequence,
            blankIndexes,
            answers,
            options: shuffle(answers.concat(buildDistractors(answers, step, diff.range.max))),
            answerType: 'multi',
            points: isMissingMode ? 14 : 12,
            successText: 'Sayı düzenini doğru kurdun.',
            errorText: 'Adım sayısını bir kez daha kontrol et.'
        };
    }

    function buildPathTask() {
        const diff = DIFFICULTIES[state.difficulty];
        if (!state.pathPlan) {
            const step = sample(diff.pathSteps);
            const direction = diff.canGoBackward && state.difficulty !== 'easy' && Math.random() > 0.68 ? -1 : 1;
            const totalStations = 6;
            let start = state.difficulty === 'hard' ? sample([10, 20, 30, 40, 50]) : randomInt(diff.range.min, diff.range.max);
            if (direction === -1) start = Math.max(start, step * (totalStations + 1));
            state.pathPlan = {
                step,
                direction,
                pathNumbers: Array.from({ length: totalStations }, (_, index) => start + (index * step * direction))
            };
        }
        const { step, direction, pathNumbers } = state.pathPlan;
        const answer = pathNumbers[state.journeyProgress + 1];
        return {
            eyebrow: 'Ritmik Sayma Yolu',
            prompt: 'Treni bir sonraki durağa götür.',
            support: `${direction === -1 ? 'Geri' : 'İleri'} ${stepLabel(step)} sayıyoruz. Sıradaki durak kaç?`,
            answerType: 'single',
            answer,
            options: buildOptions(answer, Math.max(...pathNumbers) + step, 4),
            pathNumbers,
            points: 16,
            successText: 'Tren bir durak daha ilerledi.',
            errorText: 'Ritmi yeniden say ve sonraki durağı bul.'
        };
    }

    function buildChallengeTask() {
        const kind = sample(['recognize', 'count', 'sequence-preview']);
        if (kind === 'recognize') {
            const task = buildRecognitionTask();
            return Object.assign(task, { eyebrow: 'Hızlı Tur', prompt: 'Hızlıca doğru sayıyı seç!', support: 'Kısa düşün, doğru dokunuş yap.', challengeKind: 'recognize', points: 12 });
        }
        if (kind === 'count') {
            const task = buildCountingTask();
            return Object.assign(task, { eyebrow: 'Hızlı Tur', prompt: 'Nesneleri hızlıca say.', support: 'Serin bozulmasın, dikkatli ama hızlı ol.', challengeKind: 'count', points: 12 });
        }
        const step = state.difficulty === 'hard' ? sample([2, 5, 10]) : state.difficulty === 'medium' ? sample([1, 2]) : 1;
        const start = randomInt(step, state.difficulty === 'hard' ? 60 : 18);
        const sequence = Array.from({ length: 4 }, (_, index) => start + (index * step));
        const blankIndex = randomInt(1, 2);
        return {
            eyebrow: 'Hızlı Tur',
            prompt: 'Eksik kutuyu hemen tamamla.',
            support: `${stepLabel(step)} devam ediyor.`,
            sequence,
            blankIndexes: [blankIndex],
            answerType: 'single',
            answer: sequence[blankIndex],
            options: buildOptions(sequence[blankIndex], Math.max(...sequence) + step * 2, 4),
            challengeKind: 'sequence-preview',
            points: 14,
            successText: 'Hızlı turda seri devam ediyor.',
            errorText: 'Adımı kaçırdın, yenisi geliyor.'
        };
    }

    function buildOptions(answer, maxValue, size) {
        const values = new Set([answer]);
        while (values.size < size) {
            const delta = sample([-10, -5, -2, -1, 1, 2, 5, 10]);
            let candidate = answer + delta;
            if (candidate < 0) candidate = answer + Math.abs(delta);
            if (candidate > maxValue) candidate = Math.max(0, answer - Math.abs(delta));
            if (candidate !== answer) values.add(candidate);
        }
        return shuffle(Array.from(values));
    }

    function buildDistractors(answers, step, maxValue) {
        const pool = new Set();
        answers.forEach((answer) => {
            [answer + step, answer - step, answer + step * 2].forEach((candidate) => {
                if (candidate >= 0 && candidate <= maxValue + step * 2 && !answers.includes(candidate)) pool.add(candidate);
            });
        });
        return shuffle(Array.from(pool)).slice(0, answers.length + 1);
    }

    function createObjects(count) {
        const safeCount = Math.min(count, state.difficulty === 'hard' ? 18 : 20);
        return Array.from({ length: safeCount }, (_, index) => OBJECT_ICONS[index % OBJECT_ICONS.length]);
    }

    function playPromptAudio() {
        if (!state.task) return;
        const target = state.task.number ?? state.task.answer ?? state.task.pathNumbers?.[state.journeyProgress];
        if (typeof target === 'number') audioManager.speakNumber(target);
    }

    function showFeedback(success, message) {
        state.feedback = { type: success ? 'success' : 'error', message };
        state.feedbackMs = 1800;
        toastEl.textContent = message;
        toastEl.className = `ce-toast is-visible ${success ? 'is-success' : 'is-error'}`;
    }

    function hideToast() {
        state.feedback = null;
        toastEl.className = 'ce-toast';
        toastEl.textContent = '';
    }

    function burstParticles() {
        const colors = ['#2f7df6', '#11b9b5', '#ff9f43', '#ffd24d', '#ff6f91', '#2dcf78'];
        for (let i = 0; i < 18; i += 1) {
            const particle = document.createElement('span');
            particle.className = 'ce-particle';
            particle.style.left = `${Math.random() * window.innerWidth}px`;
            particle.style.top = `${window.innerHeight * 0.55 + (Math.random() * 80 - 40)}px`;
            particle.style.background = colors[i % colors.length];
            particle.style.setProperty('--tx', `${Math.random() * 180 - 90}px`);
            particle.style.setProperty('--ty', `${Math.random() * -160 - 40}px`);
            particleLayer.appendChild(particle);
            setTimeout(() => particle.remove(), 900);
        }
    }

    function getMode() {
        return MODES.find((mode) => mode.id === state.activeMode) || MODES[0];
    }

    function getProgressPercent() {
        if (state.activeMode === 'challenge') {
            const total = DIFFICULTIES[state.difficulty].challengeSeconds * 1000;
            return Math.max(0, Math.min(100, ((total - state.challengeMs) / total) * 100));
        }
        return state.totalRounds <= 1 ? 0 : (state.round / state.totalRounds) * 100;
    }

    function getTeacherTip() {
        return {
            recognize: 'Büyük sayı kartını birlikte okuyup çocuklardan aynı miktarı parmakla göstermelerini isteyebilirsiniz.',
            count: 'Nesneleri soldan sağa işaret ederek saydırmak dikkat ve bire bir eşleme becerisini güçlendirir.',
            sequence: 'Boş kutuyu doldurmadan önce dizinin arttığını mı azaldığını mı birlikte konuşturabilirsiniz.',
            path: 'Her doğru durakta sınıfça ritmik sayma yapılması tempo duygusunu pekiştirir.',
            missing: 'Önce adımı buldurup sonra tüm diziyi topluca tekrar ettirmek örüntü fark etmeyi hızlandırır.',
            challenge: 'Hızlı turu değerlendirme yerine tekrar ve grup katılımı için kullanmak daha rahatlatıcı olur.'
        }[state.activeMode] || 'Bugün birlikte sayıları keşfediyoruz.';
    }

    function getLearnedSkills() {
        const common = [`${DIFFICULTIES[state.difficulty].label} seviye`, `${state.correctCount} doğru görev`];
        const extra = {
            recognize: ['Sayı adı', 'Miktar eşleme'],
            count: ['Bire bir sayma', 'Doğru sayı seçimi'],
            sequence: ['Sıra kurma', 'Eksik kutu doldurma'],
            path: ['Ritmik sayma', 'İleri / geri akış'],
            missing: ['Örüntü çözme', 'Çoklu boşluk'],
            challenge: ['Karışık tekrar', 'Seri yapma']
        };
        return common.concat(extra[state.activeMode] || []);
    }

    function getSummaryRecommendation() {
        if (state.activeMode === 'challenge') return 'İstersen şimdi belirli bir moda geçip zorlandığın beceriyi tekrar çalışabilir, sonra yeniden hızlı tura dönebilirsin.';
        if (state.stars === 3) return 'Harika bir tur oldu. Bir üst seviyeye geçerek daha uzun ritmik sayma yollarını deneyebilirsin.';
        if (state.stars === 2) return 'Güzel ilerledin. Aynı modu tekrar oynayıp daha uzun seri yakalayabilirsin.';
        return 'Bir tur daha oynayıp ipuçlarına dikkat ederek puanını rahatça yükseltebilirsin.';
    }

    function getAccuracy() {
        const totalAttempts = state.correctCount + state.wrongCount;
        return totalAttempts === 0 ? 0 : Math.round((state.correctCount / totalAttempts) * 100);
    }

    function numberToTurkish(number) {
        const ones = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
        const tens = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
        if (number === 0) return 'sıfır';
        if (number < 10) return ones[number];
        if (number < 100) return `${tens[Math.floor(number / 10)]} ${ones[number % 10]}`.trim();
        if (number === 100) return 'yüz';
        return String(number);
    }

    function stepLabel(step) {
        if (step === 1) return '1’er';
        if (step === 2) return '2’şer';
        if (step === 5) return '5’er';
        if (step === 10) return '10’ar';
        return `${step}’er`;
    }

    function hexToRgba(hex, alpha) {
        const value = parseInt(hex.replace('#', ''), 16);
        const r = (value >> 16) & 255;
        const g = (value >> 8) & 255;
        const b = value & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function formatSeconds(ms) {
        return `${Math.max(0, Math.ceil(ms / 1000))} sn`;
    }

    function sample(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    function shuffle(list) {
        const clone = list.slice();
        for (let i = clone.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [clone[i], clone[j]] = [clone[j], clone[i]];
        }
        return clone;
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function loadProgress() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (error) {
            return {};
        }
    }
}());
