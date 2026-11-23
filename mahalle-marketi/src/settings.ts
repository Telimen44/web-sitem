import { MONEY, PRODUCTS, RANGES } from "./catalog.ts";

export type Payment = "exact" | "mix" | "change";
export type Settings = {
  level: number; avatar: "green" | "berry"; count: number; products: string[]; prices: Record<string, number>;
  minimum: number; maximum: number; quantities: boolean; payment: Payment;
  money: string[]; changeStyle: "make" | "check"; sequence: "random" | "gradual";
  largeText: boolean; largeArt: boolean; reduced: boolean; pinList: boolean; tapOnly: boolean;
  simple: boolean; music: boolean; effects: boolean; voice: boolean; muted: boolean; volume: number;
  tries: number; autoHint: boolean; manualHint: boolean; hintLevel: number; addition: boolean; changeAid: boolean;
};
export function levelDefaults(level: number) {
  return {
    level, count: 0, minimum: [5, 10, 15][level], maximum: [50, 120, 200][level],
    payment: (["exact", "mix", "change"] as const)[level], pinList: level === 0,
    addition: level < 2, changeAid: level < 2, quantities: level === 2, tries: level + 1
  };
}
export function defaults(): Settings {
  return {
    ...levelDefaults(0), avatar:"green", products: PRODUCTS.map(p => p.id),
    prices: Object.fromEntries(PRODUCTS.map(p => [p.id, p.price])),
    money: MONEY.filter(m => m.id.startsWith("b")).map(m => m.id),
    changeStyle: "make", sequence: "random", largeText: false, largeArt: false, reduced: false,
    tapOnly: false, simple: false, music: true, effects: true, voice: true, muted: false,
    volume: 45, autoHint: true, manualHint: true, hintLevel: 3
  };
}
const STORE = "telimen.mahalle.settings.v1";
export function loadSettings(): Settings {
  const base = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (!saved || typeof saved !== "object") return base;
    const settings = { ...base };
    for (const key of Object.keys(base) as (keyof Settings)[]) {
      if (typeof base[key] === "boolean" && typeof saved[key] === "boolean")
        Object.assign(settings, { [key]: saved[key] });
    }
    for (const key of ["level", "count", "minimum", "maximum", "tries", "hintLevel", "volume"] as const)
      if (Number.isInteger(saved[key])) settings[key] = saved[key];
    settings.products = PRODUCTS.filter(p => saved.products?.includes(p.id)).map(p => p.id);
    settings.money = MONEY.filter(m => saved.money?.includes(m.id)).map(m => m.id);
    settings.prices = Object.fromEntries(PRODUCTS.map(p => [p.id, saved.prices?.[p.id] ?? p.price]));
    if (["exact", "mix", "change"].includes(saved.payment)) settings.payment = saved.payment;
    if (saved.changeStyle === "check") settings.changeStyle = "check";
    if (saved.sequence === "gradual") settings.sequence = "gradual";
    if (saved.avatar === "berry") settings.avatar = "berry";
    return problem(settings) ? base : settings;
  } catch { return base; }
}
export function saveSettings(settings: Settings) {
  try { localStorage.setItem(STORE, JSON.stringify(settings)); return true; } catch { return false; }
}
export function problem(s: Settings): string {
  if (!Number.isInteger(s.level) || !RANGES[s.level]) return "Üç seviyeden birini seçin.";
  const [low, high] = RANGES[s.level];
  if (s.count !== 0 && (!Number.isInteger(s.count) || s.count < low || s.count > high))
    return `Bu seviye için ${low} ile ${high} arasında ürün çeşidi seçin.`;
  if (s.products.length < (s.count || low)) return "Görevde istenecek çeşit sayısı için daha fazla ürün seçin.";
  if (!s.money.length) return "En az bir banknot veya madeni para seçin.";
  if (![s.minimum, s.maximum].every(n => Number.isInteger(n) && n >= 1 && n <= 1000) || s.minimum > s.maximum)
    return "Tutar aralığını 1–1000 TL içinde, küçükten büyüğe girin.";
  if (s.products.some(id => !Number.isInteger(s.prices[id]) || s.prices[id] < 1 || s.prices[id] > 200))
    return "Seçili ürün fiyatlarını 1–200 TL arasında tam lira olarak girin.";
  if (s.tries < 1 || s.tries > 5 || s.hintLevel < 1 || s.hintLevel > 3 || s.volume < 0 || s.volume > 100)
    return "İpucu ve ses değerlerini geçerli aralıkta seçin.";
  return "";
}
export type Report = {
  level: number; units: number; correct: number; total: number; paid: number; change: number;
  hints: number; independentMoney: boolean; stars: number; payment: Payment;
};
export type History = { completed: number; levels: number[]; recent: Report[]; lastList: string };
const SESSION = "telimen.mahalle.session.v1";
export function readHistory(): History {
  try {
    const x = JSON.parse(sessionStorage.getItem(SESSION) || "null") as History | null;
    if (x && Number.isSafeInteger(x.completed) && x.completed >= 0 && Array.isArray(x.levels) && Array.isArray(x.recent) &&
        x.recent.every(r => r && RANGES[r.level] && ["units","correct","total","paid","change","hints","stars"].every(k => Number.isFinite(r[k as keyof Report]))))
      return x;
  } catch { return emptyHistory(); }
  return emptyHistory();
}
function emptyHistory(): History { return { completed: 0, levels: [], recent: [], lastList: "" }; }
export function record(history: History, report: Report, signature: string) {
  history.completed++;
  if (!history.levels.includes(report.level)) history.levels.push(report.level);
  history.recent = [report, ...history.recent].slice(0, 30);
  history.lastList = signature;
  try { sessionStorage.setItem(SESSION, JSON.stringify(history)); } catch { return; }
}
