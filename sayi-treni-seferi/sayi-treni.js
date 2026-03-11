/*
 * Changelog
 * - Puanlama ve hizli tekrar hatalari giderildi; ayni soruya cift dokunus engellendi.
 * - Her mod icin Turkce ogretici katmanlar, "Nasil oynanir?" yardimi ve ogretmen notu paneli eklendi.
 * - Yuksek kontrast, klavye ile gezinme, buyuk dokunmatik alanlar ve duraklat/cikis onayi eklendi.
 * - Ogrenci secimi, ayri ilerleme kaydi, ayar paneli, uyarlanabilir zorluk ve daha zengin soru cesitleri eklendi.
 * - `speechSynthesis` yoksa yerel ses dosyalariyla sayi ve geri bildirim oynatabilecek altyapi eklendi.
 * TODO: ogretmenler icin disa aktarma/rapor PDF secenegi daha sonra eklenebilir.
 * TODO: acilan toplama-cikarma modlari icin ek etkinlik paketleri genisletilebilir.
 */
(function () {
    const root = document.getElementById('counting-expedition-app');
    const screenEl = document.getElementById('appScreen');
    const toastEl = document.getElementById('feedbackToast');
    const particleLayer = document.getElementById('particleLayer');
    const modalLayer = document.getElementById('modalLayer');
    const fitStage = document.getElementById('fitStage');
    const homeBtn = document.getElementById('homeBtn');
    const contrastToggleBtn = document.getElementById('contrastToggleBtn');
    const pauseToggleBtn = document.getElementById('pauseToggleBtn');
    const settingsToggleBtn = document.getElementById('settingsToggleBtn');
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    const GAME_CONFIG = {
        storageKey: 'sayi-treni-seferi:v2',
        audioBasePath: 'audio',
        questionOptions: [5, 10, 20],
        quickTourTimerOptions: [30, 45, 60],
        answerRevealDelay: 620,
        retryUnlockDelay: 420,
        toastDuration: 2100,
        keyboardFocusSelector: '[data-nav-item]:not([disabled])',
        pointMap: {
            recognize: 10,
            count: 12,
            sequence: 14,
            missing: 16,
            path: 16,
            challenge: 14,
            addition: 16
        },
        starThresholds: {
            accuracy: [60, 80, 94],
            challengeScore: [60, 100, 150]
        },
        adaptiveShiftBounds: { min: -1, max: 2 },
        repeatSignatureLimit: 18,
        tierProfiles: [
            { tier: 0, min: 1, max: 10, countMax: 10, steps: [1], backward: false },
            { tier: 1, min: 1, max: 20, countMax: 16, steps: [1, 2], backward: true },
            { tier: 2, min: 5, max: 50, countMax: 20, steps: [1, 2, 3, 4, 5], backward: true },
            { tier: 3, min: 10, max: 100, countMax: 24, steps: [2, 3, 4, 5, 10], backward: true },
            { tier: 4, min: 20, max: 200, countMax: 28, steps: [2, 3, 4, 5, 10], backward: true }
        ],
        defaults: {
            studentName: 'Misafir',
            settings: {
                questionsPerSession: 5,
                quickTourSeconds: 45,
                adaptiveEnabled: true,
                highContrast: false
            }
        }
    };

    const AUDIO_LIBRARY = {
        feedback: {
            harika: 'feedback/harika.wav',
            super: 'feedback/super.wav',
            dogru: 'feedback/dogru-cevap.wav',
            dikkat: 'feedback/biraz-daha-dikkat.wav',
            tekrar: 'feedback/tekrar-deneyelim.wav'
        },
        tokens: {
            sifir: 'tokens/sifir.wav',
            bir: 'tokens/bir.wav',
            iki: 'tokens/iki.wav',
            uc: 'tokens/uc.wav',
            dort: 'tokens/dort.wav',
            bes: 'tokens/bes.wav',
            alti: 'tokens/alti.wav',
            yedi: 'tokens/yedi.wav',
            sekiz: 'tokens/sekiz.wav',
            dokuz: 'tokens/dokuz.wav',
            on: 'tokens/on.wav',
            yirmi: 'tokens/yirmi.wav',
            otuz: 'tokens/otuz.wav',
            kirk: 'tokens/kirk.wav',
            elli: 'tokens/elli.wav',
            altmis: 'tokens/altmis.wav',
            yetmis: 'tokens/yetmis.wav',
            seksen: 'tokens/seksen.wav',
            doksan: 'tokens/doksan.wav',
            yuz: 'tokens/yuz.wav'
        }
    };

    const FEEDBACK_COPY = {
        success: [
            { text: 'Harika!', audio: 'harika' },
            { text: 'Süper!', audio: 'super' },
            { text: 'Doğru cevap!', audio: 'dogru' }
        ],
        error: [
            { text: 'Biraz daha dikkat!', audio: 'dikkat' },
            { text: 'Tekrar deneyelim!', audio: 'tekrar' }
        ]
    };

    const COUNTABLE_OBJECT_SETS = [
        { emoji: '🍎', label: 'elma' },
        { emoji: '🧸', label: 'oyuncak ayı' },
        { emoji: '⭐', label: 'yıldız' },
        { emoji: '📘', label: 'kitap' },
        { emoji: '🚗', label: 'araba' },
        { emoji: '🎈', label: 'balon' },
        { emoji: '🦆', label: 'ördek' },
        { emoji: '🍪', label: 'kurabiye' }
    ];

    const DIFFICULTIES = {
        easy: { id: 'easy', label: 'Kolay', subtitle: '1-10 arası güvenli başlangıç', baseTier: 0, description: 'Sayı tanıma, basit sayma ve 1’er ileri sayma.' },
        medium: { id: 'medium', label: 'Orta', subtitle: '1-20 arası karışık görevler', baseTier: 1, description: 'Eksik sayı, geri sayma ve 2’şer ritmik sayma.' },
        hard: { id: 'hard', label: 'Zor', subtitle: '50-200 arası daha uzun örüntüler', baseTier: 2, description: '3’er, 4’er, 5’er, 10’ar ritimler ve uzun diziler.' }
    };

    const MODE_DEFINITIONS = [
        {
            id: 'recognize',
            title: 'Sayıyı Tanı',
            icon: '🔢',
            color: '#2f7df6',
            teacherNote: 'Sayı kartını birlikte yüksek sesle okuyup aynı miktarı parmakla göstermelerini isteyebilirsiniz.',
            tutorial: [
                { title: 'Büyük sayıya bak', text: 'Ekrandaki büyük sayıyı ve yazıyla adını incele.' },
                { title: 'Nesnelerle eşleştir', text: 'Yan taraftaki nesnelerin sayısı ile büyük sayıyı karşılaştır.' },
                { title: 'Doğru kartı seç', text: 'En uygun sayı kartına dokun ve cevabını gönder.' }
            ]
        },
        {
            id: 'count',
            title: 'Nesne Say ve Eşleştir',
            icon: '🧮',
            color: '#11b9b5',
            teacherNote: 'Önce her nesneye tek tek dokundurtup sonra toplamı söyletmek bire bir eşlemeyi güçlendirir.',
            tutorial: [
                { title: 'Her nesneyi işaretle', text: 'Nesnelere tek tek dokun. İşaretlenen nesne parlayacak.' },
                { title: 'Atlamadan say', text: 'Soldan sağa veya yukarıdan aşağıya ilerle, aynı nesneyi iki kez sayma.' },
                { title: 'Sayı kartını seç', text: 'İşaretlediğin toplam kadar olan sayı kartına dokun.' }
            ]
        },
        {
            id: 'sequence',
            title: 'Sıralamayı Tamamla',
            icon: '🧠',
            color: '#ff9f43',
            teacherNote: 'Dizinin artıp artmadığını veya azalıp azalmadığını konuşturmak örüntü çözmeyi kolaylaştırır.',
            tutorial: [
                { title: 'Sıradaki ritmi bul', text: 'Kutulardaki sayıların kaçer kaçer ilerlediğine bak.' },
                { title: 'Boş kutuya dokun', text: 'Önce boş kutuyu seç, sonra doğru sayı kartına dokun.' },
                { title: 'Kontrol et', text: 'Tüm boşluklar dolunca “Kontrol Et” düğmesine bas.' }
            ]
        },
        {
            id: 'path',
            title: 'Ritmik Sayma Yolu',
            icon: '🚂',
            color: '#ff6f91',
            teacherNote: 'Her durakta sınıfça ritmik sayma yapmanız tempo duygusunu ve sırayı korumayı destekler.',
            tutorial: [
                { title: 'Rayı takip et', text: 'Tren bir duraktan diğerine ritmik sayma ile ilerler.' },
                { title: 'Bir sonraki durağı bul', text: 'Sayılar kaçer kaçer gidiyorsa aynı ritimle devam et.' },
                { title: 'Doğru cevapla ilerle', text: 'Doğru kartı seçince tren keyifle bir sonraki durağa varır.' }
            ]
        },
        {
            id: 'missing',
            title: 'Eksik Sayıları Bul',
            icon: '🧩',
            color: '#6c63ff',
            teacherNote: 'Önce ortak adımı buldurup ardından tüm diziyi birlikte tekrar etmek öğrenmeyi kalıcılaştırır.',
            tutorial: [
                { title: 'Diziyi incele', text: 'Bilinen sayıların arasındaki farkı bul.' },
                { title: 'Her boşluğu sırayla doldur', text: 'Bir boş kutuya dokunup seçeneklerden uygun olanı seç.' },
                { title: 'Hepsini kontrol et', text: 'Tüm boşluklar tamamlanınca cevabını kontrol et.' }
            ]
        },
        {
            id: 'challenge',
            title: 'Hızlı Tur',
            icon: '⚡',
            color: '#2dcf78',
            teacherNote: 'Hızlı turu yarış yerine tekrar ve dikkat toplama etkinliği olarak kullanmak çocukların rahatlığını korur.',
            tutorial: [
                { title: 'Süreyi izle', text: 'Bu modda zaman akar; duraklatırsan süre de durur.' },
                { title: 'Seri yap', text: 'Doğru cevaplar peş peşe gelirse puanın hızla artar.' },
                { title: 'Karışık görevler', text: 'Sayı tanıma, sayma ve örüntü soruları dönüşümlü gelir.' }
            ]
        },
        {
            id: 'addition',
            title: 'Sihirli Toplama Makinesi',
            icon: '✨',
            color: '#7c3aed',
            teacherNote: 'Önce kırmızı ve mavi grupları ayrı ayrı saydırıp sonra birlikte toplamayı söylemek toplama mantığını somutlaştırır.',
            tutorial: [
                { title: 'Soruyu oku', text: 'Üstteki toplama sorusunda kırmızı ve mavi sayıları incele.' },
                { title: 'Topları ekle', text: 'Soldan kırmızı, sağdan mavi toplara dokunarak haznelere yerleştir.' },
                { title: 'Topla düğmesine bas', text: 'İki grup tamamlanınca TOPLA düğmesine bas ve sonucu alt haznede gör.' }
            ]
        }
    ];

    const state = {
        store: loadStore(),
        studentName: GAME_CONFIG.defaults.studentName,
        settings: { ...GAME_CONFIG.defaults.settings },
        screen: 'start',
        activeMode: null,
        difficulty: 'easy',
        task: null,
        taskToken: 0,
        answerLocked: false,
        round: 0,
        totalRounds: GAME_CONFIG.defaults.settings.questionsPerSession,
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        streak: 0,
        bestStreak: 0,
        stars: 0,
        challengeMs: 0,
        paused: false,
        highContrast: false,
        audioEnabled: true,
        focusIndex: 0,
        keyboardMode: false,
        modal: null,
        feedback: null,
        feedbackMs: 0,
        pathPlan: null,
        optionState: null,
        adaptiveShift: 0,
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        sessionPatterns: new Set(),
        mistakes: [],
        hintMessage: '',
        sessionHistory: [],
        sessionStartedAt: null,
        journeyProgress: 0
    };

    class ClassroomAudioManager {
        constructor() {
            this.ctx = null;
            this.voiceReady = 'speechSynthesis' in window;
            this.localFailures = new Set();
            this.enabled = true;
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

        playTone(freq, duration, type, gainValue) {
            if (!this.enabled) return;
            const ctx = this.ensureContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(gainValue, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        }

        playClick() {
            this.playTone(410, 0.08, 'triangle', 0.05);
        }

        playSuccessChime() {
            this.playTone(740, 0.16, 'sine', 0.08);
            setTimeout(() => this.playTone(988, 0.2, 'sine', 0.06), 80);
        }

        playErrorChime() {
            this.playTone(220, 0.18, 'sawtooth', 0.05);
        }

        async playLocal(filePath) {
            const url = `${GAME_CONFIG.audioBasePath}/${filePath}`;
            if (this.localFailures.has(url)) return false;
            return new Promise((resolve) => {
                const audio = new Audio(url);
                audio.addEventListener('ended', () => resolve(true), { once: true });
                audio.addEventListener('error', () => {
                    this.localFailures.add(url);
                    resolve(false);
                }, { once: true });
                audio.play().catch(() => {
                    this.localFailures.add(url);
                    resolve(false);
                });
            });
        }

        speakText(text) {
            if (!this.enabled) return;
            if (this.voiceReady && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'tr-TR';
                utterance.rate = 0.88;
                utterance.pitch = 1.02;
                window.speechSynthesis.speak(utterance);
            }
        }

        async playFeedback(key, fallbackText) {
            if (!this.enabled) return;
            if (!this.voiceReady && AUDIO_LIBRARY.feedback[key]) {
                const ok = await this.playLocal(AUDIO_LIBRARY.feedback[key]);
                if (ok) return;
            }
            this.speakText(fallbackText);
        }

        async speakNumber(number) {
            if (!this.enabled) return;
            const fallbackText = numberToTurkish(number);
            if (!this.voiceReady) {
                const tokens = numberToAudioTokens(number);
                let allPlayed = true;
                for (const token of tokens) {
                    const filePath = AUDIO_LIBRARY.tokens[token];
                    if (!filePath) {
                        allPlayed = false;
                        break;
                    }
                    const ok = await this.playLocal(filePath);
                    if (!ok) {
                        allPlayed = false;
                        break;
                    }
                }
                if (allPlayed) return;
            }
            this.speakText(fallbackText);
        }
    }

    const audioManager = new ClassroomAudioManager();
    let rafId = null;
    let lastFrame = performance.now();
    let fitRafId = null;

    init();

    function init() {
        initializeProfile(state.store.lastStudent || GAME_CONFIG.defaults.studentName);

        homeBtn.addEventListener('click', handleHomeClick);
        contrastToggleBtn.addEventListener('click', () => {
            state.settings.highContrast = !state.settings.highContrast;
            persistCurrentProfile();
            audioManager.playClick();
            render();
        });
        pauseToggleBtn.addEventListener('click', () => togglePause());
        settingsToggleBtn.addEventListener('click', () => openSettings());
        soundToggleBtn.addEventListener('click', () => {
            state.audioEnabled = !state.audioEnabled;
            audioManager.setEnabled(state.audioEnabled);
            renderTopbar();
        });
        fullscreenBtn.addEventListener('click', toggleFullscreen);

        document.addEventListener('fullscreenchange', renderTopbar);
        window.addEventListener('keydown', handleGlobalKeydown);
        window.addEventListener('resize', scheduleViewportFit);
        window.addEventListener('orientationchange', scheduleViewportFit);
        root.addEventListener('click', handleDelegatedClick);
        root.addEventListener('input', handleDelegatedInput);
        root.addEventListener('dragstart', handleDragStart);
        root.addEventListener('dragover', handleDragOver);
        root.addEventListener('drop', handleDrop);

        applyBootstrapFromQuery();
        render();
        startLoop();
        scheduleViewportFit();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(scheduleViewportFit).catch(() => { });
        }
    }

    function initializeProfile(name) {
        const safeName = sanitizeStudentName(name);
        if (!state.store.profiles[safeName]) {
            state.store.profiles[safeName] = createDefaultProfile(safeName);
        }
        state.studentName = safeName;
        state.settings = { ...GAME_CONFIG.defaults.settings, ...state.store.profiles[safeName].settings };
        state.highContrast = state.settings.highContrast;
        state.store.lastStudent = safeName;
        audioManager.setEnabled(state.audioEnabled);
        persistStore();
    }

    function createDefaultProfile(name) {
        return {
            name,
            settings: { ...GAME_CONFIG.defaults.settings },
            tutorialsSeen: {},
            progress: {},
            achievements: {
                totalStars: 0,
                totalCorrect: 0
            }
        };
    }

    function persistStore() {
        localStorage.setItem(GAME_CONFIG.storageKey, JSON.stringify(state.store));
    }

    function persistCurrentProfile() {
        const profile = getCurrentProfile();
        profile.settings = { ...state.settings };
        state.store.lastStudent = state.studentName;
        persistStore();
    }

    function getCurrentProfile() {
        return state.store.profiles[state.studentName];
    }

    function applyBootstrapFromQuery() {
        const params = new URLSearchParams(window.location.search);
        const student = params.get('student');
        const difficulty = params.get('difficulty');
        const mode = params.get('mode');
        const screen = params.get('screen');

        if (student) initializeProfile(student);
        if (difficulty && DIFFICULTIES[difficulty]) state.difficulty = difficulty;
        if (screen === 'modes') state.screen = 'modes';
        if (params.get('autostart') === '1' && mode) beginMode(mode, { autoTutorial: false });
    }

    function startLoop() {
        cancelAnimationFrame(rafId);
        lastFrame = performance.now();
        const tick = (now) => {
            const delta = Math.min(80, now - lastFrame);
            lastFrame = now;
            processTime(delta);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
    }

    function processTime(delta) {
        if (state.feedbackMs > 0) {
            state.feedbackMs = Math.max(0, state.feedbackMs - delta);
            if (state.feedbackMs === 0) {
                state.feedback = null;
                toastEl.className = 'ce-toast';
                toastEl.textContent = '';
            }
        }

        if (state.screen === 'game' && state.activeMode === 'challenge' && !state.paused && state.challengeMs > 0) {
            state.challengeMs = Math.max(0, state.challengeMs - delta);
            const timerEl = document.querySelector('[data-role="challenge-timer"]');
            if (timerEl) timerEl.textContent = `${Math.ceil(state.challengeMs / 1000)} sn`;
            if (state.challengeMs === 0) finishMode();
        }
    }

    function scheduleViewportFit() {
        cancelAnimationFrame(fitRafId);
        fitRafId = requestAnimationFrame(updateViewportFit);
    }

    function updateViewportFit() {
        if (!fitStage) return;
        root.style.setProperty('--ce-fit-scale', '1');

        const stageRect = fitStage.getBoundingClientRect();
        const naturalWidth = fitStage.scrollWidth || stageRect.width || 1;
        const naturalHeight = fitStage.scrollHeight || stageRect.height || 1;
        const availableWidth = Math.max(320, window.innerWidth - 12);
        const availableHeight = Math.max(320, window.innerHeight - 12);
        const nextScale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
        root.style.setProperty('--ce-fit-scale', nextScale.toFixed(4));
    }

    function render() {
        root.classList.toggle('ce-high-contrast', !!state.settings.highContrast);
        renderTopbar();
        renderModal();

        if (state.screen === 'start') renderStartScreen();
        else if (state.screen === 'modes') renderModeScreen();
        else if (state.screen === 'game') renderGameScreen();
        else renderSummaryScreen();

        syncTestingHooks();
        syncKeyboardFocus();
        scheduleViewportFit();
    }

    function renderTopbar() {
        contrastToggleBtn.setAttribute('aria-label', state.settings.highContrast ? 'Yüksek kontrastı kapat' : 'Yüksek kontrastı aç');
        contrastToggleBtn.setAttribute('aria-pressed', String(!!state.settings.highContrast));
        contrastToggleBtn.textContent = state.settings.highContrast ? '☀' : '◐';

        pauseToggleBtn.hidden = state.screen !== 'game';
        pauseToggleBtn.textContent = state.paused ? '▶' : '⏸';
        pauseToggleBtn.setAttribute('aria-label', state.paused ? 'Oyunu sürdür' : 'Oyunu duraklat');
        pauseToggleBtn.setAttribute('aria-pressed', String(!!state.paused));

        soundToggleBtn.textContent = state.audioEnabled ? '🔊' : '🔇';
        soundToggleBtn.setAttribute('aria-pressed', String(!!state.audioEnabled));
        soundToggleBtn.setAttribute('aria-label', state.audioEnabled ? 'Sesi kapat' : 'Sesi aç');

        fullscreenBtn.textContent = document.fullscreenElement ? '⤡' : '⤢';
        fullscreenBtn.setAttribute('aria-label', document.fullscreenElement ? 'Tam ekrandan çık' : 'Tam ekran aç');
    }

    function renderModal() {
        if (!state.modal) {
            modalLayer.innerHTML = '';
            modalLayer.className = 'ce-modal-layer';
            return;
        }

        modalLayer.className = 'ce-modal-layer is-open';
        if (state.modal.type === 'confirm-exit') {
            modalLayer.innerHTML = `
                <div class="ce-modal-card" role="dialog" aria-modal="true" aria-labelledby="exitModalTitle">
                    <h2 id="exitModalTitle">Oyunu bırakmak istediğine emin misin?</h2>
                    <p>Devam edersen şu anki tur kaybolabilir. İstersen oyuna dönebilir ya da ana sayfaya çıkabilirsin.</p>
                    <div class="ce-modal-actions">
                        <button type="button" class="ce-primary-btn" data-action="cancel-exit" data-nav-item="true">Oyuna Dön</button>
                        <button type="button" class="ce-secondary-btn" data-action="confirm-exit" data-nav-item="true">Çıkış Yap</button>
                    </div>
                </div>
            `;
            return;
        }

        if (state.modal.type === 'pause') {
            modalLayer.innerHTML = `
                <div class="ce-modal-card" role="dialog" aria-modal="true" aria-labelledby="pauseModalTitle">
                    <h2 id="pauseModalTitle">Oyun duraklatıldı</h2>
                    <p>Kaldığın yer güvenle bekliyor. Hazır olduğunda devam edebilirsin.</p>
                    <div class="ce-modal-actions">
                        <button type="button" class="ce-primary-btn" data-action="resume-game" data-nav-item="true">Devam Et</button>
                        <button type="button" class="ce-secondary-btn" data-action="open-tutorial" data-mode="${state.activeMode}" data-nav-item="true">Nasıl Oynanır?</button>
                        <button type="button" class="ce-secondary-btn" data-action="request-exit" data-nav-item="true">Ana Sayfaya Çık</button>
                    </div>
                </div>
            `;
            return;
        }

        if (state.modal.type === 'settings') {
            modalLayer.innerHTML = renderSettingsModal();
            return;
        }

        if (state.modal.type === 'tutorial') {
            modalLayer.innerHTML = renderTutorialModal();
        }
    }

    function renderSettingsModal() {
        const profile = getCurrentProfile();
        return `
            <div class="ce-modal-card ce-settings-card" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
                <div class="ce-modal-head">
                    <div>
                        <h2 id="settingsTitle">Ayarlar ve Öğrenci Profili</h2>
                        <p>Bu paneli öğretmenler oturum başında düzenleyebilir.</p>
                    </div>
                    <button type="button" class="ce-icon-btn ce-icon-btn--small" data-action="close-modal" aria-label="Ayarları kapat">✕</button>
                </div>

                <div class="ce-settings-grid">
                    <label class="ce-field">
                        <span>Öğrenci Adı</span>
                        <input id="studentNameField" type="text" value="${escapeHtml(state.studentName)}" maxlength="24" />
                    </label>
                    <label class="ce-field">
                        <span>Varsayılan zorluk</span>
                        <select id="difficultyField">
                            ${Object.values(DIFFICULTIES).map((difficulty) => `<option value="${difficulty.id}" ${state.difficulty === difficulty.id ? 'selected' : ''}>${difficulty.label}</option>`).join('')}
                        </select>
                    </label>
                    <label class="ce-field">
                        <span>Oturumdaki soru sayısı</span>
                        <select id="questionCountField">
                            ${GAME_CONFIG.questionOptions.map((value) => `<option value="${value}" ${state.settings.questionsPerSession === value ? 'selected' : ''}>${value}</option>`).join('')}
                        </select>
                    </label>
                    <label class="ce-field">
                        <span>Hızlı Tur süresi</span>
                        <select id="quickTourField">
                            ${GAME_CONFIG.quickTourTimerOptions.map((value) => `<option value="${value}" ${state.settings.quickTourSeconds === value ? 'selected' : ''}>${value} saniye</option>`).join('')}
                        </select>
                    </label>
                    <label class="ce-field ce-field--toggle">
                        <span>Uyarlanabilir zorluk</span>
                        <input id="adaptiveField" type="checkbox" ${state.settings.adaptiveEnabled ? 'checked' : ''} />
                    </label>
                    <label class="ce-field ce-field--toggle">
                        <span>Yüksek kontrast</span>
                        <input id="contrastField" type="checkbox" ${state.settings.highContrast ? 'checked' : ''} />
                    </label>
                </div>

                <div class="ce-progress-snapshot">
                    <span class="ce-badge">Aktif profil: ${escapeHtml(profile.name)}</span>
                    <span class="ce-badge">Toplam yıldız: ${profile.achievements.totalStars}</span>
                    <span class="ce-badge">Toplam doğru: ${profile.achievements.totalCorrect}</span>
                </div>

                <div class="ce-modal-actions">
                    <button type="button" class="ce-primary-btn" data-action="save-settings" data-nav-item="true">Kaydet</button>
                    <button type="button" class="ce-secondary-btn" data-action="reset-progress" data-nav-item="true">İlerlemeyi Sıfırla</button>
                    <button type="button" class="ce-secondary-btn" data-action="close-modal" data-nav-item="true">Kapat</button>
                </div>
            </div>
        `;
    }

    function renderTutorialModal() {
        const mode = getModeDefinition(state.modal.mode);
        const seen = getCurrentProfile().tutorialsSeen[mode.id];
        const demoMarkup = mode.id === 'count'
            ? `<div class="ce-tutorial-demo">
                    <button type="button" class="ce-demo-object is-marked" aria-label="İşaretlenmiş elma">🍎</button>
                    <button type="button" class="ce-demo-object" aria-label="İşaretlenmemiş elma">🍎</button>
                    <button type="button" class="ce-demo-object" aria-label="İşaretlenmemiş elma">🍎</button>
                </div>`
            : `<div class="ce-tutorial-demo ce-tutorial-demo--rail"><span>8</span><span>10</span><span>?</span><span>14</span></div>`;

        return `
            <div class="ce-modal-card ce-tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorialTitle">
                <div class="ce-modal-head">
                    <div>
                        <h2 id="tutorialTitle">${mode.title} nasıl oynanır?</h2>
                        <p>${seen ? 'Bu yardımı istediğin kadar tekrar açabilirsin.' : 'Bu öğretici ilk açılışta otomatik gösterilir.'}</p>
                    </div>
                    <button type="button" class="ce-icon-btn ce-icon-btn--small" data-action="close-modal" aria-label="Öğreticiyi kapat">✕</button>
                </div>
                ${demoMarkup}
                <div class="ce-tutorial-grid">
                    ${mode.tutorial.map((step, index) => `
                        <article class="ce-tutorial-step ${index === 0 ? 'is-primary' : ''}">
                            <strong>${index + 1}. ${step.title}</strong>
                            <p>${step.text}</p>
                        </article>
                    `).join('')}
                </div>
                <div class="ce-modal-actions">
                    <button type="button" class="ce-primary-btn" data-action="tutorial-audio" data-mode="${mode.id}" data-nav-item="true">Yönergeyi Dinle</button>
                    <button type="button" class="ce-secondary-btn" data-action="close-modal" data-nav-item="true">Tamam</button>
                </div>
            </div>
        `;
    }

    function renderStartScreen() {
        const profile = getCurrentProfile();
        screenEl.innerHTML = `
            <div class="ce-start-layout">
                <section class="ce-panel ce-hero-card">
                    <span class="ce-hero-eyebrow">🚂 Yeni sınıf görevi</span>
                    <h2 class="ce-hero-title">Sayıları sıraya diz,<br>ritmi yakala,<br>treni finale ulaştır.</h2>
                    <p class="ce-hero-text">Akıllı tahta, tablet ve masaüstü için tasarlanan bu oyun paketi sayı tanıma, tek tek sayma, örüntü kurma ve ritmik sayma becerilerini birlikte çalıştırır.</p>
                    <div class="ce-skill-pills">
                        <span class="ce-skill-pill">🔢 Sayıyı tanı</span>
                        <span class="ce-skill-pill">🧮 Nesneleri tek tek say</span>
                        <span class="ce-skill-pill">🧩 Eksik sayıyı bul</span>
                        <span class="ce-skill-pill">🚂 Ritmik sayma yolu</span>
                        <span class="ce-skill-pill">⚡ Hızlı tekrar turu</span>
                    </div>
                    <div class="ce-train-preview">
                        <div class="ce-track-line"></div>
                        <div class="ce-track-stations"><span></span><span></span><span></span><span></span><span></span></div>
                        <div class="ce-train-engine" aria-hidden="true"><div class="ce-wheel-row"><span></span><span></span><span></span></div></div>
                    </div>
                </section>

                <aside class="ce-panel ce-side-card">
                    <div>
                        <h3 class="ce-card-title">Öğrenci ve seviye</h3>
                        <p class="ce-meta-text">Her öğrenci aynı cihazda kendi ilerlemesiyle oynayabilir.</p>
                    </div>

                    <div class="ce-profile-box">
                        <label class="ce-field">
                            <span>Öğrenci Adı</span>
                            <input id="startStudentName" type="text" maxlength="24" value="${escapeHtml(state.studentName)}" aria-label="Öğrenci adı" />
                        </label>
                        <div class="ce-action-row">
                            <button type="button" class="ce-secondary-btn" data-action="save-student" data-nav-item="true">Profili Aç</button>
                            <button type="button" class="ce-secondary-btn" data-action="open-settings" data-nav-item="true">Öğretmen Ayarları</button>
                        </div>
                    </div>

                    <div class="ce-difficulty-grid">${Object.values(DIFFICULTIES).map(renderDifficultyButton).join('')}</div>

                    <div class="ce-progress-snapshot">
                        <span class="ce-badge">Soru: ${state.settings.questionsPerSession}</span>
                        <span class="ce-badge">Hızlı Tur: ${state.settings.quickTourSeconds} sn</span>
                        <span class="ce-badge">Uyarlanabilir: ${state.settings.adaptiveEnabled ? 'Açık' : 'Kapalı'}</span>
                    </div>

                    <div class="ce-panel ce-mini-panel">
                        <p class="ce-hero-eyebrow" style="margin:0 0 10px;">Aktif öğrenci</p>
                        <h3 class="ce-card-title">${escapeHtml(profile.name)}</h3>
                        <p class="ce-meta-text">${DIFFICULTIES[state.difficulty].description}</p>
                        <div class="ce-badge-row" style="margin-top:14px;">
                            <span class="ce-badge">Toplam yıldız: ${profile.achievements.totalStars}</span>
                            <span class="ce-badge">Toplam doğru: ${profile.achievements.totalCorrect}</span>
                        </div>
                    </div>

                    <div class="ce-action-row">
                        <button type="button" class="ce-primary-btn" data-action="go-modes" data-nav-item="true">Görevleri Aç</button>
                    </div>
                </aside>
            </div>
        `;
    }

    function renderModeScreen() {
        const availableModes = getAvailableModes();
        screenEl.innerHTML = `
            <div class="ce-mode-layout">
                <section class="ce-panel ce-mode-card">
                    <div class="ce-mode-toolbar">
                        <div>
                            <p class="ce-hero-eyebrow">🎓 Görev merkezi</p>
                            <h2 class="ce-section-title">Bugün hangi modda çalışmak istersin?</h2>
                            <p class="ce-meta-text">${state.studentName} için ${DIFFICULTIES[state.difficulty].label} seviyesi hazır. Her kartta yardım düğmesi var.</p>
                        </div>
                        <div class="ce-action-row">
                            <button type="button" class="ce-secondary-btn" data-action="back-start" data-nav-item="true">Seviye Değiştir</button>
                            <button type="button" class="ce-secondary-btn" data-action="open-settings" data-nav-item="true">Ayarlar</button>
                        </div>
                    </div>
                    <div class="ce-mode-grid">${availableModes.map((mode) => renderModeButton(mode)).join('')}</div>
                </section>
            </div>
        `;
    }

    function renderGameScreen() {
        const mode = getModeDefinition(state.activeMode);
        const profileStats = getModeProgress(mode.id, state.difficulty);
        const supportChip = state.settings.adaptiveEnabled ? `Uyarlanabilir seviye: ${getEffectiveTier().tier + 1}` : `Sabit seviye: ${DIFFICULTIES[state.difficulty].label}`;
        const timerText = state.activeMode === 'challenge' ? `${Math.ceil(state.challengeMs / 1000)} sn` : 'Hazır';

        screenEl.innerHTML = `
            <div class="ce-game-layout">
                <section class="ce-panel ce-board">
                    <div class="ce-game-header">
                        <div>
                            <p class="ce-hero-eyebrow">${mode.icon} ${mode.title}</p>
                            <h2 class="ce-section-title">${escapeHtml(state.studentName)} için görev akışı</h2>
                            <p class="ce-meta-text">${supportChip}</p>
                        </div>
                        <div class="ce-action-row">
                            <button type="button" class="ce-secondary-btn" data-action="open-tutorial" data-mode="${mode.id}" data-nav-item="true">Nasıl oynanır?</button>
                            <button type="button" class="ce-secondary-btn" data-action="toggle-pause" data-nav-item="true">${state.paused ? 'Sürdür' : 'Duraklat'}</button>
                        </div>
                    </div>

                    <div class="ce-progress-track"><div class="ce-progress-fill" style="width:${getProgressPercent()}%;"></div></div>
                    ${renderTaskMarkup()}
                </section>

                <aside class="ce-side-stack">
                    <section class="ce-panel ce-side-panel">
                        <div class="ce-stat-grid">
                            <article class="ce-stat-card"><span class="ce-stat-icon" style="background: rgba(47,125,246,0.14);">⭐</span><div class="ce-stat-copy"><strong>${state.score}</strong><span>Toplam puan</span></div></article>
                            <article class="ce-stat-card"><span class="ce-stat-icon" style="background: rgba(45,207,120,0.14);">🔥</span><div class="ce-stat-copy"><strong>${state.bestStreak}</strong><span>En iyi seri</span></div></article>
                            <article class="ce-stat-card"><span class="ce-stat-icon" style="background: rgba(255,159,67,0.16);">⏱</span><div class="ce-stat-copy"><strong data-role="challenge-timer">${timerText}</strong><span>${state.activeMode === 'challenge' ? 'Kalan süre' : 'Sınıf modu'}</span></div></article>
                        </div>
                    </section>

                    <section class="ce-panel ce-side-panel">
                        <div class="ce-badge-row">
                            <span class="ce-badge">Tur: ${Math.min(state.round + 1, state.totalRounds)} / ${state.totalRounds}</span>
                            <span class="ce-badge">Doğru: ${state.correctCount}</span>
                            <span class="ce-badge">Yanlış: ${state.wrongCount}</span>
                            <span class="ce-badge">En iyi puan: ${profileStats.bestScore}</span>
                        </div>
                    </section>

                    <details class="ce-panel ce-teacher-panel">
                        <summary>Öğretmen Notu</summary>
                        <p>${mode.teacherNote}</p>
                        <p>İpucu: ${getTeacherTip()}</p>
                    </details>
                </aside>
            </div>
        `;
    }

    function renderSummaryScreen() {
        const profile = getCurrentProfile();
        screenEl.innerHTML = `
            <div class="ce-summary-layout">
                <section class="ce-panel ce-summary-card">
                    <p class="ce-hero-eyebrow">🏁 Tur tamamlandı</p>
                    <h2 class="ce-summary-title">${getModeDefinition(state.activeMode).title} görevi bitti!</h2>
                    <p class="ce-summary-text">Bugünkü turda ${escapeHtml(state.studentName)} çok sayıda sayı ve ritim görevi tamamladı.</p>
                    <div class="ce-badge-row">${new Array(3).fill(0).map((_, index) => `<span class="ce-badge">${index < state.stars ? '⭐ Kazanıldı' : '☆ Bekliyor'}</span>`).join('')}</div>
                    <div class="ce-summary-stats">
                        <div class="ce-summary-stat"><strong>${state.score}</strong><span>Puan</span></div>
                        <div class="ce-summary-stat"><strong>${getAccuracy()}%</strong><span>Doğruluk</span></div>
                        <div class="ce-summary-stat"><strong>${state.bestStreak}</strong><span>En iyi seri</span></div>
                    </div>
                    <div class="ce-badge-row">
                        <span class="ce-badge">Toplam yıldız: ${profile.achievements.totalStars}</span>
                        <span class="ce-badge">Toplam doğru: ${profile.achievements.totalCorrect}</span>
                    </div>
                    <div class="ce-action-row">
                        <button type="button" class="ce-primary-btn" data-action="play-again" data-nav-item="true">Aynı Modu Tekrar Oyna</button>
                        <button type="button" class="ce-secondary-btn" data-action="change-mode" data-nav-item="true">Başka Mod Seç</button>
                        <button type="button" class="ce-secondary-btn" data-action="back-start" data-nav-item="true">Ana Ekrana Dön</button>
                    </div>
                    ${renderMistakeReview()}
                </section>
                <aside class="ce-panel ce-summary-card">
                    <h3 class="ce-card-title">Bugün neler öğrendin?</h3>
                    <div class="ce-badge-row">${getLearnedSkills().map((item) => `<span class="ce-badge">${item}</span>`).join('')}</div>
                    <p class="ce-summary-text">${getSummaryRecommendation()}</p>
                </aside>
            </div>
        `;
    }

    function renderTaskMarkup() {
        if (!state.task) return '';
        if (state.activeMode === 'addition') return renderAdditionMachineTask();
        if (state.activeMode === 'count') return renderCountingTask();
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
                    ${renderHintPanel()}
                    ${task.visual === 'number' ? renderNumberSpotlight(task) : ''}
                    ${task.visual === 'objects' ? `<div class="ce-objects-grid ce-objects-grid--wide">${task.objects.map((item) => renderObjectChip(item.emoji, item.label)).join('')}</div>` : ''}
                    ${task.visual === 'equation' ? `<div class="ce-equation-card" aria-label="${task.equationLabel}">${task.equationHtml}</div>` : ''}
                    ${task.visual === 'sequence-preview' ? `<div class="ce-sequence-row" style="margin-top:18px;">${task.sequence.map((value, index) => `<div class="${task.blankIndexes.includes(index) ? 'ce-blank-slot ce-blank-slot--preview' : 'ce-sequence-chip'}">${task.blankIndexes.includes(index) ? '?' : value}</div>`).join('')}</div>` : ''}
                </article>
                ${renderAnswerGrid(task.options, 'single-answer')}
            </div>
        `;
    }

    function renderCountingTask() {
        const task = state.task;
        const marked = task.marked.filter(Boolean).length;
        return `
            <div class="ce-task-surface">
                <article class="ce-task-card">
                    <span class="ce-task-eyebrow">${task.eyebrow}</span>
                    <h3 class="ce-task-title">${task.prompt}</h3>
                    <p class="ce-task-subtitle">${task.support}</p>
                    ${renderHintPanel()}
                    <div class="ce-counting-hint">
                        <span class="ce-badge">İşaretlenen nesne: ${marked} / ${task.objects.length}</span>
                        <span class="ce-badge">İpucu: Her nesneye bir kez dokun</span>
                    </div>
                    <div class="ce-objects-grid ce-objects-grid--count">
                        ${task.objects.map((item, index) => `
                            <button type="button" class="ce-count-object ${task.marked[index] ? 'is-marked' : ''}" data-action="toggle-count-object" data-index="${index}" data-nav-item="true" aria-label="${index + 1}. ${item.label} ${task.marked[index] ? 'işaretlendi' : 'işaretlenmedi'}">
                                <span>${item.emoji}</span>
                                <small>${item.label}</small>
                            </button>
                        `).join('')}
                    </div>
                </article>
                ${renderAnswerGrid(task.options, 'single-answer')}
            </div>
        `;
    }

    function renderPathTask() {
        const task = state.task;
        const totalStations = task.pathNumbers.length;
        const currentNumber = task.pathNumbers[state.journeyProgress];
        const nextNumber = task.pathNumbers[state.journeyProgress + 1];
        const direction = state.pathPlan.direction === -1 ? 'geri' : 'ileri';
        const edgePadding = 8;
        const getTrackPosition = (index) => edgePadding + ((index / (totalStations - 1)) * (100 - edgePadding * 2));
        const trainPosition = getTrackPosition(state.journeyProgress);
        return `
            <div class="ce-task-surface">
                <article class="ce-task-card">
                    <span class="ce-task-eyebrow">${task.eyebrow}</span>
                    <h3 class="ce-task-title">${task.prompt}</h3>
                    <p class="ce-task-subtitle">${task.support}</p>
                    ${renderHintPanel()}
                    <div class="ce-path-guide" aria-label="Ritmik sayma yönergesi">
                        <div class="ce-path-guide-card ce-path-guide-card--current">
                            <span>Tren şimdi</span>
                            <strong>${currentNumber}</strong>
                        </div>
                        <div class="ce-path-guide-card">
                            <span>Sayma kuralı</span>
                            <strong>${stepLabel(state.pathPlan.step)} ${direction}</strong>
                        </div>
                        <div class="ce-path-guide-card">
                            <span>Birlikte söyle</span>
                            <strong>${currentNumber}${nextNumber != null ? ` → ${nextNumber}` : ''}</strong>
                        </div>
                    </div>
                    <div class="ce-rail-scene">
                        <div class="ce-hill ce-hill-1"></div>
                        <div class="ce-hill ce-hill-2"></div>
                        ${task.pathNumbers.map((number, index) => `<div class="ce-station ${index < state.journeyProgress ? 'is-cleared' : ''} ${index === state.journeyProgress ? 'is-current' : ''}" style="left:${getTrackPosition(index)}%;"><div class="ce-station-marker">${index <= state.journeyProgress ? number : '?'}</div><div class="ce-station-label">${index === totalStations - 1 ? 'Hedef' : `Durak ${index + 1}`}</div></div>`).join('')}
                        <div class="ce-train" style="left:${trainPosition}%;">
                            <div class="ce-train-badge" aria-label="Tren şu anda ${currentNumber} sayısında">${currentNumber}</div>
                            <div class="ce-train-body"></div><div class="ce-train-cabin"></div><div class="ce-train-front"></div><div class="ce-train-wheel w1"></div><div class="ce-train-wheel w2"></div>
                        </div>
                    </div>
                </article>
                ${renderAnswerGrid(task.options, 'single-answer')}
            </div>
        `;
    }

    function renderAdditionMachineTask() {
        const task = state.task;
        const leftReady = task.leftCount === task.leftTarget;
        const rightReady = task.rightCount === task.rightTarget;
        const resultValue = task.resultShown ? task.answer : '?';
        return `
            <div class="ce-task-surface">
                <article class="ce-task-card ce-machine-card">
                    <div class="ce-machine-header">
                        <span class="ce-task-eyebrow">${task.eyebrow}</span>
                        <h3 class="ce-task-title">Sihirli Toplama Makinesi</h3>
                        <p class="ce-task-subtitle">${task.support}</p>
                    </div>
                    ${renderHintPanel()}
                    <div class="ce-machine-layout">
                        <div class="ce-ball-tray ce-ball-tray--left">
                            <span class="ce-machine-label">Tıkla ve Ekle</span>
                            <div class="ce-ball-grid">
                                ${Array.from({ length: 20 }, (_, index) => `
                                    <button type="button" class="ce-ball-btn ce-ball-btn--red ${index < task.leftCount ? 'is-used' : ''}" data-action="addition-pick-left" data-nav-item="true" aria-label="Kırmızı top ekle" ${task.resultShown || task.leftCount >= task.leftTarget ? 'disabled' : ''}></button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="ce-machine-center">
                            <div class="ce-equation-board" aria-label="${task.leftTarget} artı ${task.rightTarget} eşittir ${task.resultShown ? task.answer : 'bilinmiyor'}">
                                <span class="ce-equation-box ce-equation-box--red">${task.leftTarget}</span>
                                <span class="ce-equation-symbol">+</span>
                                <span class="ce-equation-box ce-equation-box--blue">${task.rightTarget}</span>
                                <span class="ce-equation-symbol">=</span>
                                <span class="ce-equation-box ce-equation-box--green">${resultValue}</span>
                            </div>
                            <div class="ce-machine-top">
                                <div class="ce-machine-chamber ce-machine-chamber--left">
                                    ${Array.from({ length: task.leftCount }, () => '<span class="ce-machine-ball ce-machine-ball--red"></span>').join('')}
                                </div>
                                <div class="ce-machine-divider"></div>
                                <div class="ce-machine-chamber ce-machine-chamber--right">
                                    ${Array.from({ length: task.rightCount }, () => '<span class="ce-machine-ball ce-machine-ball--blue"></span>').join('')}
                                </div>
                            </div>
                            <div class="ce-machine-belt">
                                <button type="button" class="ce-machine-submit" data-action="addition-submit" data-nav-item="true">TOPLA!</button>
                            </div>
                            <div class="ce-machine-result">
                                ${task.resultShown ? Array.from({ length: task.answer }, (_, index) => `<span class="ce-machine-ball ${index < task.leftTarget ? 'ce-machine-ball--red' : 'ce-machine-ball--blue'}"></span>`).join('') : ''}
                            </div>
                        </div>

                        <div class="ce-machine-side">
                            <button type="button" class="ce-machine-side-btn ce-machine-side-btn--primary" data-action="addition-new-question" data-nav-item="true">Soru Ver</button>
                            <button type="button" class="ce-machine-side-btn" data-action="addition-clear" data-nav-item="true">Temizle</button>
                            <div class="ce-ball-tray ce-ball-tray--right">
                                <span class="ce-machine-label">Tıkla ve Ekle</span>
                                <div class="ce-ball-grid">
                                    ${Array.from({ length: 20 }, (_, index) => `
                                        <button type="button" class="ce-ball-btn ce-ball-btn--blue ${index < task.rightCount ? 'is-used' : ''}" data-action="addition-pick-right" data-nav-item="true" aria-label="Mavi top ekle" ${task.resultShown || task.rightCount >= task.rightTarget ? 'disabled' : ''}></button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="ce-counting-hint">
                        <span class="ce-badge">Kırmızı hazır: ${task.leftCount} / ${task.leftTarget}</span>
                        <span class="ce-badge">Mavi hazır: ${task.rightCount} / ${task.rightTarget}</span>
                        <span class="ce-badge">${leftReady && rightReady ? 'Hazır, şimdi TOPLA!' : 'İki tarafı da tamamla'}</span>
                    </div>
                </article>
            </div>
        `;
    }

    function renderMultiTask() {
        const task = state.task;
        const values = state.optionState.values;
        return `
            <div class="ce-task-surface">
                <article class="ce-task-card">
                    <span class="ce-task-eyebrow">${task.eyebrow}</span>
                    <h3 class="ce-task-title">${task.prompt}</h3>
                    <p class="ce-task-subtitle">${task.support}</p>
                    ${renderHintPanel()}
                    <div class="ce-sequence-row" style="margin-top:18px;">
                        ${task.sequence.map((item, sequenceIndex) => {
                const blankIndex = task.blankIndexes.indexOf(sequenceIndex);
                if (blankIndex === -1) return `<div class="ce-sequence-chip">${item}</div>`;
                const value = values[blankIndex];
                const active = state.optionState.activeBlank === blankIndex ? 'is-active' : '';
                return `<button type="button" class="ce-blank-slot ${active}" data-action="select-blank" data-index="${blankIndex}" data-drop-slot="true" data-nav-item="true" aria-label="${blankIndex + 1}. boş kutu ${value == null ? 'boş' : `${value} ile dolu`}">${value == null ? '?' : value}</button>`;
            }).join('')}
                    </div>
                    <div class="ce-option-bank">
                        ${task.options.map((option, index) => `<button type="button" class="ce-option-pill ${isOptionUsed(option, index) ? 'is-used' : ''}" data-action="pick-option" data-value="${option}" data-option-index="${index}" data-draggable-option="true" draggable="${!isOptionUsed(option, index)}" data-nav-item="true" aria-label="${option} seçeneği">${option}</button>`).join('')}
                    </div>
                    <div class="ce-tool-row">
                        <button type="button" class="ce-primary-btn" data-action="submit-sequence" data-nav-item="true">Kontrol Et</button>
                        <button type="button" class="ce-secondary-btn" data-action="clear-blanks" data-nav-item="true">Temizle</button>
                    </div>
                </article>
            </div>
        `;
    }

    function renderAnswerGrid(options) {
        return `
            <div class="ce-answer-grid">
                ${options.map((option) => `<button type="button" class="ce-answer-btn" data-action="select-answer" data-value="${option}" data-nav-item="true" aria-label="${option} cevabı"><strong>${option}</strong><span>${numberToTurkish(option)}</span></button>`).join('')}
            </div>
        `;
    }

    function renderNumberSpotlight(task) {
        return `
            <div class="ce-number-spotlight" style="margin-top:20px;">
                <div class="ce-big-number" aria-label="${task.number} sayısı">
                    <div><div class="ce-big-number-value">${task.number}</div><div class="ce-big-number-word">${numberToTurkish(task.number)}</div></div>
                </div>
                <div class="ce-objects-grid">${task.objects.map((item) => renderObjectChip(item.emoji, item.label, item.displayLabel)).join('')}</div>
            </div>
        `;
    }

    function renderHintPanel() {
        if (!state.hintMessage) return '';
        return `<div class="ce-inline-hint" role="status" aria-live="polite"><strong>İpucu:</strong><span>${escapeHtml(state.hintMessage)}</span></div>`;
    }

    function renderMistakeReview() {
        if (!state.mistakes.length) {
            return `
                <div class="ce-mistake-review">
                    <h3 class="ce-card-title">Hata gözden geçirme</h3>
                    <p class="ce-summary-text">Bu turda hata yapılan görev görünmüyor. Harika bir dikkat gösterdin.</p>
                </div>
            `;
        }

        return `
            <div class="ce-mistake-review">
                <h3 class="ce-card-title">Hata gözden geçirme</h3>
                <div class="ce-mistake-list">
                    ${state.mistakes.map((item) => `
                        <article class="ce-mistake-card">
                            <strong>${escapeHtml(item.modeTitle)}</strong>
                            <p>${escapeHtml(item.prompt)}</p>
                            <span class="ce-badge">İpucu: ${escapeHtml(item.hint)}</span>
                            <span class="ce-badge">Doğru cevap: ${escapeHtml(item.answer)}</span>
                        </article>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderObjectChip(emoji, label, displayLabel) {
        return `<div class="ce-object-chip" aria-label="${label}"><span>${emoji}</span>${displayLabel ? `<small>${displayLabel}</small>` : ''}</div>`;
    }

    function renderDifficultyButton(difficulty) {
        const selected = difficulty.id === state.difficulty ? 'is-selected' : '';
        return `<button type="button" class="ce-chip-btn ${selected}" data-action="set-difficulty" data-value="${difficulty.id}" data-nav-item="true" aria-pressed="${difficulty.id === state.difficulty}"><strong>${difficulty.label}</strong><span>${difficulty.subtitle}</span></button>`;
    }

    function renderModeButton(mode) {
        const progress = getModeProgress(mode.id, state.difficulty);
        return `
            <article class="ce-mode-tile">
                <div class="ce-badge" style="background:${hexToRgba(mode.color, 0.16)}; color:${mode.color};">${mode.icon} ${mode.title}</div>
                <h3>${mode.title}</h3>
                <p>${getModeDescription(mode.id)}</p>
                <div class="ce-badge-row">
                    <span class="ce-badge">En iyi puan: ${progress.bestScore}</span>
                    <span class="ce-badge">En iyi yıldız: ${progress.bestStars}</span>
                </div>
                <div class="ce-action-row">
                    <button type="button" class="ce-primary-btn" data-action="start-mode" data-value="${mode.id}" data-nav-item="true">Başlat</button>
                    <button type="button" class="ce-secondary-btn" data-action="open-tutorial" data-mode="${mode.id}" data-nav-item="true">Nasıl oynanır?</button>
                </div>
            </article>
        `;
    }

    function handleDelegatedClick(event) {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        audioManager.playClick();

        if (action === 'set-difficulty') { state.difficulty = actionEl.dataset.value; render(); return; }
        if (action === 'go-modes') { state.screen = 'modes'; render(); return; }
        if (action === 'back-start') { state.paused = false; state.screen = 'start'; state.activeMode = null; closeModal(); render(); return; }
        if (action === 'open-settings') { openSettings(); return; }
        if (action === 'save-settings') { saveSettingsFromModal(); return; }
        if (action === 'reset-progress') { resetCurrentStudentProgress(); return; }
        if (action === 'close-modal') { closeModal(); return; }
        if (action === 'save-student') { const field = document.getElementById('startStudentName'); initializeProfile(field ? field.value : state.studentName); render(); return; }
        if (action === 'start-mode') { beginMode(actionEl.dataset.value, { autoTutorial: true }); return; }
        if (action === 'open-tutorial') { openTutorial(actionEl.dataset.mode || state.activeMode); return; }
        if (action === 'tutorial-audio') { playTutorialAudio(actionEl.dataset.mode || state.activeMode); return; }
        if (action === 'toggle-count-object') { toggleCountObject(Number(actionEl.dataset.index)); return; }
        if (action === 'addition-pick-left') { updateAdditionCount('left'); return; }
        if (action === 'addition-pick-right') { updateAdditionCount('right'); return; }
        if (action === 'addition-clear') { clearAdditionMachine(); return; }
        if (action === 'addition-submit') { submitAdditionMachine(); return; }
        if (action === 'addition-new-question') { nextTask(); render(); return; }
        if (action === 'select-answer') { submitSingleAnswer(Number(actionEl.dataset.value)); return; }
        if (action === 'select-blank') { if (!state.answerLocked && state.optionState) { state.optionState.activeBlank = Number(actionEl.dataset.index); render(); } return; }
        if (action === 'pick-option') { fillBlank(Number(actionEl.dataset.value), Number(actionEl.dataset.optionIndex)); return; }
        if (action === 'clear-blanks') { clearBlanks(); return; }
        if (action === 'submit-sequence') { submitSequenceAnswer(); return; }
        if (action === 'toggle-pause') { togglePause(); return; }
        if (action === 'resume-game') { state.paused = false; closeModal(); render(); return; }
        if (action === 'request-exit') { state.modal = { type: 'confirm-exit' }; render(); return; }
        if (action === 'cancel-exit') { closeModal(); return; }
        if (action === 'confirm-exit') { window.location.href = '../index.html'; return; }
        if (action === 'play-again') { beginMode(state.activeMode, { autoTutorial: false }); return; }
        if (action === 'change-mode') { state.screen = 'modes'; state.activeMode = null; state.paused = false; closeModal(); render(); }
    }

    function handleDelegatedInput(event) {
        if (event.target && event.target.id === 'startStudentName') return;
    }

    function handleHomeClick(event) {
        if (state.screen === 'game') {
            event.preventDefault();
            state.modal = { type: 'confirm-exit' };
            render();
        }
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
        else document.exitFullscreen().catch(() => { });
    }

    function openSettings() {
        state.modal = { type: 'settings' };
        render();
    }

    function closeModal() {
        state.modal = null;
        render();
    }

    function saveSettingsFromModal() {
        const studentField = document.getElementById('studentNameField');
        const difficultyField = document.getElementById('difficultyField');
        const questionField = document.getElementById('questionCountField');
        const quickTourField = document.getElementById('quickTourField');
        const adaptiveField = document.getElementById('adaptiveField');
        const contrastField = document.getElementById('contrastField');
        initializeProfile(studentField ? studentField.value : state.studentName);
        if (difficultyField && DIFFICULTIES[difficultyField.value]) state.difficulty = difficultyField.value;
        state.settings.questionsPerSession = Number(questionField ? questionField.value : state.settings.questionsPerSession);
        state.settings.quickTourSeconds = Number(quickTourField ? quickTourField.value : state.settings.quickTourSeconds);
        state.settings.adaptiveEnabled = !!(adaptiveField && adaptiveField.checked);
        state.settings.highContrast = !!(contrastField && contrastField.checked);
        persistCurrentProfile();
        state.totalRounds = state.settings.questionsPerSession;
        closeModal();
    }

    function resetCurrentStudentProgress() {
        state.store.profiles[state.studentName] = createDefaultProfile(state.studentName);
        state.settings = { ...GAME_CONFIG.defaults.settings };
        persistCurrentProfile();
        closeModal();
    }

    function openTutorial(modeId) {
        state.modal = { type: 'tutorial', mode: modeId };
        getCurrentProfile().tutorialsSeen[modeId] = true;
        persistCurrentProfile();
        render();
    }

    function playTutorialAudio(modeId) {
        const mode = getModeDefinition(modeId);
        audioManager.speakText(mode.tutorial.map((step) => `${step.title}. ${step.text}`).join(' '));
    }

    function togglePause() {
        if (state.screen !== 'game') return;
        state.paused = !state.paused;
        if (state.paused) state.modal = { type: 'pause' };
        else if (state.modal && state.modal.type === 'pause') state.modal = null;
        render();
    }

    function beginMode(modeId, options) {
        const mode = getModeDefinition(modeId);
        if (!mode) return;

        state.activeMode = modeId;
        state.screen = 'game';
        state.round = 0;
        state.totalRounds = state.settings.questionsPerSession;
        state.score = 0;
        state.correctCount = 0;
        state.wrongCount = 0;
        state.streak = 0;
        state.bestStreak = 0;
        state.stars = 0;
        state.challengeMs = modeId === 'challenge' ? state.settings.quickTourSeconds * 1000 : 0;
        state.paused = false;
        state.feedback = null;
        state.feedbackMs = 0;
        state.pathPlan = null;
        state.optionState = null;
        state.answerLocked = false;
        state.adaptiveShift = 0;
        state.consecutiveCorrect = 0;
        state.consecutiveWrong = 0;
        state.sessionPatterns = new Set();
        state.mistakes = [];
        state.hintMessage = '';
        state.sessionHistory = [];
        state.sessionStartedAt = Date.now();
        state.journeyProgress = 0;
        nextTask();

        const shouldAutoTutorial = options && options.autoTutorial;
        if (shouldAutoTutorial && !getCurrentProfile().tutorialsSeen[modeId]) {
            state.modal = { type: 'tutorial', mode: modeId };
            getCurrentProfile().tutorialsSeen[modeId] = true;
            persistCurrentProfile();
        } else {
            state.modal = null;
        }
        render();
    }

    function nextTask() {
        state.taskToken += 1;
        state.answerLocked = false;
        state.hintMessage = '';
        state.task = createUniqueTask(state.activeMode);
        state.optionState = state.task.answerType === 'multi'
            ? { activeBlank: 0, values: new Array(state.task.answers.length).fill(null), optionUsage: {} }
            : null;
    }

    function createUniqueTask(modeId) {
        for (let attempt = 0; attempt < GAME_CONFIG.repeatSignatureLimit; attempt += 1) {
            const task = buildTask(modeId);
            if (!state.sessionPatterns.has(task.signature)) {
                state.sessionPatterns.add(task.signature);
                return task;
            }
        }
        return buildTask(modeId);
    }

    function buildTask(modeId) {
        if (modeId === 'challenge') return buildChallengeTask();
        if (modeId === 'recognize') return buildRecognitionTaskEnhanced();
        if (modeId === 'count') return buildCountingTask();
        if (modeId === 'sequence') return buildSequenceTask(false);
        if (modeId === 'path') return buildPathTask();
        if (modeId === 'missing') return buildSequenceTask(true);
        if (modeId === 'addition') return buildAdditionMachineTask();
        return buildRecognitionTaskEnhanced();
    }

    function buildRecognitionTask() {
        const profile = getEffectiveTier();
        const number = randomInt(profile.min, Math.min(profile.max, state.difficulty === 'hard' ? 120 : profile.max));
        const objects = createObjectList(number, true);
        return {
            signature: `recognize:${number}:${objects.length}`,
            eyebrow: 'Sayıyı Tanı',
            prompt: 'Bu sayı hangi kartla eşleşiyor?',
            support: 'Büyük sayıya, yazıyla adına ve nesne miktarına birlikte bak.',
            visual: 'number',
            answerType: 'single',
            number,
            objects,
            answer: number,
            options: buildOptions(number, profile.max, 4),
            points: GAME_CONFIG.pointMap.recognize,
            successText: `${number} sayısını doğru tanıdın.`,
            errorText: `${numberToTurkish(number)} sayısını bir kez daha incele.`
        };
    }

    function buildRecognitionTaskEnhanced() {
        const profile = getEffectiveTier();
        const number = randomInt(profile.min, Math.min(profile.max, state.difficulty === 'hard' ? 120 : profile.max));
        const objects = createRecognitionObjects(number);
        return {
            signature: `recognize-v2:${number}:${objects.map((item) => item.label).join('-')}`,
            eyebrow: 'Sayıyı Tanı',
            prompt: 'Bu sayı hangi kartla eşleşiyor?',
            support: number > 20
                ? 'Büyük sayıya bak. Nesneler onluk gruplar ve birlikler halinde gösteriliyor.'
                : 'Büyük sayıya, yazıyla adına ve nesne miktarına birlikte bak.',
            visual: 'number',
            answerType: 'single',
            number,
            objects,
            answer: number,
            options: buildOptions(number, profile.max, 4),
            points: GAME_CONFIG.pointMap.recognize,
            successText: `${number} sayısını doğru tanıdın.`,
            errorText: `${numberToTurkish(number)} sayısını bir kez daha incele.`
        };
    }

    function buildCountingTask() {
        const profile = getEffectiveTier();
        const answer = randomInt(Math.max(3, profile.min), Math.min(profile.countMax, profile.max));
        const baseObject = sample(COUNTABLE_OBJECT_SETS);
        return {
            signature: `count:${answer}:${baseObject.label}`,
            eyebrow: 'Nesne Say ve Eşleştir',
            prompt: 'Nesneleri tek tek işaretle, sonra doğru sayı kartını seç.',
            support: 'Her nesneye bir kez dokunursan sayması daha kolay olur.',
            visual: 'objects',
            answerType: 'single',
            objects: Array.from({ length: answer }, () => ({ ...baseObject })),
            marked: Array.from({ length: answer }, () => false),
            answer,
            options: buildOptions(answer, Math.max(profile.countMax, answer + 4), 4),
            points: GAME_CONFIG.pointMap.count,
            successText: `Toplam ${answer} nesneyi doğru saydın.`,
            errorText: 'Nesneleri tek tek işaretleyip yeniden say.'
        };
    }

    function buildAdditionMachineTask() {
        const profile = getEffectiveTier();
        const maxAddend = profile.tier >= 2 ? 10 : 5;
        const leftTarget = randomInt(1, maxAddend);
        const rightTarget = randomInt(0, maxAddend);
        return {
            signature: `addition-machine:${leftTarget}:${rightTarget}`,
            eyebrow: 'Sihirli Toplama Makinesi',
            prompt: 'Topları doğru haznelere yerleştir ve toplamı oluştur.',
            support: 'Kırmızı toplar soldaki sayıyı, mavi toplar sağdaki sayıyı gösterir.',
            visual: 'addition-machine',
            answerType: 'interactive',
            leftTarget,
            rightTarget,
            leftCount: 0,
            rightCount: 0,
            resultShown: false,
            answer: leftTarget + rightTarget,
            points: GAME_CONFIG.pointMap.addition,
            successText: 'Toplama makinesi doğru çalıştı.',
            errorText: 'İki haznedeki top sayısını soru ile eşleştir.'
        };
    }

    function buildSequenceTask(isMissingMode) {
        const profile = getEffectiveTier();
        const step = sample(profile.steps);
        const descending = profile.backward && Math.random() > 0.62;
        const length = state.difficulty === 'hard' || profile.tier >= 3 ? 6 : 5;
        let start = randomInt(profile.min, profile.max);
        if (descending) start = Math.max(start, profile.min + step * (length + 2));
        const sequence = Array.from({ length }, (_, index) => start + (descending ? -index * step : index * step));
        const blankCount = isMissingMode ? (profile.tier >= 2 ? 3 : 2) : (profile.tier >= 2 ? 2 : 1);
        const blankIndexes = pickBlankIndexes(length, blankCount, false);
        const answers = blankIndexes.map((index) => sequence[index]);
        return {
            signature: `${isMissingMode ? 'missing' : 'sequence'}:${sequence.join('-')}:${blankIndexes.join(',')}`,
            eyebrow: isMissingMode ? 'Eksik Sayıları Bul' : 'Sıralamayı Tamamla',
            prompt: isMissingMode ? 'Boş kutuları doldur ve örüntüyü tamamla.' : 'Dizideki eksik kutuları doğru sırayla doldur.',
            support: `${descending ? 'Geriye doğru' : 'İleriye doğru'} ${stepLabel(step)} ilerliyoruz.`,
            answerType: 'multi',
            sequence,
            blankIndexes,
            answers,
            options: shuffle(answers.concat(buildDistractors(answers, step, profile.max))).slice(0, answers.length + Math.max(3, blankCount)),
            points: isMissingMode ? GAME_CONFIG.pointMap.missing : GAME_CONFIG.pointMap.sequence,
            successText: 'Sayı düzenini doğru kurdun.',
            errorText: 'Adım sayısını tekrar kontrol et.'
        };
    }

    function buildPathTask() {
        const profile = getEffectiveTier();
        if (!state.pathPlan) {
            const step = sample(profile.steps);
            const direction = profile.backward && Math.random() > 0.6 ? -1 : 1;
            const stationCount = 6;
            let start = randomInt(profile.min, profile.max);
            if (direction === -1) start = Math.max(start, profile.min + step * (stationCount + 2));
            state.pathPlan = {
                step,
                direction,
                pathNumbers: Array.from({ length: stationCount }, (_, index) => start + (index * step * direction))
            };
        }
        const answer = state.pathPlan.pathNumbers[state.journeyProgress + 1];
        return {
            signature: `path:${state.pathPlan.pathNumbers.join('-')}:${state.journeyProgress}`,
            eyebrow: 'Ritmik Sayma Yolu',
            prompt: 'Treni bir sonraki durağa götür.',
            support: `${state.pathPlan.direction === -1 ? 'Geri' : 'İleri'} ${stepLabel(state.pathPlan.step)} sayıyoruz. Sıradaki durak kaç?`,
            answerType: 'single',
            pathNumbers: state.pathPlan.pathNumbers,
            answer,
            options: buildOptions(answer, state.pathPlan.pathNumbers[state.pathPlan.pathNumbers.length - 1] + state.pathPlan.step, 4),
            points: GAME_CONFIG.pointMap.path,
            successText: 'Tren bir durak daha ilerledi.',
            errorText: 'Ritmi yeniden say ve sonraki durağı bul.'
        };
    }

    function buildChallengeTask() {
        const kinds = ['recognize', 'count', 'sequence'];
        const chosen = sample(kinds);
        if (chosen === 'recognize') {
            const task = buildRecognitionTaskEnhanced();
            task.eyebrow = 'Hızlı Tur';
            task.prompt = 'Hızlıca doğru sayıyı seç!';
            task.support = 'Doğru kartı seçmek için büyük sayıya bak.';
            task.signature = `challenge:${task.signature}`;
            task.points = GAME_CONFIG.pointMap.challenge;
            return task;
        }
        if (chosen === 'count') {
            const task = buildCountingTask();
            task.eyebrow = 'Hızlı Tur';
            task.prompt = 'Nesneleri hızlı ama dikkatli say.';
            task.support = 'Gerekirse birkaç nesneyi işaretleyip sayını kontrol et.';
            task.signature = `challenge:${task.signature}`;
            task.points = GAME_CONFIG.pointMap.challenge;
            return task;
        }
        const task = buildSequenceTask(false);
        task.eyebrow = 'Hızlı Tur';
        task.prompt = 'Eksik kutuyu hızlıca tamamla.';
        task.signature = `challenge:${task.signature}`;
        task.answerType = 'single';
        task.answer = task.answers[0];
        task.visual = 'sequence-preview';
        task.options = buildOptions(task.answer, getEffectiveTier().max, 4);
        task.blankIndexes = [task.blankIndexes[0]];
        task.points = GAME_CONFIG.pointMap.challenge;
        return task;
    }

    function buildArithmeticTask(kind) {
        const profile = getEffectiveTier();
        const maxBase = profile.tier >= 3 ? 30 : 20;
        let left = randomInt(4, maxBase);
        let right = randomInt(1, Math.max(3, Math.floor(maxBase / 2)));
        let answer = 0;
        if (kind === 'addition') answer = left + right;
        else {
            if (right > left) [left, right] = [right, left];
            answer = left - right;
        }
        return {
            signature: `${kind}:${left}:${right}`,
            eyebrow: kind === 'addition' ? 'Toplama Vagonu' : 'Çıkarma Garı',
            prompt: kind === 'addition' ? 'Toplamı bul ve doğru kartı seç.' : 'Sonucu bul ve doğru kartı seç.',
            support: kind === 'addition' ? 'İki sayıyı birleştiriyoruz.' : 'İkinci sayı kadar geriye gidiyoruz.',
            visual: 'equation',
            equationHtml: `<div class="ce-equation"><span>${left}</span><span>${kind === 'addition' ? '+' : '-'}</span><span>${right}</span><span>=</span><span>?</span></div>`,
            equationLabel: `${left} ${kind === 'addition' ? 'artı' : 'eksi'} ${right}`,
            answerType: 'single',
            answer,
            options: buildOptions(answer, answer + 12, 4),
            points: kind === 'addition' ? GAME_CONFIG.pointMap.addition : GAME_CONFIG.pointMap.subtraction,
            successText: 'Matematik vagonunu da doğru çözdün.',
            errorText: 'İşlemi bir kez daha düşün.'
        };
    }

    function submitSingleAnswer(value) {
        if (!state.task || state.answerLocked || state.paused || state.modal) return;
        if (state.task.answerType !== 'single') return;
        evaluateAnswer(state.taskToken, value === state.task.answer);
    }

    function evaluateAnswer(taskToken, isCorrect) {
        if (taskToken !== state.taskToken || state.answerLocked) return;
        state.answerLocked = true;
        if (isCorrect) {
            state.hintMessage = '';
            state.score += state.task.points || 10;
            state.correctCount += 1;
            state.streak += 1;
            state.bestStreak = Math.max(state.bestStreak, state.streak);
            state.consecutiveCorrect += 1;
            state.consecutiveWrong = 0;
            adaptDifficulty(true);
            const feedback = sample(FEEDBACK_COPY.success);
            showFeedback(true, `${feedback.text} ${state.task.successText}`);
            audioManager.playSuccessChime();
            audioManager.playFeedback(feedback.audio, feedback.text);
            burstParticles();
            setTimeout(() => {
                if (taskToken !== state.taskToken) return;
                advanceAfterSuccess();
            }, GAME_CONFIG.answerRevealDelay);
            return;
        }

        state.wrongCount += 1;
        state.streak = 0;
        state.consecutiveWrong += 1;
        state.consecutiveCorrect = 0;
        state.hintMessage = getTaskHint(state.task);
        if (!state.task.mistakeLogged) {
            state.task.mistakeLogged = true;
            state.mistakes.push({
                modeTitle: getModeDefinition(state.activeMode).title,
                prompt: state.task.prompt,
                hint: state.hintMessage,
                answer: formatTaskAnswer(state.task)
            });
        }
        adaptDifficulty(false);
        const feedback = sample(FEEDBACK_COPY.error);
        showFeedback(false, `${feedback.text} ${state.task.errorText}`);
        audioManager.playErrorChime();
        audioManager.playFeedback(feedback.audio, feedback.text);
        render();
        setTimeout(() => {
            if (taskToken !== state.taskToken) return;
            state.answerLocked = false;
        }, GAME_CONFIG.retryUnlockDelay);
    }

    function advanceAfterSuccess() {
        state.answerLocked = false;
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

    function fillBlank(value, optionIndex) {
        if (!state.optionState || state.answerLocked || state.paused || state.modal) return;
        const usageKey = `${value}:${optionIndex}`;
        if (state.optionState.optionUsage[usageKey]) return;
        const values = state.optionState.values.slice();
        let blankIndex = state.optionState.activeBlank;
        if (values[blankIndex] != null) blankIndex = values.findIndex((item) => item == null);
        if (blankIndex === -1) return;
        values[blankIndex] = value;
        state.optionState.values = values;
        state.optionState.optionUsage[usageKey] = true;
        const nextBlank = values.findIndex((item) => item == null);
        state.optionState.activeBlank = nextBlank === -1 ? blankIndex : nextBlank;
        render();
    }

    function clearBlanks() {
        if (!state.optionState || state.answerLocked) return;
        state.optionState.values = new Array(state.task.answers.length).fill(null);
        state.optionState.activeBlank = 0;
        state.optionState.optionUsage = {};
        render();
    }

    function submitSequenceAnswer() {
        if (!state.optionState || state.answerLocked || state.paused || state.modal) return;
        if (state.optionState.values.some((value) => value == null)) {
            showFeedback(false, 'Önce tüm boş kutuları dolduralım.');
            return;
        }
        const isCorrect = state.optionState.values.every((value, index) => value === state.task.answers[index]);
        evaluateAnswer(state.taskToken, isCorrect);
    }

    function toggleCountObject(index) {
        if (state.activeMode !== 'count' || state.answerLocked || state.paused || state.modal) return;
        state.task.marked[index] = !state.task.marked[index];
        render();
    }

    function updateAdditionCount(side) {
        if (state.activeMode !== 'addition' || !state.task || state.answerLocked || state.paused || state.modal || state.task.resultShown) return;
        const countKey = side === 'left' ? 'leftCount' : 'rightCount';
        const targetKey = side === 'left' ? 'leftTarget' : 'rightTarget';
        if (state.task[countKey] >= state.task[targetKey]) return;
        state.task[countKey] += 1;
        render();
    }

    function clearAdditionMachine() {
        if (state.activeMode !== 'addition' || !state.task || state.answerLocked) return;
        state.task.leftCount = 0;
        state.task.rightCount = 0;
        state.task.resultShown = false;
        state.hintMessage = '';
        render();
    }

    function submitAdditionMachine() {
        if (state.activeMode !== 'addition' || !state.task || state.answerLocked || state.paused || state.modal) return;
        const isCorrect = state.task.leftCount === state.task.leftTarget && state.task.rightCount === state.task.rightTarget;
        if (isCorrect) state.task.resultShown = true;
        evaluateAnswer(state.taskToken, isCorrect);
    }

    function adaptDifficulty(correct) {
        if (!state.settings.adaptiveEnabled) return;
        if (correct && state.consecutiveCorrect >= 2) {
            state.adaptiveShift = clamp(state.adaptiveShift + 1, GAME_CONFIG.adaptiveShiftBounds.min, GAME_CONFIG.adaptiveShiftBounds.max);
            state.consecutiveCorrect = 0;
        } else if (!correct && state.consecutiveWrong >= 2) {
            state.adaptiveShift = clamp(state.adaptiveShift - 1, GAME_CONFIG.adaptiveShiftBounds.min, GAME_CONFIG.adaptiveShiftBounds.max);
            state.consecutiveWrong = 0;
        }
    }

    function finishMode() {
        state.stars = calculateStars();
        updateProgressStore();
        state.screen = 'summary';
        state.paused = false;
        state.modal = null;
        render();
    }

    function updateProgressStore() {
        const profile = getCurrentProfile();
        const namespace = `${state.activeMode}:${state.difficulty}`;
        if (!profile.progress[namespace]) profile.progress[namespace] = { bestScore: 0, bestStars: 0, plays: 0, recentMistakes: [] };
        profile.progress[namespace].bestScore = Math.max(profile.progress[namespace].bestScore, state.score);
        profile.progress[namespace].bestStars = Math.max(profile.progress[namespace].bestStars, state.stars);
        profile.progress[namespace].plays += 1;
        profile.progress[namespace].recentMistakes = state.mistakes.slice(-5);
        profile.achievements.totalStars += state.stars;
        profile.achievements.totalCorrect += state.correctCount;
        profile.settings = { ...state.settings };
        persistStore();
    }

    function calculateStars() {
        if (state.activeMode === 'challenge') {
            const [one, two, three] = GAME_CONFIG.starThresholds.challengeScore;
            if (state.score >= three) return 3;
            if (state.score >= two) return 2;
            if (state.score >= one) return 1;
            return 1;
        }
        const accuracy = getAccuracy();
        const [, two, three] = GAME_CONFIG.starThresholds.accuracy;
        if (accuracy >= three) return 3;
        if (accuracy >= two) return 2;
        return 1;
    }

    function handleGlobalKeydown(event) {
        if (event.key.toLowerCase() === 'f') {
            toggleFullscreen();
            return;
        }
        if (event.key.toLowerCase() === 'p' && state.screen === 'game') {
            event.preventDefault();
            togglePause();
            return;
        }
        if (event.key === 'Escape' && state.modal) {
            if (state.modal.type === 'pause') state.paused = false;
            closeModal();
            return;
        }
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
        const items = getNavigableItems();
        if (!items.length) return;
        state.keyboardMode = true;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            items[state.focusIndex]?.click();
            return;
        }
        event.preventDefault();
        const delta = (event.key === 'ArrowRight' || event.key === 'ArrowDown') ? 1 : -1;
        state.focusIndex = (state.focusIndex + delta + items.length) % items.length;
        syncKeyboardFocus();
    }

    function getNavigableItems() {
        const scope = state.modal ? modalLayer : root;
        return Array.from(scope.querySelectorAll(GAME_CONFIG.keyboardFocusSelector));
    }

    function syncKeyboardFocus() {
        const items = getNavigableItems();
        items.forEach((item, index) => {
            item.tabIndex = index === state.focusIndex ? 0 : -1;
        });
        if (state.keyboardMode && items[state.focusIndex]) items[state.focusIndex].focus();
    }

    function handleDragStart(event) {
        const target = event.target.closest('[data-draggable-option]');
        if (!target || target.classList.contains('is-used')) return;
        event.dataTransfer.setData('text/plain', JSON.stringify({
            value: Number(target.dataset.value),
            optionIndex: Number(target.dataset.optionIndex)
        }));
    }

    function handleDragOver(event) {
        if (event.target.closest('[data-drop-slot]')) event.preventDefault();
    }

    function handleDrop(event) {
        const slot = event.target.closest('[data-drop-slot]');
        if (!slot || !state.optionState) return;
        event.preventDefault();
        const payload = JSON.parse(event.dataTransfer.getData('text/plain'));
        state.optionState.activeBlank = Number(slot.dataset.index);
        fillBlank(payload.value, payload.optionIndex);
    }

    function showFeedback(success, message) {
        state.feedback = { type: success ? 'success' : 'error', message };
        state.feedbackMs = GAME_CONFIG.toastDuration;
        toastEl.textContent = message;
        toastEl.className = `ce-toast is-visible ${success ? 'is-success' : 'is-error'}`;
    }

    function isOptionUsed(option, optionIndex) {
        if (!state.optionState) return false;
        return !!state.optionState.optionUsage[`${option}:${optionIndex}`];
    }

    function getAvailableModes() {
        return MODE_DEFINITIONS;
    }

    function getModeDefinition(modeId) {
        return MODE_DEFINITIONS.find((mode) => mode.id === modeId) || MODE_DEFINITIONS[0];
    }

    function getModeDescription(modeId) {
        return {
            recognize: 'Büyük sayıyı, nesneleri ve yazıyla adını birlikte eşleştir.',
            count: 'Nesnelere tek tek dokun, sonra doğru sayı kartını seç.',
            sequence: 'Sayı örüntüsünü takip et ve eksik kutuları tamamla.',
            path: 'Ritmik sayarak treni her durakta ileri taşı.',
            missing: 'Birden fazla boşluğu aynı örüntü içinde tamamla.',
            challenge: 'Kısa sürede karışık görevleri tamamlayıp seri yakala.',
            addition: 'Kırmızı ve mavi topları haznelere yerleştir, sonra toplama makinesini çalıştır.'
        }[modeId] || '';
    }

    function getModeProgress(modeId, difficultyId) {
        const profile = getCurrentProfile();
        return profile.progress[`${modeId}:${difficultyId}`] || { bestScore: 0, bestStars: 0, plays: 0, recentMistakes: [] };
    }

    function getProgressPercent() {
        if (state.activeMode === 'challenge') {
            const total = state.settings.quickTourSeconds * 1000;
            return Math.max(0, Math.min(100, ((total - state.challengeMs) / total) * 100));
        }
        return state.totalRounds <= 1 ? 0 : (state.round / state.totalRounds) * 100;
    }

    function getEffectiveTier() {
        const baseTier = DIFFICULTIES[state.difficulty].baseTier;
        const tierIndex = clamp(baseTier + (state.settings.adaptiveEnabled ? state.adaptiveShift : 0), 0, GAME_CONFIG.tierProfiles.length - 1);
        return GAME_CONFIG.tierProfiles[tierIndex];
    }

    function getTeacherTip() {
        if (state.activeMode === 'count') return 'Nesnelere birlikte tek tek dokunmak sayma doğruluğunu artırır.';
        if (state.activeMode === 'sequence' || state.activeMode === 'missing') return 'Boşluklardan önce ortak adımı söylemek çocukların örüntüyü fark etmesini kolaylaştırır.';
        if (state.activeMode === 'challenge') return 'Süre baskısını oyunlaştırılmış tekrar gibi sunmak daha rahatlatıcı olur.';
        if (state.activeMode === 'path') return 'Doğru cevaptan sonra tüm sınıf bir sonraki durağı birlikte söyleyebilir.';
        if (state.activeMode === 'addition') return 'Önce her iki grubu ayrı saymak, ardından toplamı birlikte söylemek kavramı güçlendirir.';
        return 'Doğru cevap sonrası yüksek sesle tekrar etmek kalıcılığı artırır.';
    }

    function getLearnedSkills() {
        return [
            `${DIFFICULTIES[state.difficulty].label} seviye`,
            `${state.correctCount} doğru görev`,
            `${state.bestStreak} en iyi seri`,
            state.settings.adaptiveEnabled ? 'Uyarlanabilir zorluk' : 'Sabit zorluk',
            getModeDefinition(state.activeMode).title
        ];
    }

    function getSummaryRecommendation() {
        if (state.activeMode === 'challenge') return 'Hazırsa şimdi belirli bir mod seçip zorlandığın beceriyi sakin tempoda tekrar edebilirsin.';
        if (state.stars === 3) return 'Harika bir oturum oldu. Bir üst seviyeye geçip daha büyük sayı aralıklarını deneyebilirsin.';
        if (state.stars === 2) return 'Güzel bir ilerleme var. Aynı modu tekrar oynarsan puanın daha da artar.';
        return 'Bir tur daha oynayıp ipuçlarına dikkat edersen yıldız sayını hızla yükseltebilirsin.';
    }

    function getAccuracy() {
        const total = state.correctCount + state.wrongCount;
        return total === 0 ? 0 : Math.round((state.correctCount / total) * 100);
    }

    function syncTestingHooks() {
        window.render_game_to_text = () => JSON.stringify({
            coordinateSystem: 'DOM layout, top-left origin, x increases rightward, y increases downward.',
            screen: state.screen,
            studentName: state.studentName,
            difficulty: DIFFICULTIES[state.difficulty].label,
            mode: state.activeMode,
            paused: state.paused,
            modal: state.modal ? state.modal.type : null,
            round: state.round,
            totalRounds: state.totalRounds,
            score: state.score,
            correctCount: state.correctCount,
            wrongCount: state.wrongCount,
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
            countingMarked: state.task && state.task.marked ? state.task.marked.filter(Boolean).length : null,
            additionLeft: state.task && state.activeMode === 'addition' ? state.task.leftCount : null,
            additionRight: state.task && state.activeMode === 'addition' ? state.task.rightCount : null,
            additionTargets: state.task && state.activeMode === 'addition' ? [state.task.leftTarget, state.task.rightTarget] : null,
            additionResultShown: state.task && state.activeMode === 'addition' ? state.task.resultShown : null,
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

    function loadStore() {
        try {
            const raw = localStorage.getItem(GAME_CONFIG.storageKey);
            if (!raw) return { profiles: {}, lastStudent: GAME_CONFIG.defaults.studentName };
            const parsed = JSON.parse(raw);
            return { profiles: parsed.profiles || {}, lastStudent: parsed.lastStudent || GAME_CONFIG.defaults.studentName };
        } catch (error) {
            return { profiles: {}, lastStudent: GAME_CONFIG.defaults.studentName };
        }
    }

    function sanitizeStudentName(name) {
        const trimmed = String(name || '').trim().slice(0, 24);
        return trimmed || GAME_CONFIG.defaults.studentName;
    }

    function numberToTurkish(number) {
        const ones = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
        const tens = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
        if (number === 0) return 'sıfır';
        if (number < 10) return ones[number];
        if (number < 100) return `${tens[Math.floor(number / 10)]} ${ones[number % 10]}`.trim();
        if (number === 100) return 'yüz';
        if (number < 200) return `yüz ${numberToTurkish(number - 100)}`.trim();
        if (number === 200) return 'iki yüz';
        return String(number);
    }

    function numberToAudioTokens(number) {
        if (number === 0) return ['sifir'];
        if (number < 10) return [normalizeAudioToken(numberToTurkish(number))];
        if (number < 100) {
            const tenWord = numberToTurkish(Math.floor(number / 10) * 10);
            const one = number % 10;
            return one === 0 ? [normalizeAudioToken(tenWord)] : [normalizeAudioToken(tenWord), normalizeAudioToken(numberToTurkish(one))];
        }
        if (number === 100) return ['yuz'];
        if (number < 200) return ['yuz'].concat(numberToAudioTokens(number - 100));
        if (number === 200) return ['iki', 'yuz'];
        return [];
    }

    function normalizeAudioToken(text) {
        return String(text || '').toLowerCase().replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/\s+/g, '-');
    }

    function stepLabel(step) {
        if (step === 1) return '1’er';
        if (step === 2) return '2’şer';
        if (step === 3) return '3’er';
        if (step === 4) return '4’er';
        if (step === 5) return '5’er';
        if (step === 10) return '10’ar';
        return `${step}’er`;
    }

    function createObjectList(count, clampForVisual) {
        const visualCount = clampForVisual ? Math.min(count, 18) : count;
        return Array.from({ length: visualCount }, (_, index) => ({ ...COUNTABLE_OBJECT_SETS[index % COUNTABLE_OBJECT_SETS.length] }));
    }

    function createRecognitionObjects(count) {
        const baseObject = sample(COUNTABLE_OBJECT_SETS);
        if (count <= 20) {
            return Array.from({ length: count }, () => ({ ...baseObject }));
        }

        const tens = Math.floor(count / 10);
        const ones = count % 10;
        const groups = Array.from({ length: tens }, () => ({
            emoji: baseObject.emoji,
            label: `10 ${baseObject.label}`,
            displayLabel: '10’luk grup'
        }));
        const units = Array.from({ length: ones }, () => ({
            ...baseObject,
            displayLabel: '1'
        }));
        return groups.concat(units);
    }

    function buildOptions(answer, maxValue, size) {
        const values = new Set([answer]);
        while (values.size < size) {
            const delta = sample([-10, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 10]);
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
            [answer + step, answer - step, answer + step * 2, answer - step * 2].forEach((candidate) => {
                if (candidate >= 0 && candidate <= maxValue && !answers.includes(candidate)) pool.add(candidate);
            });
        });
        return Array.from(pool);
    }

    function pickBlankIndexes(length, count) {
        const candidates = Array.from({ length }, (_, index) => index).filter((index) => index > 0 && index < length - 1);
        const picked = [];
        const shuffled = shuffle(candidates);
        for (const index of shuffled) {
            const adjacent = picked.some((item) => Math.abs(item - index) <= 1);
            if (!adjacent) picked.push(index);
            if (picked.length >= count) break;
        }
        if (picked.length < count) {
            for (const index of shuffled) {
                if (!picked.includes(index)) picked.push(index);
                if (picked.length >= count) break;
            }
        }
        return picked.sort((a, b) => a - b);
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

    function escapeHtml(text) {
        return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getTaskHint(task) {
        if (!task) return 'Soruyu bir kez daha sakince incele.';
        if (state.activeMode === 'count') return 'Her nesneyi yalnızca bir kez işaretleyip sonra toplamı seç.';
        if (state.activeMode === 'path') return task.support || 'Ritmi baştan say ve sonraki durağı bul.';
        if (state.activeMode === 'addition') return 'Önce soldaki kırmızı, sonra sağdaki mavi topları sorudaki sayılar kadar yerleştir.';
        if (task.answerType === 'multi') return 'Kutular arasındaki ortak artış ya da azalış adımını bul.';
        if (task.visual === 'equation') return 'İşlemi yavaşça oku ve sonucu yeniden hesapla.';
        return task.errorText || task.support || 'Sayılara dikkatle yeniden bak.';
    }

    function formatTaskAnswer(task) {
        if (!task) return '-';
        if (task.answerType === 'multi' && task.answers) return task.answers.join(', ');
        if (task.answer != null) return String(task.answer);
        return '-';
    }

    function sample(list) { return list[Math.floor(Math.random() * list.length)]; }
    function shuffle(list) { const clone = list.slice(); for (let i = clone.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [clone[i], clone[j]] = [clone[j], clone[i]]; } return clone; }
    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
    function hexToRgba(hex, alpha) { const value = parseInt(hex.replace('#', ''), 16); const r = (value >> 16) & 255; const g = (value >> 8) & 255; const b = value & 255; return `rgba(${r}, ${g}, ${b}, ${alpha})`; }
}());
