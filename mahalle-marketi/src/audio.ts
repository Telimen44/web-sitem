import type { Settings } from "./settings.ts";

const tracks: Record<string, { beat: number; root: number; notes: number[] }> = {
  menu: { beat: 290, root: 60, notes: [4,7,9,7,4,-1,2,4,0,4,7,-1,5,4,2,-1] },
  home: { beat: 370, root: 57, notes: [7,-1,4,2,0,-1,4,-1,5,4,2,-1,0,-1,-1,-1] },
  street: { beat: 255, root: 60, notes: [0,4,7,-1,9,7,4,2,5,-1,9,7,4,2,0,-1] },
  shop: { beat: 300, root: 62, notes: [4,-1,7,4,2,-1,5,2,0,4,7,-1,5,2,0,-1] },
  till: { beat: 410, root: 57, notes: [0,-1,4,-1,2,-1,5,-1,4,-1,2,-1,0,-1,-1,-1] },
  win: { beat: 270, root: 62, notes: [0,4,7,9,12,-1,9,7,5,7,4,-1,2,0,-1,-1] }
};
const fx: Record<string, number[]> = {
  click:[68], bubble:[72,76], wallet:[58,65], give:[76,83,88], pick:[72], basket:[67,74],
  scan:[88,88], note:[64,71], yes:[72,76,79], hint:[65,69], door:[53,60], step:[42],
  bag:[58,67], stars:[72,76,79,84], close:[62]
};
type WebKitAudio = typeof window & { webkitAudioContext?: typeof AudioContext };
export class Sound {
  settings: Settings;
  ctx?: AudioContext;
  master?: GainNode;
  track = "menu";
  timer?: number;
  beat = 0;
  paused = false;
  unlocked = false;
  talking = false;
  utterance?: SpeechSynthesisUtterance;
  speechTimer?: number;
  speechGeneration = 0;
  constructor(s: Settings) {
    this.settings = s;
    // Voice discovery is asynchronous on some tablets. Start it before the first dialogue.
    try { window.speechSynthesis?.getVoices(); } catch {}
  }
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      const Type = window.AudioContext || (window as WebKitAudio).webkitAudioContext;
      if (!Type) return;
      this.ctx = new Type();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.refresh();
    } catch { return; }
  }
  refresh() {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    if (!this.ctx || !this.master) return;
    this.master.gain.value = this.settings.muted ? 0 : this.settings.volume / 100;
    if (this.paused || document.hidden || this.settings.muted) {
      void this.ctx.suspend().catch(() => {}); return;
    }
    void this.ctx.resume().catch(() => {});
    if (!this.settings.music) return;
    const song = tracks[this.track];
    this.timer = window.setInterval(() => {
      const i = this.beat++ % song.notes.length, note = song.notes[i];
      const gain = this.talking ? 0.018 : 0.045;
      if (note >= 0) this.tone(song.root + note, 0, song.beat / 1250, gain, "triangle");
      if (i % 4 === 0) this.tone(song.root - 12 + (i >= 8 ? 5 : 0), 0, 0.34, gain * 0.5, "sine");
    }, song.beat);
  }
  scene(name: string) {
    if (this.track === name) return;
    this.track = name; this.beat = 0; this.refresh();
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    if (paused) this.stopVoice();
    this.refresh();
  }
  tone(midi: number, delay: number, length: number, volume: number, type: OscillatorType) {
    if (!this.ctx || !this.master || this.ctx.state !== "running") return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator(), env = this.ctx.createGain();
    osc.type = type; osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(env); env.connect(this.master); osc.start(t); osc.stop(t + length + 0.02);
    osc.onended = () => { osc.disconnect(); env.disconnect(); };
  }
  effect(name: string) {
    if (!this.settings.effects || this.settings.muted || this.paused) return;
    (fx[name] || fx.click).forEach((n, i) =>
      this.tone(n, i * 0.085, name === "step" ? 0.045 : 0.12, name === "step" ? 0.035 : 0.11, name === "scan" ? "sine" : "triangle"));
  }
  stopVoice() {
    this.speechGeneration++;
    clearTimeout(this.speechTimer);
    if (this.utterance) {
      try { window.speechSynthesis?.cancel(); } catch {}
      this.utterance = undefined;
    }
    this.talking = false;
  }
  speak(text: string) {
    this.stopVoice();
    if (this.paused || document.hidden || !text) return;
    const gen = this.speechGeneration;
    this.talking = true;
    const stop = () => { if (gen === this.speechGeneration) { this.talking = false; this.utterance = undefined; } };
    const fallback = Math.min(6500, Math.max(1200, text.length * 57));
    this.speechTimer = window.setTimeout(stop, fallback);
    if (!this.settings.voice || this.settings.muted || !this.settings.volume || !("speechSynthesis" in window)) return;
    try {
      const tr = speechSynthesis.getVoices().filter(v => /^tr(?:[-_]|$)/i.test(v.lang));
      const voice = tr.find(v => v.localService) || tr[0];
      if (!voice) return;
      const u = new SpeechSynthesisUtterance(text.replace(/\bTL\b/g, "lira"));
      this.utterance = u;
      u.voice = voice; u.lang = "tr-TR"; u.rate = 0.92; u.volume = this.settings.volume / 100;
      u.onstart = () => {
        if (gen !== this.speechGeneration) return;
        this.talking = true;
        clearTimeout(this.speechTimer); this.speechTimer = window.setTimeout(stop, Math.max(15000, text.length * 200));
      };
      u.onend = u.onerror = stop;
      speechSynthesis.speak(u);
    } catch { return; }
  }
}
