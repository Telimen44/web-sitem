import { PRODUCT, lira, shuffle, sum } from "./catalog.ts";
import { amount, issue, subset, type Piece } from "./money.ts";
import type { Quest } from "./quest.ts";
import type { Settings, Report } from "./settings.ts";

export type Phase = "home" | "gift" | "exit" | "out" | "shop" | "approach" | "scan" | "pay" |
  "review" | "change" | "bag" | "return" | "deliver" | "praise" | "win";
export const countOf = (items: string[], id: string) => items.filter(x => x === id).length;
export class Game {
  q: Quest;
  s: Settings;
  phase: Phase = "home";
  basket: string[] = [];
  scanned: string[] = [];
  bagged: string[] = [];
  paidIds = new Set<string>();
  changeIds = new Set<string>();
  drawer: Piece[] = [];
  offer: Piece[] = [];
  hints = 0;
  moneyHints = 0;
  attempts = 0;
  hintStep = 0;
  lastSum = "";
  random: () => number;
  constructor(q: Quest, s: Settings, random = Math.random) {
    this.q = q; this.s = s; this.random = random;
  }
  get scannedTotal() { return sum(this.scanned.map(id => this.s.prices[id])); }
  get paid() { return amount(this.q.wallet.filter(n => this.paidIds.has(n.uid))); }
  get changeDue() { return Math.max(0, this.paid - this.q.total); }
  get pickedChange() { return amount(this.drawer.filter(n => this.changeIds.has(n.uid))); }
  get balance() { return amount(this.q.wallet) - this.paid + this.pickedChange; }
  get ready() { return this.basket.length === this.q.units; }
  move(phase: Phase) { this.phase = phase; this.resetHint(); }
  resetHint() { this.attempts = 0; this.hintStep = 0; }
  next(): boolean {
    const go = (p: Phase) => { this.move(p); return true; };
    switch (this.phase) {
      case "home": return go("gift");
      case "gift": return go("exit");
      case "exit": return go("out");
      case "out": return go("shop");
      case "shop": return this.ready && go("approach");
      case "approach": return go("scan");
      case "scan": return this.scanned.length === this.q.units && go("pay");
      case "bag": return this.bagged.length === this.q.units && go("return");
      case "return": return go("deliver");
      case "deliver": return go("praise");
      case "praise": return go("win");
      default: return false;
    }
  }
  collect(id: string): string {
    if (this.phase !== "shop" || !this.q.shelf.includes(id)) return "Raftan bir ürün seç.";
    const line = this.q.lines.find(l => l.id === id);
    if (!line) return "Bu ürün listemizde yok. Listemize tekrar bakalım.";
    if (countOf(this.basket, id) >= line.qty) return `Sepetinde yeterince ${PRODUCT[id].name.toLocaleLowerCase("tr")} var.`;
    this.basket.push(id); this.resetHint(); return "";
  }
  takeBack(id: string) {
    const i = this.basket.indexOf(id);
    if (this.phase === "shop" && i >= 0) { this.basket.splice(i, 1); return true; }
    return false;
  }
  transfer(id: string): boolean {
    const scanning = this.phase === "scan";
    if (!scanning && this.phase !== "bag") return false;
    const target = scanning ? this.scanned : this.bagged;
    const source = scanning ? this.basket : this.scanned;
    if (countOf(target, id) >= countOf(source, id)) return false;
    const old = this.scannedTotal;
    target.push(id);
    if (scanning) this.lastSum = `${old} TL + ${this.s.prices[id]} TL = ${this.scannedTotal} TL`;
    this.resetHint(); return true;
  }
  toggle(uid: string): boolean {
    const paying = this.phase === "pay";
    if (!paying && this.phase !== "change") return false;
    const pieces = paying ? this.q.wallet : this.drawer;
    if (!pieces.some(n => n.uid === uid)) return false;
    const selected = paying ? this.paidIds : this.changeIds;
    if (selected.has(uid)) selected.delete(uid); else selected.add(uid);
    return true;
  }
  confirmPay(): string {
    if (this.phase !== "pay" || this.scanned.length !== this.q.units) return "Önce tüm ürünleri okut.";
    if (this.paid < this.q.total) return "Biraz daha para gerekiyor. Cüzdanına tekrar bak.";
    if (this.s.payment !== "change") {
      if (this.paid !== this.q.total) return "Toplamı geçtin. Verdiğin paralardan birini geri alabilirsin.";
      this.move("bag"); return "";
    }
    if (this.paid === this.q.total) return "Bu görevde para üstü alacağız. Annenin verdiği parayı kullan.";
    const exact = this.q.currency.make(this.changeDue);
    if (!exact) return "Kasada bu ödeme için uygun para üstü yok. Verdiğin paraları değiştirebilirsin.";
    const extras = this.q.currency.kinds.filter(k => k !== exact[0]).slice(-3);
    this.drawer = issue([...exact, ...this.q.currency.alternative(exact, this.random), ...extras], "d");
    const correct = this.drawer.slice(0, exact.length);
    this.offer = this.random() < 0.5 ? correct : [...correct, this.drawer[exact.length]];
    this.drawer = shuffle(this.drawer, this.random);
    this.move(this.s.changeStyle === "check" ? "review" : "change");
    return "";
  }
  review(accept: boolean): string {
    if (this.phase !== "review") return "Önce ödemeyi tamamla.";
    const isRight = amount(this.offer) === this.changeDue;
    if (accept !== isRight) return "Birlikte kontrol edelim. Önerilen para ile alışveriş tutarını topla.";
    if (isRight) { this.changeIds = new Set(this.offer.map(p => p.uid)); this.move("bag"); }
    else this.move("change");
    return "";
  }
  confirmChange(): string {
    if (this.phase !== "change") return "Önce ödemeyi tamamla.";
    if (this.pickedChange !== this.changeDue)
      return `${lira(this.q.total)} tutarını ${lira(this.paid)} yapmak için ne kadar gerekir?`;
    this.move("bag"); return "";
  }
  hint() {
    this.hints++; this.hintStep = Math.min(this.s.hintLevel, this.hintStep + 1);
    if (["pay", "review", "change"].includes(this.phase)) this.moneyHints++;
  }
  nextMoney(): string | undefined {
    const pay = this.phase === "pay";
    const pieces = pay ? this.q.wallet : this.drawer, selected = pay ? this.paidIds : this.changeIds;
    const target = pay ? (this.s.payment === "change" ? amount(pieces) : this.q.total) : this.changeDue;
    const remainder = target - (pay ? this.paid : this.pickedChange);
    const next = subset(pieces.filter(p => !selected.has(p.uid)), remainder);
    return next ? next[0] : Array.from(selected).at(-1);
  }
  report(): Report {
    return { level: this.s.level, units: this.q.units, correct: this.basket.length, total: this.q.total,
      paid: this.paid, change: this.pickedChange, hints: this.hints, independentMoney: !this.moneyHints,
      stars: 1 + Number(this.hints <= 1) + Number(!this.moneyHints), payment: this.s.payment };
  }
}
