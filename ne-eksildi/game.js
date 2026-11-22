(() => {
  const levels = {
    starter: { name: "Başlangıç", count: 3, seconds: 9, distractors: [0, 1] },
    steady: { name: "Orta", count: 4, seconds: 7, distractors: [1, 1] },
    expert: { name: "Uzman", count: 6, seconds: 5, distractors: [1, 2] }
  };

  const themes = [
    {
      name: "Okul ve oyun",
      items: [
        ["canta", "Çanta", "Eşyalarını içine koyup yanında taşırsın."],
        ["defter", "Defter", "Kağıt sayfalarına kalemle yazı yazabilirsin."],
        ["top", "Top", "Onu atabilir, yuvarlayabilir ya da sektirebilirsin."],
        ["tablet", "Tablet", "Klavyesi yoktur, ekranına dokunarak kullanırsın."],
        ["bilgisayar", "Bilgisayar", "Klavyesiyle yazı yazabilir ve ekrandan okuyabilirsin."],
        ["saat", "Saat", "Sana zamanı gösterir."],
        ["sandalye", "Sandalye", "Üzerine oturabilirsin."],
        ["lamba", "Lamba", "Onu açınca etraf aydınlanır."]
      ]
    },
    {
      name: "Mutfak",
      items: [
        ["elma", "Elma", "Dalında yetişen, ortasında küçük çekirdekleri olan yuvarlak bir meyvedir."],
        ["armut", "Armut", "Altı geniş, üstü dar bir meyvedir."],
        ["muz", "Muz", "Sarı kabuklu ve eğri biçimli bir meyvedir."],
        ["karpuz", "Karpuz", "Dışı yeşil, içi çoğunlukla kırmızı ve çok sulu bir meyvedir."],
        ["uzum", "Üzüm", "Küçük taneleri salkım halinde büyür."],
        ["portakal", "Portakal", "Turuncu renkli, dilimlere ayrılan bir meyvedir."],
        ["bal", "Bal", "Arıların yaptığı tatlı bir yiyecektir."],
        ["kasik", "Kaşık", "Çorbayı onunla içebilirsin."],
        ["catal", "Çatal", "Uçları sivridir, yiyeceğe batırabilirsin."],
        ["tabak", "Tabak", "Yemeği üzerine koyarsın."]
      ]
    },
    {
      name: "Doğa",
      items: [
        ["balina", "Balina", "Denizde yaşar, nefes almak için su yüzüne çıkar."],
        ["zurafa", "Zürafa", "Uzun boynuyla yüksek dallara ulaşır."],
        ["penguen", "Penguen", "Uçamayan, çok iyi yüzen bir kuştur."],
        ["kaplumbaga", "Kaplumbağa", "Sırtında sert bir kabuk taşır."],
        ["kus", "Kuş", "Kanatlarıyla gökyüzünde uçabilir."],
        ["bulut", "Bulut", "Gökyüzünde beyaz veya gri kümeler halinde görünür."],
        ["yagmur", "Yağmur", "Gökyüzünden damlalar halinde düşer."],
        ["gokkusagi", "Gökkuşağı", "Gökyüzünde renkli bir yay olarak görünür."]
      ]
    }
  ];

  const imageRoot = "../assets/images/gor-ve-sec/";
  const roundsPerSession = 6;
  const elements = Object.fromEntries([...document.querySelectorAll("[id]")].map(el => [el.id, el]));
  const sound = window.BureauSound;
  const voice = new Audio();
  const instructionClips = {
    menu: "menu",
    study: "incele",
    cover: "kayboldu",
    guess: "sec",
    review: "dondu",
    results: "sonuc"
  };
  const statLabels = {
    first: "İlk denemede",
    retry: "İkinci denemede",
    hint: "İpucuyla",
    shown: "Cevap gösterildi"
  };
  const strategies = [
    "Bir ipucu: nesnelerin adlarını içinden saymayı dene.",
    "Bir ipucu: önce soldakilere, sonra sağdakilere bak.",
    "Bir ipucu: nesneleri benzer özelliklerine göre grupla."
  ];
  let session;
  let practiceRound;
  let roundIndex = 0;
  let phase = "menu";
  let remaining = 0;
  let lastFrame;
  let muted = false;
  let exitArmed = false;

  function shuffle(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
    }
    return shuffled;
  }

  function prepareRounds(level) {
    const used = new Set();
    return [...shuffle(themes), ...shuffle(themes)].map(theme => {
      const pool = shuffle(theme.items);
      const missing = pool.find(item => !used.has(item));
      used.add(missing);
      const remainingItems = pool.filter(item => item !== missing);
      const present = remainingItems.slice(0, level.count - 1);
      const absent = remainingItems.slice(level.count - 1);
      const [visibleCount, unseenCount] = level.distractors;
      return {
        theme: theme.name,
        missing,
        initial: shuffle([...present, missing]),
        choices: shuffle([missing, ...present.slice(0, visibleCount), ...absent.slice(0, unseenCount)]),
        wrong: new Set(),
        hinted: false,
        result: null
      };
    });
  }

  function currentRound() {
    return practiceRound ?? session?.rounds[roundIndex];
  }

  function preload(round) {
    if (!round) return;
    new Set([...round.initial, ...round.choices]).forEach(([id]) => {
      const image = new Image();
      image.src = imageRoot + id + ".jpg";
    });
  }

  function show(view) {
    for (const id of ["menu", "game", "results"]) elements[id].hidden = id !== view;
    elements["back-site"].hidden = view !== "menu";
    elements["back-game"].hidden = view === "menu";
  }

  function start() {
    const level = levels[document.querySelector("input[name=level]:checked").value];
    stopVoice();
    sound.unlock();
    practiceRound = undefined;
    session = {
      level,
      untimed: elements.untimed.checked,
      rounds: prepareRounds(level)
    };
    roundIndex = 0;
    show("game");
    startRound();
  }

  function startPractice() {
    const items = themes.flatMap(theme => theme.items);
    const [apple, pear, banana] = ["elma", "armut", "muz"].map(id => items.find(item => item[0] === id));
    sound.unlock();
    session = undefined;
    practiceRound = {
      theme: "Mutfak",
      missing: banana,
      initial: [apple, banana],
      choices: [pear, banana],
      wrong: new Set(),
      hinted: false,
      result: null
    };
    show("game");
    elements["round-track"].hidden = true;
    elements["round-label"].textContent = "Deneme turu";
    elements["theme-label"].textContent = practiceRound.theme;
    preload(practiceRound);
    prepareStudy(practiceRound);
    playVoice("bak");
  }

  function startRound() {
    const round = currentRound();
    preload(round);
    preload(session.rounds[roundIndex + 1]);
    elements["round-label"].textContent = `Tur ${roundIndex + 1} / ${roundsPerSession} · ${session.level.name}`;
    elements["theme-label"].textContent = round.theme;
    elements["round-track"].hidden = false;
    for (let index = 0; index < roundsPerSession; index++) {
      elements["round-track"].children[index].className = index < roundIndex ? "done" : index === roundIndex ? "current" : "";
    }
    prepareStudy(round);
  }

  function prepareStudy(round) {
    stopVoice();
    enterPhase("study", Infinity, true);
    elements.continue.disabled = true;
    elements.timer.hidden = true;
    const images = [...elements.tray.querySelectorAll("img")];
    Promise.allSettled(images.map(image => image.decode())).then(() => {
      if (phase !== "study" || round !== currentRound()) return;
      elements.continue.disabled = false;
      if (session && !session.untimed) {
        remaining = session.level.seconds * 1000;
        lastFrame = undefined;
        elements.timer.hidden = false;
        updateTimer();
      }
      if (!practiceRound && !elements["pause-dialog"].open && !document.hidden) sound.play("study");
    });
  }

  function locationSlot() {
    const slot = document.createElement("div");
    slot.className = "location-slot";
    slot.textContent = "Boş yuva";
    return slot;
  }

  function objectCard(item, answer = false) {
    const [id, name] = item;
    const card = document.createElement(answer ? "button" : "div");
    card.className = "object";
    card.dataset.object = id;
    const image = document.createElement("img");
    image.src = imageRoot + id + ".jpg";
    image.alt = "";
    image.draggable = false;
    const label = document.createElement("span");
    label.textContent = name;
    card.append(image, label);
    if (answer) {
      card.type = "button";
      const mark = document.createElement("span");
      mark.className = "mark";
      card.append(mark);
      card.addEventListener("click", () => choose(item));
    }
    return card;
  }

  function drawShutter() {
    const canvas = elements["shutter-pattern"];
    const context = canvas.getContext("2d");
    if (!context) return;
    const { clientWidth, clientHeight } = canvas;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(clientWidth * scale);
    canvas.height = Math.round(clientHeight * scale);
    context.scale(scale, scale);
    context.fillStyle = "#68896c";
    for (let row = 9; row < clientHeight; row += 15) {
      for (let column = 9; column < clientWidth; column += 15) {
        context.fillRect(column, row, 1, 1);
      }
    }
  }

  const phaseText = {
    study: ["Nesnelere dikkatle bak", "Birazdan bir tanesi kaybolacak."],
    cover: ["Nesneler gizlendi", "Az önce gördüklerini hatırla."],
    guess: ["Hangi nesne eksildi?", ""],
    review: ["Nesne geri döndü", "Eksilen nesneyi ilk yerinde tekrar gör."]
  };
  const practiceInstructions = {
    study: "Elma ve muza bak. Hazır olunca Hazırım’a dokun.",
    cover: "Bir nesne kayboldu.",
    guess: "",
    review: ""
  };

  function enterPhase(next, duration = 0, moveFocus = false) {
    const round = currentRound();
    phase = next;
    remaining = duration;
    lastFrame = undefined;
    elements.board.dataset.phase = next;
    const [title, instruction] = phaseText[next];
    elements["phase-title"].textContent = title;
    elements.instruction.textContent = practiceRound ? practiceInstructions[next] : instruction;
    elements.instruction.hidden = !elements.instruction.textContent;
    elements.feedback.textContent = "";
    elements.feedback.classList.remove("visually-hidden");
    elements["hint-box"].hidden = next !== "guess" || !round.hinted;
    elements.hint.hidden = next !== "guess" || round.hinted || Boolean(practiceRound);
    elements["show-answer"].hidden = true;
    elements.timer.hidden = next !== "study" || !session || session.untimed;
    elements.shutter.hidden = next !== "cover";
    elements.tray.style.visibility = next === "cover" ? "hidden" : "";
    elements.tray.setAttribute("aria-hidden", String(next === "cover"));
    elements.tray.style.setProperty("--columns", round.initial.length);
    elements.tray.style.setProperty("--mobile-columns", Math.min(3, round.initial.length));
    elements.tray.replaceChildren(...round.initial.map(item => {
      if (next === "guess" && item === round.missing) return locationSlot();
      const card = objectCard(item);
      if (next === "review" && item === round.missing) {
        card.classList.add("restored");
        card.lastElementChild.textContent = `✓ ${item[1]}`;
      }
      return card;
    }));
    if (next === "cover") drawShutter();

    elements["answer-panel"].hidden = next !== "guess";
    elements.options.replaceChildren();
    if (next === "guess") {
      elements.options.style.setProperty("--options", round.choices.length);
      elements.options.replaceChildren(...round.choices.map(item => objectCard(item, true)));
    }
    elements.continue.hidden = next === "guess" || next === "cover";
    if (next === "study") {
      elements.continue.textContent = "Hazırım";
      if (!practiceRound) elements.feedback.textContent = strategies[roundIndex % strategies.length];
    } else if (next === "review") {
      if (practiceRound) elements.continue.textContent = "Oyuna başla";
      else elements.continue.textContent = roundIndex + 1 === roundsPerSession ? "Sonucu gör" : "Sonraki tur";
    }
    updateTimer();
    if (moveFocus) elements["phase-title"].focus({ preventScroll: true });
  }

  function cover(moveFocus) {
    stopVoice();
    enterPhase("cover", practiceRound && !muted ? 2200 : 1050, moveFocus);
    sound.play("cover");
    if (practiceRound) playVoice("kayboldu");
  }

  function reveal(moveFocus) {
    enterPhase("guess", 0, moveFocus);
    sound.play("reveal");
    if (practiceRound) playVoice("sec");
  }

  function updateTimer() {
    if (elements.timer.hidden || !Number.isFinite(remaining)) return;
    elements["timer-text"].textContent = Math.ceil(remaining / 1000) + " sn";
    elements["timer-fill"].style.transform = `scaleX(${remaining / (session.level.seconds * 1000)})`;
  }

  function tick(elapsed) {
    if (!(remaining > 0 && Number.isFinite(remaining)) || document.hidden || elements["pause-dialog"].open) return;
    if (phase === "study" && !voice.paused && !voice.ended && voice.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return;
    remaining = Math.max(0, remaining - elapsed);
    updateTimer();
    if (remaining) return;
    const focusOnBoard = document.activeElement === document.body || elements.board.contains(document.activeElement);
    if (phase === "study") cover(focusOnBoard);
    else if (phase === "cover") reveal(focusOnBoard);
  }

  let manualClock = false;
  function animate(now) {
    if (!manualClock && lastFrame !== undefined) tick(Math.max(0, now - lastFrame));
    lastFrame = now;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  function choose(item) {
    if (phase !== "guess" || elements["pause-dialog"].open) return;
    const round = currentRound();
    if (round.wrong.has(item)) return;
    if (item === round.missing) {
      review(round.hinted ? "hint" : round.wrong.size ? "retry" : "first");
      return;
    }
    round.wrong.add(item);
    if (round.wrong.size >= 2) {
      review("shown");
      return;
    }
    sound.play("retry");
    const choice = [...elements.options.children].find(card => card.dataset.object === item[0]);
    choice.classList.add("wrong");
    choice.querySelector(".mark").textContent = "Tekrar düşün";
    choice.setAttribute("aria-disabled", "true");
    elements.feedback.classList.remove("visually-hidden");
    elements.feedback.textContent = practiceRound
      ? "Bir daha düşün. Armut başta tepside yoktu."
      : "Bir kez daha düşün. Başka bir nesne seçebilirsin.";
    if (practiceRound) playVoice("tekrar");
    elements["show-answer"].hidden = false;
  }

  function hint() {
    if (phase !== "guess" || currentRound().hinted) return;
    const round = currentRound();
    round.hinted = true;
    elements["hint-box"].textContent = round.missing[2];
    elements["hint-box"].hidden = false;
    elements.feedback.textContent = `İpucu: ${round.missing[2]}`;
    elements.feedback.classList.add("visually-hidden");
    elements.options.querySelector("button:not([aria-disabled])")?.focus({ preventScroll: true });
    elements.hint.hidden = true;
    sound.play("hint");
  }

  function review(result) {
    stopVoice();
    const round = currentRound();
    round.result = result;
    enterPhase("review", 0, true);
    elements.feedback.textContent = result === "shown"
      ? `Eksilen nesne: ${round.missing[1]}. Şimdi yerini tekrar görebilirsin.`
      : `Buldun! Eksilen nesne: ${round.missing[1]}.`;
    sound.play(result === "shown" ? "hint" : "correct");
    if (practiceRound) playVoice("bitti");
  }

  function finish() {
    stopVoice();
    phase = "results";
    const counts = { first: 0, retry: 0, hint: 0, shown: 0 };
    session.rounds.forEach(round => counts[round.result]++);
    const mode = session.untimed ? "Süresiz" : "Süreli";
    elements["result-level"].textContent = `${session.level.name} · ${mode}`;
    elements.stats.replaceChildren(...Object.entries(statLabels).map(([key, label]) => {
      const group = document.createElement("div");
      const term = document.createElement("dt");
      const count = document.createElement("dd");
      term.textContent = label;
      count.textContent = counts[key];
      group.append(term, count);
      return group;
    }));
    elements["result-tip"].textContent = counts.first >= 5 && session.level !== levels.expert
      ? "Bir sonraki oyunda daha yüksek bir seviye deneyebilirsin."
      : "Bir sonraki oyunda nesnelerin adlarını içinden saymayı dene.";
    show("results");
    elements["result-title"].focus();
    sound.play("finish");
  }

  function showMenu() {
    stopVoice();
    phase = "menu";
    remaining = 0;
    session = undefined;
    practiceRound = undefined;
    show("menu");
    window.scrollTo(0, 0);
    elements["menu-title"].focus({ preventScroll: true });
  }

  function openPause() {
    if (elements.game.hidden || elements["pause-dialog"].open) return;
    exitArmed = false;
    stopVoice();
    elements["pause-title"].textContent = "Oyun duraklatıldı";
    elements.end.textContent = "Oyunu bırak";
    elements["pause-dialog"].showModal();
  }

  function stopVoice() {
    voice.pause();
  }

  function playVoice(clip, requested = false) {
    if (document.hidden || (!requested && (muted || elements["pause-dialog"].open))) return;
    stopVoice();
    voice.src = `ses/${clip}.wav`;
    voice.play().catch(() => {});
  }

  function listenToPhase() {
    let clip = instructionClips[phase];
    if (elements["pause-dialog"].open) clip = exitArmed ? "birak" : "duraklat";
    else if (practiceRound && phase === "study") clip = "bak";
    else if (practiceRound && phase === "review") clip = "bitti";
    playVoice(clip, true);
  }

  function setMuted(value) {
    muted = value;
    elements.mute.setAttribute("aria-pressed", String(!muted));
    sound.setEnabled(!muted);
    if (muted) stopVoice();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Embedded or mobile browsers may decline fullscreen.
    }
  }

  for (let index = 0; index < roundsPerSession; index++) {
    elements["round-track"].append(document.createElement("span"));
  }
  elements.start.addEventListener("click", start);
  elements["back-game"].addEventListener("click", showMenu);
  elements.practice.addEventListener("click", startPractice);
  elements.listen.addEventListener("click", listenToPhase);
  elements["pause-listen"].addEventListener("click", listenToPhase);
  elements.replay.addEventListener("click", start);
  elements.levels.addEventListener("click", showMenu);
  elements.hint.addEventListener("click", hint);
  elements["show-answer"].addEventListener("click", () => {
    if (phase === "guess" && currentRound().wrong.size > 0) review("shown");
  });
  elements.pause.addEventListener("click", openPause);
  elements.resume.addEventListener("click", () => elements["pause-dialog"].close());
  elements.end.addEventListener("click", () => {
    if (!exitArmed) {
      stopVoice();
      exitArmed = true;
      elements["pause-title"].textContent = "Oyunu bırakmak istiyor musun?";
      elements.end.textContent = "Evet, bırak";
      return;
    }
    elements["pause-dialog"].close();
    showMenu();
  });
  elements["pause-dialog"].addEventListener("close", () => {
    stopVoice();
    lastFrame = undefined;
  });
  elements.continue.addEventListener("click", () => {
    if (phase === "study") cover(true);
    else if (phase === "review") {
      if (practiceRound) start();
      else if (roundIndex + 1 === roundsPerSession) finish();
      else {
        roundIndex++;
        startRound();
      }
    }
  });
  elements.mute.addEventListener("click", () => {
    setMuted(!muted);
    if (!muted) sound.play("hint");
  });
  elements.game.addEventListener("contextmenu", event => event.preventDefault());
  if (!document.fullscreenEnabled) elements.fullscreen.hidden = true;
  elements.fullscreen.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => {
    elements.fullscreen.setAttribute("aria-pressed", String(Boolean(document.fullscreenElement)));
  });
  document.addEventListener("keydown", event => {
    if (event.key.toLowerCase() === "f" && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey && document.fullscreenEnabled) {
      event.preventDefault();
      toggleFullscreen();
    }
  });
  document.addEventListener("visibilitychange", () => {
    lastFrame = undefined;
    if (document.hidden) stopVoice();
  });
  window.addEventListener("resize", () => { if (phase === "cover") drawShutter(); });

  window.advanceTime = milliseconds => {
    manualClock = true;
    if (Number.isFinite(milliseconds) && milliseconds > 0) tick(milliseconds);
  };
  window.render_game_to_text = () => JSON.stringify({
    phase,
    round: session ? roundIndex + 1 : null,
    practice: Boolean(practiceRound),
    level: session?.level.name,
    untimed: session?.untimed,
    locationHint: true,
    remainingMs: Number.isFinite(remaining) ? Math.round(remaining) : null,
    paused: elements["pause-dialog"].open,
    muted,
    smartboard: true,
    tray: phase === "cover" || elements.game.hidden ? [] : [...elements.tray.children].map(card => card.dataset.object ?? null),
    options: elements["answer-panel"].hidden ? [] : [...elements.options.children].map(card => ({
      object: card.dataset.object,
      tried: card.getAttribute("aria-disabled") === "true"
    })),
    hint: elements["hint-box"].hidden ? null : elements["hint-box"].textContent,
    results: session?.rounds.map(round => round.result).filter(Boolean)
  });
})();
