function makeQuestionConfig(overrides = {}) {
    return {
        op: null,
        digits: 1,
        carry: 'nocarry',
        borrow: 'noborrow',
        subMode: 'standard',
        addMode: 'standard',
        addTable: 'all',
        touchPoints: false,
        mulCarry: 'mixed',
        mulTable: 'all',
        mulMode: 'standard',
        ...overrides
    };
}

let config = {
    ...makeQuestionConfig(),
    players: 1,
    playerConfigs: [makeQuestionConfig(), makeQuestionConfig()]
};

function getPlayerConfigCard(index) {
    return document.querySelector(`[data-player-config="${index}"]`);
}

function renderSingleConfig() {
    document.querySelectorAll('#opCards .sel-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.op === config.op);
    });
    document.querySelectorAll('#digitCards .sel-card').forEach(card => {
        card.classList.toggle('selected', parseInt(card.dataset.val, 10) === config.digits);
    });
    const addOptions = document.getElementById('addOptions');
    if (addOptions) {
        addOptions.querySelectorAll('#addCarryCards .sel-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.val === config.carry);
        });
        addOptions.querySelectorAll('#addTableCards .table-pill').forEach(pill => {
            pill.classList.toggle('selected', pill.dataset.val === String(config.addTable));
        });
        addOptions.querySelectorAll('#addModeCards .sel-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.val === config.addMode);
        });
        addOptions.querySelectorAll('#touchMathCards .sel-card').forEach(card => {
            const current = (!config.touchPoints || config.touchPoints === 'off') ? 'off' : config.touchPoints;
            card.classList.toggle('selected', card.dataset.val === current);
        });
        const addTableContainer = document.getElementById('addTableContainer');
        const addModeContainer = document.getElementById('addModeContainer');
        if (addTableContainer) addTableContainer.style.display = config.digits === 1 ? 'flex' : 'none';
        if (addModeContainer) addModeContainer.style.display = config.digits > 1 ? 'flex' : 'none';
    }
    const subOptions = document.getElementById('subOptions');
    if (subOptions) {
        subOptions.querySelectorAll('#subBorrowCards .sel-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.val === config.borrow);
        });
        subOptions.querySelectorAll('#subModeCards .sel-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.val === config.subMode);
        });
        const subModeContainer = document.getElementById('subModeContainer');
        if (subModeContainer) subModeContainer.style.display = config.digits > 1 ? 'flex' : 'none';
    }

    const mulOptions = document.getElementById('mulOptions');
    if (mulOptions) {
        mulOptions.querySelectorAll('#mulCarryCards .sel-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.val === config.mulCarry);
        });
        mulOptions.querySelectorAll('#mulTableCards .table-pill').forEach(pill => {
            pill.classList.toggle('selected', pill.dataset.val === String(config.mulTable));
        });
        mulOptions.querySelectorAll('#mulModeCards .sel-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.val === config.mulMode);
        });

        const tableContainer = document.getElementById('mulTableContainer');
        const modeContainer = document.getElementById('mulModeContainer');
        if (tableContainer) tableContainer.style.display = config.digits === 1 ? 'flex' : 'none';
        if (modeContainer) modeContainer.style.display = config.digits > 1 ? 'flex' : 'none';
    }

    document.getElementById('addOptions').classList.toggle('open', config.op === '+');
    document.getElementById('subOptions').classList.toggle('open', config.op === '-');
    if (mulOptions) mulOptions.classList.toggle('open', config.op === 'x');
}

function renderPlayerConfigCard(index) {
    const playerConfig = config.playerConfigs[index];
    const card = getPlayerConfigCard(index);
    if (!card || !playerConfig) return;

    card.querySelectorAll('[data-op]').forEach(item => {
        item.classList.toggle('selected', item.dataset.op === playerConfig.op);
    });
    card.querySelectorAll('.digit-card[data-val]').forEach(item => {
        item.classList.toggle('selected', parseInt(item.dataset.val, 10) === playerConfig.digits);
    });

    const addOptions = card.querySelector('[data-role="addOptions"]');
    const subOptions = card.querySelector('[data-role="subOptions"]');
    const mulOptions = card.querySelector('[data-role="mulOptions"]');

    if (addOptions) {
        addOptions.classList.toggle('open', playerConfig.op === '+');
        addOptions.querySelectorAll('.sel-card[data-val]').forEach(item => {
            const val = item.dataset.val;
            if (val === 'nocarry' || val === 'carry' || val === 'mixed') {
                item.classList.toggle('selected', val === playerConfig.carry);
            } else if (val === 'standard' || val === 'stepdown') {
                item.classList.toggle('selected', val === playerConfig.addMode);
            } else if (val === 'on' || val === 'off' || val === 'bottom') {
                const current = (!playerConfig.touchPoints || playerConfig.touchPoints === 'off') ? 'off' : playerConfig.touchPoints;
                item.classList.toggle('selected', val === current);
            }
        });
        addOptions.querySelectorAll('.table-pill[data-val]').forEach(pill => {
            pill.classList.toggle('selected', pill.dataset.val === String(playerConfig.addTable));
        });
        const addTableBlock = addOptions.querySelector('[data-role="addTableBlock"]');
        const addModeBlock = addOptions.querySelector('[data-role="addModeBlock"]');
        if (addTableBlock) addTableBlock.style.display = playerConfig.digits === 1 ? 'block' : 'none';
        if (addModeBlock) addModeBlock.style.display = playerConfig.digits > 1 ? 'block' : 'none';
    }
    if (subOptions) {
        subOptions.classList.toggle('open', playerConfig.op === '-');
        subOptions.querySelectorAll('.sel-card[data-val]').forEach(item => {
            const val = item.dataset.val;
            if (val === 'noborrow' || val === 'borrow' || val === 'zero' || val === 'mixed') {
                item.classList.toggle('selected', val === playerConfig.borrow);
            } else if (val === 'standard' || val === 'stepdown') {
                item.classList.toggle('selected', val === playerConfig.subMode);
            }
        });
        const subModeBlock = subOptions.querySelector('[data-role="subModeBlock"]');
        if (subModeBlock) subModeBlock.style.display = playerConfig.digits > 1 ? 'block' : 'none';
    }
    if (mulOptions) {
        mulOptions.classList.toggle('open', playerConfig.op === 'x');
        mulOptions.querySelectorAll('.sel-card[data-val]').forEach(item => {
            const val = item.dataset.val;
            if (val === 'nocarry' || val === 'carry' || val === 'mixed') {
                item.classList.toggle('selected', val === playerConfig.mulCarry);
            } else if (val === 'standard' || val === 'advanced') {
                item.classList.toggle('selected', val === playerConfig.mulMode);
            }
        });
        mulOptions.querySelectorAll('.table-pill[data-val]').forEach(pill => {
            pill.classList.toggle('selected', pill.dataset.val === String(playerConfig.mulTable));
        });
        const tableBlock = mulOptions.querySelector('[data-role="mulTableBlock"]');
        const modeBlock = mulOptions.querySelector('[data-role="mulModeBlock"]');
        if (tableBlock) tableBlock.style.display = playerConfig.digits === 1 ? 'block' : 'none';
        if (modeBlock) modeBlock.style.display = playerConfig.digits > 1 ? 'block' : 'none';
    }
}

function updateStartButtonState() {
    const canStart = config.players === 1
        ? Boolean(config.op)
        : config.playerConfigs.every(playerConfig => Boolean(playerConfig.op));
    document.getElementById('startBtn').disabled = !canStart;
}

function renderModeState() {
    const singleBlock = document.getElementById('singleConfigBlock');
    const twoPlayerConfigs = document.getElementById('twoPlayerConfigs');
    const isTwoPlayer = config.players === 2;

    singleBlock.classList.toggle('two-player-hidden', isTwoPlayer);
    twoPlayerConfigs.classList.toggle('show', isTwoPlayer);

    renderSingleConfig();
    renderPlayerConfigCard(0);
    renderPlayerConfigCard(1);
    updateStartButtonState();
}

function selectOp(el) {
    config.op = el.dataset.op;
    renderModeState();
}

function selectOpt(type, el) {
    if (type === 'touchPoints') {
        const val = el.dataset.val;
        config.touchPoints = (val === 'off' || val === 'false') ? false : val;
    } else {
        config[type] = el.dataset.val;
    }
    renderModeState();
}

function selectDigit(el) {
    config.digits = parseInt(el.dataset.val, 10);
    renderModeState();
}

function selectPlayerOp(index, el) {
    config.playerConfigs[index].op = el.dataset.op;
    renderModeState();
}

function selectPlayerOpt(index, type, el) {
    if (type === 'touchPoints') {
        const val = el.dataset.val;
        config.playerConfigs[index].touchPoints = (val === 'off' || val === 'false') ? false : val;
    } else {
        config.playerConfigs[index][type] = el.dataset.val;
    }
    renderModeState();
}

function selectPlayerDigit(index, el) {
    config.playerConfigs[index].digits = parseInt(el.dataset.val, 10);
    renderModeState();
}

function selectMode(el) {
    document.querySelectorAll('#modeCards .sel-card').forEach(card => card.classList.remove('selected'));
    el.classList.add('selected');
    const nextPlayers = parseInt(el.dataset.players, 10);
    if (nextPlayers === 2 && config.players !== 2) {
        config.playerConfigs = [
            makeQuestionConfig({
                op: config.op,
                digits: config.digits,
                carry: config.carry,
                borrow: config.borrow,
                subMode: config.subMode,
                addMode: config.addMode,
                addTable: config.addTable,
                touchPoints: config.touchPoints,
                mulCarry: config.mulCarry,
                mulTable: config.mulTable,
                mulMode: config.mulMode
            }),
            makeQuestionConfig({
                op: config.op,
                digits: config.digits,
                carry: config.carry,
                borrow: config.borrow,
                subMode: config.subMode,
                addMode: config.addMode,
                addTable: config.addTable,
                touchPoints: config.touchPoints,
                mulCarry: config.mulCarry,
                mulTable: config.mulTable,
                mulMode: config.mulMode
            })
        ];
    }
    config.players = nextPlayers;
    renderModeState();
}

function describeQuestionConfig(questionConfig) {
    const opNames = { '+': 'Toplama', '-': 'Çıkarma', 'x': 'Çarpma' };
    let desc = `${opNames[questionConfig.op] || ''} - ${questionConfig.digits} Basamak`;
    if (questionConfig.op === '+') {
        if (questionConfig.digits === 1) {
            if (questionConfig.addTable === 'ten') desc += ' (Toplamı 10)';
            else if (questionConfig.addTable === 'doubles') desc += ' (İkizler)';
            else if (questionConfig.carry === 'nocarry') desc += ' (Eldesiz)';
            else if (questionConfig.carry === 'carry') desc += ' (Eldeli)';
        } else {
            if (questionConfig.carry === 'nocarry') desc += ' (Eldesiz)';
            else if (questionConfig.carry === 'carry') desc += ' (Eldeli)';
            if (questionConfig.addMode === 'stepdown') desc += ' [1 Basamak Az]';
        }
    }
    if (questionConfig.op === '-') {
        if (questionConfig.borrow === 'noborrow') desc += ' (Bozmasız)';
        else if (questionConfig.borrow === 'borrow') desc += ' (Bozmalı)';
        else if (questionConfig.borrow === 'zero') desc += ' (Sıfırdan)';
        if (questionConfig.subMode === 'stepdown' && questionConfig.digits > 1) desc += ' [1 Basamak Az]';
    }
    if (questionConfig.op === 'x') {
        if (questionConfig.digits === 1 && questionConfig.mulTable && questionConfig.mulTable !== 'all') {
            desc += ` (${questionConfig.mulTable}'ler)`;
        } else if (questionConfig.mulCarry === 'nocarry') {
            desc += ' (Eldesiz)';
        } else if (questionConfig.mulCarry === 'carry') {
            desc += ' (Eldeli)';
        }
    }
    if (questionConfig.touchPoints && questionConfig.touchPoints !== 'off') {
        desc += (questionConfig.touchPoints === 'bottom' || questionConfig.touchPoints === 'smaller') ? ' • TouchMath (Küçük Sayı)' : ' • TouchMath';
    }
    return desc;
}

function startGame() {
    const canStart = config.players === 1
        ? Boolean(config.op)
        : config.playerConfigs.every(playerConfig => Boolean(playerConfig.op));
    if (!canStart) return;
    document.getElementById('entryScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.add('active');
    document.getElementById('configBadge').textContent = config.players === 2
        ? '2 Kisi - Ogrenciye Gore Ayarli'
        : `${describeQuestionConfig(config)} - Tek Kisi`;
    Game.init({
        ...config,
        playerConfigs: config.playerConfigs.map(playerConfig => makeQuestionConfig(playerConfig))
    });
}

document.getElementById('startBtn').disabled = true;

function applyQueryConfigFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    const playersCount = params.get('players');
    if (playersCount) {
        const modeCard = document.querySelector(`#modeCards .sel-card[data-players="${playersCount}"]`);
        if (modeCard) selectMode(modeCard);
    }

    let op = params.get('op');
    if (op === ' ') op = '+';
    const digits = params.get('digits');
    const carry = params.get('carry');
    const borrow = params.get('borrow');

    if (op) {
        const opCard = document.querySelector(`#opCards .sel-card[data-op="${op}"]`);
        if (opCard) selectOp(opCard);
    }
    if (digits) {
        const digitCard = document.querySelector(`#digitCards .sel-card[data-val="${digits}"]`);
        if (digitCard) selectDigit(digitCard);
    }
    if (carry) {
        const carryCard = document.querySelector(`#addOptions .sel-card[data-val="${carry}"]`);
        if (carryCard) selectOpt('carry', carryCard);
    }
    if (borrow) {
        const borrowCard = document.querySelector(`#subOptions .sel-card[data-val="${borrow}"]`);
        if (borrowCard) selectOpt('borrow', borrowCard);
    }

    for (let i = 0; i < 2; i++) {
        const prefix = `p${i + 1}_`;
        let playerOp = params.get(prefix + 'op');
        if (playerOp === ' ') playerOp = '+';
        const playerDigits = params.get(prefix + 'digits');
        const playerCarry = params.get(prefix + 'carry');
        const playerBorrow = params.get(prefix + 'borrow');
        const playerSubMode = params.get(prefix + 'subMode');
        const playerAddMode = params.get(prefix + 'addMode');
        const playerAddTable = params.get(prefix + 'addTable');
        const playerTouch = params.get(prefix + 'touchPoints');

        const playerMulCarry = params.get(prefix + 'mulCarry');
        const playerMulTable = params.get(prefix + 'mulTable');
        const playerMulMode = params.get(prefix + 'mulMode');

        if (playerOp) config.playerConfigs[i].op = playerOp;
        if (playerDigits) config.playerConfigs[i].digits = parseInt(playerDigits, 10);
        if (playerCarry) config.playerConfigs[i].carry = playerCarry;
        if (playerBorrow) config.playerConfigs[i].borrow = playerBorrow;
        if (playerSubMode) config.playerConfigs[i].subMode = playerSubMode;
        if (playerAddMode) config.playerConfigs[i].addMode = playerAddMode;
        if (playerAddTable) config.playerConfigs[i].addTable = playerAddTable;
        if (playerTouch) config.playerConfigs[i].touchPoints = (playerTouch === 'off' || playerTouch === '0' || playerTouch === 'false') ? false : (playerTouch === 'bottom' || playerTouch === 'smaller' ? 'bottom' : 'on');
        if (playerMulCarry) config.playerConfigs[i].mulCarry = playerMulCarry;
        if (playerMulTable) config.playerConfigs[i].mulTable = playerMulTable;
        if (playerMulMode) config.playerConfigs[i].mulMode = playerMulMode;
    }

    const subMode = params.get('subMode');
    if (subMode) config.subMode = subMode;
    const addMode = params.get('addMode');
    if (addMode) config.addMode = addMode;
    const addTable = params.get('addTable');
    if (addTable) config.addTable = addTable;
    const touchParam = params.get('touchPoints');
    if (touchParam) config.touchPoints = (touchParam === 'off' || touchParam === '0' || touchParam === 'false') ? false : (touchParam === 'bottom' || touchParam === 'smaller' ? 'bottom' : 'on');
    const mulCarry = params.get('mulCarry');
    const mulTable = params.get('mulTable');
    const mulMode = params.get('mulMode');
    if (mulCarry) config.mulCarry = mulCarry;
    if (mulTable) config.mulTable = mulTable;
    if (mulMode) config.mulMode = mulMode;

    renderModeState();
}

const Game = (function () {
    const GRID = 28;
    const GRID_C = '#c8dbe6';
    const GRID_BG = '#f5f0e8';
    const PEN_C = '#1e3a5f';
    const PEN_W = 5;
    const GAP = 40;

    let canvas = null;
    let ctx = null;
    let cfg = null;
    let dpr = 1;
    let audioCtx = null;
    let players = [];
    let activePointers = new Map();
    let listenersBound = false;

    function createPlayer(index) {
        return {
            index,
            name: index === 0 ? 'Öğrenci 1' : 'Öğrenci 2',
            side: index === 0 ? 'Sol taraf' : 'Sağ taraf',
            area: null,
            num1: 0,
            num2: 0,
            ans: 0,
            cntOk: 0,
            cntBad: 0,
            busy: false,
            strokes: [],
            tool: 'pen',
            touchPoints: false,
            qBottom: 0,
            statusTimer: null,
            feedbackTimer: null
        };
    }

    function getActivePlayerCount() {
        return cfg && cfg.players === 2 ? 2 : 1;
    }

    function getQuestionConfig(index) {
        if (getActivePlayerCount() === 2 && cfg.playerConfigs && cfg.playerConfigs[index]) {
            return cfg.playerConfigs[index];
        }
        return cfg;
    }

    function getPlayerPanel(index) {
        return document.querySelector(`.player-panel[data-player="${index}"]`);
    }

    function eachActivePlayer(fn) {
        for (let i = 0; i < getActivePlayerCount(); i++) fn(players[i], i);
    }

    function clearPlayerTimers(player) {
        if (!player) return;
        clearTimeout(player.statusTimer);
        clearTimeout(player.feedbackTimer);
        player.statusTimer = null;
        player.feedbackTimer = null;
    }

    function resetPlayers() {
        players = [createPlayer(0), createPlayer(1)];
        players.forEach((p, idx) => {
            const qc = getQuestionConfig(idx);
            p.touchPoints = (!qc.touchPoints || qc.touchPoints === 'off') ? false : qc.touchPoints;
        });
        activePointers = new Map();
    }

    function aCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playOk() {
        try {
            const c = aCtx();
            const n = c.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                const o = c.createOscillator();
                const g = c.createGain();
                o.type = 'sine';
                o.frequency.value = f;
                g.gain.setValueAtTime(.25, n + i * .12);
                g.gain.exponentialRampToValueAtTime(.001, n + i * .12 + .45);
                o.connect(g);
                g.connect(c.destination);
                o.start(n + i * .12);
                o.stop(n + i * .12 + .45);
            });
        } catch (e) { }
    }

    function playBad() {
        try {
            const c = aCtx();
            const n = c.currentTime;
            [350, 250].forEach((f, i) => {
                const o = c.createOscillator();
                const g = c.createGain();
                o.type = 'sawtooth';
                o.frequency.value = f;
                g.gain.setValueAtTime(.12, n + i * .2);
                g.gain.exponentialRampToValueAtTime(.001, n + i * .2 + .35);
                o.connect(g);
                g.connect(c.destination);
                o.start(n + i * .2);
                o.stop(n + i * .2 + .35);
            });
        } catch (e) { }
    }

    function playFanfare() {
        try {
            const c = aCtx();
            const n = c.currentTime;
            [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
                const o = c.createOscillator();
                const g = c.createGain();
                o.type = 'triangle';
                o.frequency.value = f;
                g.gain.setValueAtTime(.28, n + i * .1);
                g.gain.exponentialRampToValueAtTime(.001, n + i * .1 + .6);
                o.connect(g);
                g.connect(c.destination);
                o.start(n + i * .1);
                o.stop(n + i * .1 + .6);
            });
        } catch (e) { }
    }

    function updatePlayerAreas() {
        const count = getActivePlayerCount();
        const w = window.innerWidth;
        const h = window.innerHeight;
        const half = w / 2;
        const gutter = count === 2 ? 14 : 0;

        players[0].area = count === 1 ? {
            panelLeft: 0,
            panelRight: w,
            innerLeft: 70,
            innerRight: w - 28,
            center: w / 2,
            height: h
        } : {
            panelLeft: 0,
            panelRight: half,
            innerLeft: 26,
            innerRight: half - 22,
            center: (half - gutter) / 2,
            height: h
        };

        players[1].area = {
            panelLeft: half,
            panelRight: w,
            innerLeft: half + 22,
            innerRight: w - 26,
            center: half + (half + gutter) / 2,
            height: h
        };
    }

    function syncHudLayout() {
        const hud = document.getElementById('hudLayer');
        const split = getActivePlayerCount() === 2;
        hud.classList.toggle('split', split);
        hud.classList.toggle('single', !split);

        players.forEach((player, index) => {
            const panel = getPlayerPanel(index);
            if (!panel) return;
            panel.style.display = index < getActivePlayerCount() ? '' : 'none';
            const nameEl = panel.querySelector('[data-role="name"]');
            const sideEl = panel.querySelector('[data-role="side"]');
            if (nameEl) nameEl.textContent = !split && index === 0 ? 'Defter Modu' : player.name;
            if (sideEl) sideEl.textContent = !split && index === 0 ? 'Tüm ekran' : player.side;
        });
    }

    function updateHud() {
        syncHudLayout();
        eachActivePlayer(player => {
            const panel = getPlayerPanel(player.index);
            if (!panel) return;
            const correctEl = panel.querySelector('[data-role="correct"]');
            const wrongEl = panel.querySelector('[data-role="wrong"]');
            const toolBtn = panel.querySelector('[data-action="tool"]');
            const actionButtons = panel.querySelectorAll('button[data-action]');
            if (correctEl) correctEl.textContent = player.cntOk;
            if (wrongEl) wrongEl.textContent = player.cntBad;
            if (toolBtn) {
                toolBtn.textContent = player.tool === 'eraser' ? '✏️' : '🧼';
                toolBtn.title = player.tool === 'eraser' ? 'Kalem moduna geç' : 'Silgi';
                toolBtn.style.background = player.tool === 'eraser' ? '#eab308' : '';
            }
            const tmBtn = panel.querySelector('[data-action="touchmath"]');
            if (tmBtn) {
                const cur = (!player.touchPoints || player.touchPoints === 'off') ? 'off' : player.touchPoints;
                if (cur === 'bottom' || cur === 'smaller') {
                    tmBtn.style.background = '#818cf8';
                    tmBtn.title = 'TouchMath: Küçük Sayı (Bir tıkla kapat)';
                } else if (cur === 'on' || cur === 'all' || cur === true) {
                    tmBtn.style.background = '#38bdf8';
                    tmBtn.title = 'TouchMath: Tüm Rakamlar (Bir tıkla: Küçük Sayı)';
                } else {
                    tmBtn.style.background = '';
                    tmBtn.title = 'Noktalı Sayma (TouchMath)';
                }
            }
            actionButtons.forEach(btn => {
                btn.disabled = player.busy;
            });
        });
    }

    function resize() {
        if (!canvas || !ctx) return;
        dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        updatePlayerAreas();
        scene();
    }

    function drawGrid() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.fillStyle = GRID_BG;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = GRID_C;
        ctx.lineWidth = .5;
        for (let x = 0; x <= w; x += GRID) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y <= h; y += GRID) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        ctx.strokeStyle = '#e8a0a0';
        ctx.lineWidth = 1.5;
        eachActivePlayer(player => {
            const marginX = player.area.panelLeft + 60;
            ctx.beginPath();
            ctx.moveTo(marginX, 0);
            ctx.lineTo(marginX, h);
            ctx.stroke();
        });

        if (getActivePlayerCount() === 2) {
            const splitX = w / 2;
            ctx.fillStyle = 'rgba(109, 40, 217, .05)';
            ctx.fillRect(splitX - 7, 0, 14, h);
            ctx.strokeStyle = 'rgba(109, 40, 217, .22)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(splitX, 0);
            ctx.lineTo(splitX, h);
            ctx.stroke();
        }
    }

    const TOUCH_POINTS = {
        '1': [{ x: 0.52, y: 0.18, d: false }],
        '2': [{ x: 0.40, y: 0.22, d: false }, { x: 0.65, y: 0.86, d: false }],
        '3': [{ x: 0.38, y: 0.22, d: false }, { x: 0.48, y: 0.52, d: false }, { x: 0.38, y: 0.84, d: false }],
        '4': [{ x: 0.66, y: 0.20, d: false }, { x: 0.30, y: 0.22, d: false }, { x: 0.28, y: 0.62, d: false }, { x: 0.66, y: 0.86, d: false }],
        '5': [{ x: 0.68, y: 0.18, d: false }, { x: 0.32, y: 0.18, d: false }, { x: 0.32, y: 0.48, d: false }, { x: 0.70, y: 0.66, d: false }, { x: 0.34, y: 0.86, d: false }],
        '6': [{ x: 0.58, y: 0.20, d: true }, { x: 0.28, y: 0.68, d: true }, { x: 0.72, y: 0.68, d: true }],
        '7': [{ x: 0.28, y: 0.18, d: false }, { x: 0.70, y: 0.18, d: true }, { x: 0.54, y: 0.52, d: true }, { x: 0.44, y: 0.86, d: true }],
        '8': [{ x: 0.34, y: 0.30, d: true }, { x: 0.66, y: 0.30, d: true }, { x: 0.28, y: 0.72, d: true }, { x: 0.72, y: 0.72, d: true }],
        '9': [{ x: 0.50, y: 0.18, d: true }, { x: 0.26, y: 0.35, d: true }, { x: 0.72, y: 0.48, d: true }, { x: 0.62, y: 0.70, d: true }, { x: 0.36, y: 0.86, d: false }]
    };

    function drawDigitTouchPoints(char, x, y, w, h) {
        const points = TOUCH_POINTS[char];
        if (!points) return;
        const radius = Math.max(2.8, Math.min(4.2, Math.round(h * 0.055)));
        ctx.save();
        points.forEach(pt => {
            const px = x + pt.x * w;
            const py = y + pt.y * h;
            if (pt.d) {
                // Double touch point (clean translucent lens with thin red ring + solid center dot)
                const ringRadius = radius + 3.2;
                ctx.beginPath();
                ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
                ctx.fill();
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(px, py, Math.max(2.0, radius - 1.2), 0, Math.PI * 2);
                ctx.fillStyle = '#dc2626';
                ctx.fill();
            } else {
                // Single touch point (solid red dot with crisp white border)
                ctx.beginPath();
                ctx.arc(px, py, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.8;
                ctx.stroke();
            }
        });
        ctx.restore();
    }

    function getOpSymbol(questionConfig) {
        return questionConfig.op === '+' ? '+' : questionConfig.op === '-' ? '-' : 'x';
    }

    function drawQuestion(player) {
        const questionConfig = getQuestionConfig(player.index);
        const panelWidth = player.area.panelRight - player.area.panelLeft;
        const compact = getActivePlayerCount() === 2;
        const mob = panelWidth < 420;
        const fs = compact ? (mob ? 34 : 46) : (window.innerWidth < 500 ? 44 : 60);
        const lh = compact ? (mob ? 42 : 54) : (window.innerWidth < 500 ? 56 : 72);
        const startY = compact ? (mob ? 232 : 214) : (window.innerWidth < 500 ? 188 : 174);
        const op = getOpSymbol(questionConfig);
        const s1 = String(player.num1);
        const s2 = String(player.num2);

        ctx.font = `800 ${fs}px 'Nunito', sans-serif`;
        ctx.textBaseline = 'top';

        // Sabit basamak sütun genişliği: Rakamların birbirini sıkıştırmasını engeller
        const zeroW = Math.round(ctx.measureText('0').width);
        const colW = Math.max(Math.round(fs * 0.78), zeroW + 12);
        const maxLen = Math.max(s1.length, s2.length);
        const digitsWidth = maxLen * colW;
        const opWidth = Math.max(Math.round(ctx.measureText(op + ' ').width), Math.round(colW * 0.85));
        const totalWidth = opWidth + digitsWidth;
        const rightEdge = player.area.center + totalWidth / 2;

        // Üst sayıyı basamaklarına göre ortalayarak ve net bir arka konturla çiz
        ctx.textAlign = 'center';
        for (let i = 0; i < s1.length; i++) {
            const digitChar = s1[i];
            const colIndex = s1.length - 1 - i;
            const colCenterX = rightEdge - (colIndex + 0.5) * colW;

            ctx.save();
            ctx.strokeStyle = '#f5f0e8';
            ctx.lineWidth = 5;
            ctx.lineJoin = 'round';
            ctx.strokeText(digitChar, colCenterX, startY);
            ctx.fillStyle = '#1e3a5f';
            ctx.fillText(digitChar, colCenterX, startY);
            ctx.restore();
        }

        // İşlem işareti
        ctx.textAlign = 'left';
        ctx.fillStyle = '#c0392b';
        ctx.fillText(op, rightEdge - totalWidth, startY + lh);

        // Alt sayıyı basamaklarına göre ortalayarak çiz
        ctx.textAlign = 'center';
        for (let j = 0; j < s2.length; j++) {
            const digitChar = s2[j];
            const colIndex = s2.length - 1 - j;
            const colCenterX = rightEdge - (colIndex + 0.5) * colW;

            ctx.save();
            ctx.strokeStyle = '#f5f0e8';
            ctx.lineWidth = 5;
            ctx.lineJoin = 'round';
            ctx.strokeText(digitChar, colCenterX, startY + lh);
            ctx.fillStyle = '#1e3a5f';
            ctx.fillText(digitChar, colCenterX, startY + lh);
            ctx.restore();
        }

        // Noktalı Sayma / TouchMath noktaları çizimi
        const tpMode = player.touchPoints;
        const isAll = tpMode === true || tpMode === 'on' || tpMode === 'all';
        const isSmallerOnly = tpMode === 'bottom' || tpMode === 'smaller';

        let showTop = isAll;
        let showBottom = isAll;

        if (isSmallerOnly) {
            if (player.num1 < player.num2) {
                showTop = true;
                showBottom = false;
            } else if (player.num2 < player.num1) {
                showTop = false;
                showBottom = true;
            } else {
                showTop = false;
                showBottom = true;
            }
        }

        if (showTop) {
            for (let i = 0; i < s1.length; i++) {
                const digitChar = s1[i];
                const colIndex = s1.length - 1 - i;
                const colLeft = rightEdge - (colIndex + 1) * colW;
                drawDigitTouchPoints(digitChar, colLeft, startY, colW, fs);
            }
        }
        if (showBottom) {
            for (let j = 0; j < s2.length; j++) {
                const digitChar = s2[j];
                const colIndex = s2.length - 1 - j;
                const colLeft = rightEdge - (colIndex + 1) * colW;
                drawDigitTouchPoints(digitChar, colLeft, startY + lh, colW, fs);
            }
        }

        const lineY = startY + lh * 2 + 8;
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rightEdge - totalWidth - 14, lineY);
        ctx.lineTo(rightEdge + 14, lineY);
        ctx.stroke();

        // Eldeli toplamada üstte yeşil kılavuz elde kutuları
        if (questionConfig.op === '+' && hasCarry(player.num1, player.num2)) {
            const boxSize = Math.min(Math.round(fs * 0.44), 22);
            const boxY = startY - boxSize - 6;
            ctx.save();
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            for (let i = 0; i < s1.length; i++) {
                const colIndex = s1.length - 1 - i;
                const colCenterX = rightEdge - (colIndex + 0.5) * colW;
                ctx.strokeRect(colCenterX - boxSize / 2, boxY, boxSize, boxSize);
            }
            ctx.restore();
        }

        // Onluk bozmalı çıkarmada eksilen sayının üstüne kılavuz not kutuları
        if (questionConfig.op === '-' && hasBorrow(player.num1, player.num2)) {
            const boxSize = Math.min(Math.round(fs * 0.44), 22);
            const boxY = startY - boxSize - 6;
            ctx.save();
            ctx.strokeStyle = 'rgba(109, 40, 217, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            for (let i = 0; i < s1.length; i++) {
                const colIndex = s1.length - 1 - i;
                const colCenterX = rightEdge - (colIndex + 0.5) * colW;
                ctx.strokeRect(colCenterX - boxSize / 2, boxY, boxSize, boxSize);
            }
            ctx.restore();
        }

        // Basamak ayırma dikey kılavuz çizgileri
        if (maxLen > 1) {
            ctx.save();
            ctx.strokeStyle = 'rgba(76, 29, 149, 0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            for (let i = 1; i <= maxLen; i++) {
                const colX = rightEdge - i * colW;
                ctx.beginPath();
                ctx.moveTo(colX, lineY);
                ctx.lineTo(colX, lineY + lh + 8);
                ctx.stroke();
            }
            ctx.restore();
        }

        const hintY = lineY + 22;
        ctx.font = `600 ${compact ? (mob ? 11 : 13) : (window.innerWidth < 500 ? 13 : 15)}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        ctx.fillText(compact ? 'Cevabı yaz ve kontrol et' : '✍️ Cevabını yaz, sonra "✓ Kontrol" bas', player.area.center, hintY);
        player.qBottom = hintY + 30;
    }

    function getVisibleStrokes(player) {
        const visible = player.strokes.slice();
        activePointers.forEach(record => {
            if (record.playerIndex === player.index && record.mode === 'pen' && record.stroke && record.stroke.x.length) {
                visible.push(record.stroke);
            }
        });
        return visible;
    }

    function drawStrokeList(list) {
        ctx.strokeStyle = PEN_C;
        ctx.lineWidth = PEN_W;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        list.forEach(stroke => {
            if (!stroke || stroke.x.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(stroke.x[0], stroke.y[0]);
            for (let i = 1; i < stroke.x.length; i++) {
                const mx = (stroke.x[i - 1] + stroke.x[i]) / 2;
                const my = (stroke.y[i - 1] + stroke.y[i]) / 2;
                ctx.quadraticCurveTo(stroke.x[i - 1], stroke.y[i - 1], mx, my);
            }
            ctx.lineTo(stroke.x[stroke.x.length - 1], stroke.y[stroke.y.length - 1]);
            ctx.stroke();
        });
    }

    function drawPlayerScene(player) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(player.area.panelLeft + 1, 0, player.area.panelRight - player.area.panelLeft - 2, window.innerHeight);
        ctx.clip();
        drawQuestion(player);
        drawStrokeList(getVisibleStrokes(player));
        ctx.restore();
    }

    function scene() {
        if (!ctx) return;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        updatePlayerAreas();
        drawGrid();
        eachActivePlayer(player => drawPlayerScene(player));
    }

    function randInt(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }

    function hasCarry(a, b) {
        const s1 = String(a);
        const s2 = String(b);
        const m = Math.max(s1.length, s2.length);
        for (let i = 0; i < m; i++) {
            const d1 = parseInt(s1[s1.length - 1 - i] || '0', 10);
            const d2 = parseInt(s2[s2.length - 1 - i] || '0', 10);
            if (d1 + d2 >= 10) return true;
        }
        return false;
    }

    function hasBorrow(a, b) {
        const s1 = String(a);
        const s2 = String(b);
        const m = Math.max(s1.length, s2.length);
        for (let i = 0; i < m; i++) {
            const d1 = parseInt(s1[s1.length - 1 - i] || '0', 10);
            const d2 = parseInt(s2[s2.length - 1 - i] || '0', 10);
            if (d1 < d2) return true;
        }
        return false;
    }

    function hasZeroBorrow(a, b) {
        if (!hasBorrow(a, b)) return false;
        const s1 = String(a);
        if (s1.length === 2 && s1[1] === '0') return true;
        if (s1.length === 3 && s1[1] === '0') return true;
        return false;
    }

    function hasCarryMul(a, b) {
        const top = Math.max(a, b);
        const bottom = Math.min(a, b);
        const s = String(top);
        if (bottom < 10) {
            let carry = 0;
            for (let i = s.length - 1; i >= 0; i--) {
                const digit = parseInt(s[i], 10);
                const prod = digit * bottom + carry;
                if (prod >= 10) return true;
                carry = Math.floor(prod / 10);
            }
            return false;
        }
        return true;
    }

    function removePlayerPointers(index) {
        Array.from(activePointers.keys()).forEach(key => {
            const record = activePointers.get(key);
            if (record && record.playerIndex === index) activePointers.delete(key);
        });
    }

    function genQ(index, render = true) {
        const player = players[index];
        const questionConfig = getQuestionConfig(index);
        if (!player || !questionConfig) return;

        clearPlayerTimers(player);
        hideStatus(index);
        hideFeedback(index);
        removePlayerPointers(index);
        player.busy = false;
        player.strokes = [];
        player.tool = 'pen';
        if (player.touchPoints === undefined) {
            const qc = questionConfig.touchPoints;
            player.touchPoints = (!qc || qc === 'off') ? false : qc;
        }

        const d = questionConfig.digits;
        const lo = d === 1 ? 1 : d === 2 ? 10 : 100;
        const hi = d === 1 ? 9 : d === 2 ? 99 : 999;

        if (questionConfig.op === '+') {
            const isStepDown = questionConfig.addMode === 'stepdown';
            const targetTable = questionConfig.addTable || 'all';
            for (let tries = 0; tries < 200; tries++) {
                if (d === 1) {
                    if (targetTable === 'ten') {
                        player.num1 = randInt(1, 9);
                        player.num2 = 10 - player.num1;
                    } else if (targetTable === 'doubles') {
                        player.num1 = randInt(1, 9);
                        player.num2 = player.num1;
                    } else {
                        player.num1 = randInt(1, 9);
                        player.num2 = randInt(1, 9);
                    }
                } else if (d === 2) {
                    player.num1 = randInt(10, 99);
                    player.num2 = isStepDown ? randInt(2, 9) : randInt(10, 99);
                } else {
                    player.num1 = randInt(100, 999);
                    player.num2 = isStepDown ? randInt(10, 99) : randInt(100, 999);
                }
                player.ans = player.num1 + player.num2;
                if (questionConfig.carry === 'nocarry' && hasCarry(player.num1, player.num2)) continue;
                if (questionConfig.carry === 'carry' && !hasCarry(player.num1, player.num2)) continue;
                break;
            }
        } else if (questionConfig.op === '-') {
            const isStepDown = questionConfig.subMode === 'stepdown';
            for (let tries = 0; tries < 200; tries++) {
                if (d === 1) {
                    player.num1 = randInt(1, 9);
                    player.num2 = randInt(1, player.num1);
                } else if (d === 2) {
                    if (isStepDown) {
                        player.num1 = randInt(10, 99);
                        player.num2 = randInt(2, Math.min(9, player.num1));
                    } else {
                        player.num1 = randInt(10, 99);
                        player.num2 = randInt(10, player.num1);
                    }
                } else {
                    if (isStepDown) {
                        player.num1 = randInt(100, 999);
                        player.num2 = randInt(10, Math.min(99, player.num1));
                    } else {
                        player.num1 = randInt(100, 999);
                        player.num2 = randInt(100, player.num1);
                    }
                }
                player.ans = player.num1 - player.num2;
                if (questionConfig.borrow === 'noborrow' && hasBorrow(player.num1, player.num2)) continue;
                if (questionConfig.borrow === 'borrow' && !hasBorrow(player.num1, player.num2)) continue;
                if (questionConfig.borrow === 'zero' && !hasZeroBorrow(player.num1, player.num2)) continue;
                break;
            }
        } else {
            const tableVal = questionConfig.mulTable && questionConfig.mulTable !== 'all'
                ? parseInt(questionConfig.mulTable, 10)
                : null;
            const isAdv = questionConfig.mulMode === 'advanced';
            const carryPref = questionConfig.mulCarry || 'mixed';

            for (let tries = 0; tries < 200; tries++) {
                if (d === 1) {
                    if (tableVal != null) {
                        const other = randInt(1, 9);
                        if (Math.random() < 0.5) {
                            player.num1 = tableVal;
                            player.num2 = other;
                        } else {
                            player.num1 = other;
                            player.num2 = tableVal;
                        }
                    } else {
                        player.num1 = randInt(1, 9);
                        player.num2 = randInt(1, 9);
                    }
                    player.ans = player.num1 * player.num2;
                    if (carryPref === 'nocarry' && player.ans >= 10) continue;
                    if (carryPref === 'carry' && player.ans < 10) continue;
                    break;
                } else if (d === 2) {
                    if (isAdv) {
                        player.num1 = randInt(10, 99);
                        player.num2 = randInt(10, 99);
                    } else {
                        player.num1 = randInt(10, 99);
                        player.num2 = randInt(2, 9);
                    }
                    player.ans = player.num1 * player.num2;
                    if (carryPref === 'nocarry' && hasCarryMul(player.num1, player.num2)) continue;
                    if (carryPref === 'carry' && !hasCarryMul(player.num1, player.num2)) continue;
                    break;
                } else {
                    if (isAdv) {
                        player.num1 = randInt(100, 999);
                        player.num2 = randInt(10, 99);
                    } else {
                        player.num1 = randInt(100, 999);
                        player.num2 = randInt(2, 9);
                    }
                    player.ans = player.num1 * player.num2;
                    if (carryPref === 'nocarry' && hasCarryMul(player.num1, player.num2)) continue;
                    if (carryPref === 'carry' && !hasCarryMul(player.num1, player.num2)) continue;
                    break;
                }
            }
        }

        if (render) {
            updateHud();
            scene();
        }
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX;
        let clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function getPointerKey(e) {
        if (e.pointerId != null) return `pointer-${e.pointerId}`;
        if (e.identifier != null) return `touch-${e.identifier}`;
        return 'mouse';
    }

    function resolvePlayerIndex(x) {
        if (getActivePlayerCount() === 1) return 0;
        return x >= window.innerWidth / 2 ? 1 : 0;
    }

    function checkErase(player, point) {
        if (!player.strokes.length) return false;
        const radius = getActivePlayerCount() === 2 ? 26 : 30;
        let hit = false;
        const remaining = player.strokes.filter(stroke => {
            const touching = stroke.x.some((sx, i) => Math.hypot(sx - point.x, stroke.y[i] - point.y) < radius);
            if (touching) hit = true;
            return !touching;
        });
        if (hit) player.strokes = remaining;
        return hit;
    }

    function pDown(e) {
        if (e.button != null && e.button !== 0) return;
        e.preventDefault();
        aCtx();
        const point = getPos(e);
        const playerIndex = resolvePlayerIndex(point.x);
        const player = players[playerIndex];
        if (!player || player.busy) return;

        const key = getPointerKey(e);
        const record = { playerIndex, mode: player.tool, stroke: null };

        if (player.tool === 'eraser') {
            checkErase(player, point);
        } else {
            record.stroke = { x: [point.x], y: [point.y] };
        }

        activePointers.set(key, record);
        if (canvas.setPointerCapture && e.pointerId != null) {
            try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
        }
        hideStatus(playerIndex);
        scene();
    }

    function pMove(e) {
        const key = getPointerKey(e);
        const record = activePointers.get(key);
        if (!record) return;
        e.preventDefault();

        const player = players[record.playerIndex];
        if (!player || player.busy) {
            activePointers.delete(key);
            scene();
            return;
        }

        const point = getPos(e);
        if (record.mode === 'eraser') {
            checkErase(player, point);
        } else if (record.stroke) {
            record.stroke.x.push(point.x);
            record.stroke.y.push(point.y);
        }
        scene();
    }

    function pUp(e) {
        const key = getPointerKey(e);
        const record = activePointers.get(key);
        if (!record) return;
        e.preventDefault();

        const player = players[record.playerIndex];
        if (player && record.mode === 'pen' && record.stroke && record.stroke.x.length > 1) {
            player.strokes.push(record.stroke);
        }
        activePointers.delete(key);
        if (canvas.releasePointerCapture && e.pointerId != null) {
            try { canvas.releasePointerCapture(e.pointerId); } catch (err) { }
        }
        scene();
    }

    function getBottomStrokes(player) {
        if (!player.strokes.length) return [];

        const validStrokes = player.strokes.filter(stroke => {
            const minX = Math.min(...stroke.x);
            const maxX = Math.max(...stroke.x);
            const minY = Math.min(...stroke.y);
            const maxY = Math.max(...stroke.y);
            const w = maxX - minX;
            const h = maxY - minY;
            if (w > 50 && w > h * 2.5) return false;
            return true;
        });

        if (!validStrokes.length) return [];

        const rows = validStrokes
            .map(stroke => ({
                stroke,
                y: stroke.y.reduce((sum, value) => sum + value, 0) / stroke.y.length,
                min: Math.min(...stroke.y),
                max: Math.max(...stroke.y)
            }))
            .sort((a, b) => a.y - b.y);

        const groups = [];
        let current = [rows[0]];
        for (let i = 1; i < rows.length; i++) {
            const prev = rows[i - 1];
            const cur = rows[i];
            if (cur.min > prev.max + 30 || cur.y - prev.y > 90) {
                groups.push(current);
                current = [cur];
            } else {
                current.push(cur);
            }
        }
        groups.push(current);
        return groups[groups.length - 1].map(item => item.stroke);
    }

    function clusterStrokes(list) {
        if (!list || !list.length) return [];
        const indexed = list.map((stroke, i) => ({
            stroke,
            cx: stroke.x.reduce((sum, value) => sum + value, 0) / stroke.x.length,
            i
        }));
        indexed.sort((a, b) => a.cx - b.cx);
        const clusters = [];
        let current = [indexed[0]];
        for (let i = 1; i < indexed.length; i++) {
            if (indexed[i].cx - indexed[i - 1].cx > GAP) {
                clusters.push(current);
                current = [indexed[i]];
            } else {
                current.push(indexed[i]);
            }
        }
        clusters.push(current);
        return clusters;
    }

    function recCluster(cluster) {
        return new Promise(resolve => {
            const traces = cluster.map(item => [item.stroke.x.map(Math.round), item.stroke.y.map(Math.round)]);
            let minX = 1e9;
            let maxX = -1e9;
            let minY = 1e9;
            let maxY = -1e9;

            cluster.forEach(item => {
                item.stroke.x.forEach(x => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); });
                item.stroke.y.forEach(y => { minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
            });

            try {
                handwriting.recognize(traces, {
                    width: Math.max(maxX - minX + 40, 80),
                    height: Math.max(maxY - minY + 40, 80),
                    language: 'en',
                    numOfReturn: 5
                }, function (result, error) {
                    if (error || !result || !result.length) {
                        resolve(null);
                        return;
                    }
                    for (const item of result) {
                        const digits = item.replace(/[^0-9]/g, '');
                        if (digits.length > 0) {
                            resolve(digits);
                            return;
                        }
                    }
                    resolve(null);
                });
            } catch (e) {
                resolve(null);
            }
        });
    }

    function showStatus(index, text, kind, autoHideMs) {
        const panel = getPlayerPanel(index);
        const player = players[index];
        if (!panel || !player) return;
        const indicator = panel.querySelector('[data-role="status"]');
        if (!indicator) return;

        clearTimeout(player.statusTimer);
        indicator.textContent = text;
        indicator.className = `status-indicator show ${kind || 'info'}`;
        if (autoHideMs) {
            player.statusTimer = setTimeout(() => hideStatus(index), autoHideMs);
        }
    }

    function hideStatus(index) {
        const panel = getPlayerPanel(index);
        const player = players[index];
        if (player) {
            clearTimeout(player.statusTimer);
            player.statusTimer = null;
        }
        if (!panel) return;
        const indicator = panel.querySelector('[data-role="status"]');
        if (indicator) indicator.className = 'status-indicator';
    }

    function showFeedback(index, icon, color) {
        const panel = getPlayerPanel(index);
        if (!panel) return;
        const badge = panel.querySelector('[data-role="feedback"]');
        const iconEl = panel.querySelector('[data-role="feedback-icon"]');
        if (!badge || !iconEl) return;
        badge.style.backgroundColor = `${color}20`;
        iconEl.textContent = icon;
        iconEl.style.animation = 'none';
        void iconEl.offsetHeight;
        iconEl.style.animation = 'feedbackPop .6s cubic-bezier(.34,1.56,.64,1)';
        badge.classList.add('show');
    }

    function hideFeedback(index) {
        const panel = getPlayerPanel(index);
        const player = players[index];
        if (player) {
            clearTimeout(player.feedbackTimer);
            player.feedbackTimer = null;
        }
        if (!panel) return;
        const badge = panel.querySelector('[data-role="feedback"]');
        if (badge) badge.classList.remove('show');
    }

    function particles(player, count = 20) {
        const colors = ['#22c55e', '#facc15', '#3b82f6', '#ec4899', '#f97316', '#a855f7'];
        const cx = player.area.center;
        const cy = window.innerHeight / 3;
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = cx + 'px';
            particle.style.top = cy + 'px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            const size = 6 + Math.random() * 12;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 180;
            particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
            particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1100);
        }
    }

    async function doCheck(index) {
        const player = players[index];
        if (!player || player.busy) return;
        if (!player.strokes.length) {
            showStatus(index, '✏️ Önce cevabını yaz!', 'error', 1500);
            return;
        }

        player.busy = true;
        updateHud();
        showStatus(index, '✍️ Tanınıyor...', 'info');

        const relevantStrokes = getBottomStrokes(player);
        const clusters = clusterStrokes(relevantStrokes);
        const results = await Promise.all(clusters.map(cluster => recCluster(cluster)));

        let value = '';
        let recognized = true;
        for (const item of results) {
            if (item === null) {
                recognized = false;
                break;
            }
            value += item;
        }

        if (!recognized || value === '') {
            player.busy = false;
            updateHud();
            showStatus(index, '🤔 Tanınamadı, tekrar yaz', 'error', 2000);
            return;
        }

        const answer = parseInt(value, 10);
        showStatus(index, 'Yazdığın: ' + answer, 'info');
        clearTimeout(player.statusTimer);
        player.statusTimer = setTimeout(() => {
            hideStatus(index);
            if (answer === player.ans) {
                onOk(player);
            } else {
                onBad(player, answer);
            }
        }, 800);
    }

    function onOk(player) {
        player.busy = true;
        player.cntOk++;
        updateHud();
        const isMilestone = player.cntOk % 10 === 0 && player.cntOk > 0;
        if (isMilestone) {
            showFeedback(player.index, '🏆', '#f59e0b');
            showStatus(player.index, '🎉 ' + player.cntOk + '. DOĞRU! TEBRİKLER!', 'info', 2400);
            playFanfare();
            particles(player, 40);
        } else {
            showFeedback(player.index, '✅', '#22c55e');
            showStatus(player.index, 'Harika, doğru cevap!', 'info', 1200);
            playOk();
            particles(player, 20);
        }
        player.feedbackTimer = setTimeout(() => {
            hideFeedback(player.index);
            genQ(player.index);
        }, isMilestone ? 2400 : 1800);
    }

    function onBad(player, value) {
        player.busy = true;
        player.cntBad++;
        updateHud();
        showFeedback(player.index, '❌', '#ef4444');
        playBad();
        showStatus(player.index, value + ' değil, tekrar dene!', 'error');
        player.feedbackTimer = setTimeout(() => {
            hideFeedback(player.index);
            hideStatus(player.index);
            player.busy = false;
            player.strokes = [];
            updateHud();
            scene();
        }, 1700);
    }

    function undoPlayer(index) {
        const player = players[index];
        if (!player || player.busy) return;
        if (player.strokes.length > 0) {
            player.strokes.pop();
            hideStatus(index);
            scene();
        }
    }

    function clearPlayer(index) {
        const player = players[index];
        if (!player || player.busy) return;
        player.strokes = [];
        hideStatus(index);
        scene();
    }

    function toggleTouchMath(index) {
        const player = players[index];
        if (!player || player.busy) return;
        const cur = (!player.touchPoints || player.touchPoints === 'off') ? 'off' : player.touchPoints;
        if (cur === 'off') {
            player.touchPoints = 'on';
        } else if (cur === 'on' || cur === 'all' || cur === true) {
            player.touchPoints = 'bottom';
        } else {
            player.touchPoints = false;
        }
        updateHud();
        scene();
    }

    function toggleTool(index) {
        const player = players[index];
        if (!player || player.busy) return;
        player.tool = player.tool === 'pen' ? 'eraser' : 'pen';
        updateHud();
    }

    function backToEntry() {
        activePointers.clear();
        players.forEach(player => clearPlayerTimers(player));
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('entryScreen').classList.remove('hidden');
    }

    function handleControlClick(e) {
        e.stopPropagation();
        const button = e.currentTarget;
        const panel = button.closest('.player-panel');
        if (!panel) return;
        const index = parseInt(panel.dataset.player, 10);
        if (Number.isNaN(index) || index >= getActivePlayerCount()) return;

        if (button.dataset.action === 'check') doCheck(index);
        if (button.dataset.action === 'clear') clearPlayer(index);
        if (button.dataset.action === 'undo') undoPlayer(index);
        if (button.dataset.action === 'next') genQ(index);
        if (button.dataset.action === 'tool') toggleTool(index);
        if (button.dataset.action === 'touchmath') toggleTouchMath(index);
    }

    function bindEvents() {
        if (listenersBound) return;
        listenersBound = true;

        window.addEventListener('resize', resize);
        window.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                undoPlayer(0);
                if (getActivePlayerCount() === 2) undoPlayer(1);
            }
        });

        if (window.PointerEvent) {
            canvas.addEventListener('pointerdown', pDown);
            canvas.addEventListener('pointermove', pMove);
            canvas.addEventListener('pointerup', pUp);
            canvas.addEventListener('pointerleave', pUp);
            canvas.addEventListener('pointercancel', pUp);
        } else {
            canvas.addEventListener('mousedown', pDown);
            canvas.addEventListener('mousemove', pMove);
            canvas.addEventListener('mouseup', pUp);
            canvas.addEventListener('mouseleave', pUp);
            canvas.addEventListener('touchstart', pDown, { passive: false });
            canvas.addEventListener('touchmove', pMove, { passive: false });
            canvas.addEventListener('touchend', pUp, { passive: false });
            canvas.addEventListener('touchcancel', pUp, { passive: false });
        }

        document.querySelectorAll('.player-panel [data-action]').forEach(button => {
            button.addEventListener('click', handleControlClick);
        });

        document.getElementById('gameBackBtn').addEventListener('click', function (e) {
            e.stopPropagation();
            backToEntry();
        });

        document.getElementById('gameScreen').addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });

        canvas.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });
    }

    function renderGameToText() {
        return JSON.stringify({
            mode: getActivePlayerCount() === 2 ? 'two-player' : 'single-player',
            coordinateSystem: 'origin top-left, x right, y down',
            config: {
                players: cfg ? cfg.players : null,
                shared: cfg ? {
                    op: cfg.op,
                    digits: cfg.digits,
                    carry: cfg.carry,
                    borrow: cfg.borrow,
                    subMode: cfg.subMode,
                    addMode: cfg.addMode,
                    addTable: cfg.addTable,
                    touchPoints: cfg.touchPoints,
                    mulCarry: cfg.mulCarry,
                    mulTable: cfg.mulTable,
                    mulMode: cfg.mulMode
                } : null,
                playerConfigs: cfg && cfg.playerConfigs ? cfg.playerConfigs : []
            },
            players: players.slice(0, getActivePlayerCount()).map(player => {
                const questionConfig = getQuestionConfig(player.index);
                return {
                    name: player.name,
                    side: getActivePlayerCount() === 2 ? player.side : 'Tum ekran',
                    question: `${player.num1} ${getOpSymbol(questionConfig)} ${player.num2}`,
                    answer: player.ans,
                    score: { correct: player.cntOk, wrong: player.cntBad },
                    tool: player.tool,
                    busy: player.busy,
                    touchPoints: Boolean(player.touchPoints),
                    strokeCount: getVisibleStrokes(player).length,
                    questionConfig: questionConfig,
                    area: player.area ? {
                        left: Math.round(player.area.panelLeft),
                        right: Math.round(player.area.panelRight),
                        center: Math.round(player.area.center)
                    } : null
                };
            })
        });
    }

    window.render_game_to_text = renderGameToText;
    window.advanceTime = function () {
        scene();
        return renderGameToText();
    };

    return {
        init: function (nextConfig) {
            cfg = {
                ...makeQuestionConfig(nextConfig),
                players: nextConfig.players || 1,
                playerConfigs: (nextConfig.playerConfigs || [makeQuestionConfig(), makeQuestionConfig()]).map(playerConfig => makeQuestionConfig(playerConfig))
            };
            canvas = document.getElementById('mainCanvas');
            ctx = canvas.getContext('2d');
            bindEvents();
            resetPlayers();
            updatePlayerAreas();
            for (let i = 0; i < getActivePlayerCount(); i++) {
                genQ(i, false);
            }
            updateHud();
            resize();
            scene();
        }
    };
})();

renderModeState();
applyQueryConfigFromUrl();
if (new URLSearchParams(window.location.search).get('autostart') === '1') {
    startGame();
}
