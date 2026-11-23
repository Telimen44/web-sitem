import { MONEY_BY_ID, RANGES, shuffle, sum } from "./catalog.ts";
import { Currency, issue, type Piece } from "./money.ts";
import { problem, type Settings } from "./settings.ts";

export type Line = { id: string; qty: number; price: number };
export type Quest = {
  lines: Line[]; units: number; total: number; wallet: Piece[];
  shelf: string[]; signature: string; currency: Currency;
};
const key = (lines: Line[]) => lines.map(l => l.id + "*" + l.qty).sort().join(",");
export function generate(s: Settings, previous = "", completed = 0, random = Math.random): Quest {
  const invalid = problem(s);
  if (invalid) throw Error(invalid);
  const pool = shuffle(s.products, random);
  const [low, high] = RANGES[s.level];
  const allCounts = Array.from({ length: Math.min(high, pool.length) - low + 1 }, (_, i) => i + low);
  let counts = s.count ? [s.count] : shuffle(allCounts, random);
  if (!s.count && s.sequence === "gradual") {
    const first = Math.min(low + completed, allCounts[allCounts.length - 1]);
    counts = [first, ...allCounts.filter(n => n !== first)];
  }
  const maxBill = Math.max(...s.money.map(id => MONEY_BY_ID[id].value));
  const currency = new Currency(s.money, s.maximum + 2 * maxBill, random);
  const totals = new Map<number, boolean>();
  let repeat: Line[] | undefined;
  const path: Line[] = [];
  // Exhaustive bounded search, including exact quantity and denomination restrictions.
  function search(start: number, left: number, total: number): Line[] | undefined {
    if (total > s.maximum) return;
    if (left === 0) {
      if (total < s.minimum) return;
      if (!totals.has(total))
        totals.set(total, s.payment === "change" ? currency.tender(total) !== null : currency.possible(total));
      if (!totals.get(total)) return;
      if (key(path) !== previous) return [...path];
      repeat ??= [...path];
      return;
    }
    for (let i = start; i <= pool.length - left; i++) {
      const id = pool[i], price = s.prices[id];
      const quantities = s.quantities ? shuffle([1, 2], random) : [1];
      for (const qty of quantities) {
        path.push({ id, price, qty });
        const result = search(i + 1, left - 1, total + qty * price);
        path.pop();
        if (result) return result;
      }
    }
  }
  let lines: Line[] | undefined;
  for (const count of counts) {
    lines = search(0, count, 0);
    if (lines) break;
  }
  lines ??= repeat;
  if (!lines) throw Error("Bu ürün, tutar ve kupürlerle çözülebilen görev yok. Tutar aralığını genişletin veya başka kupürler seçin.");
  const total = sum(lines.map(l => l.price * l.qty));
  const tender = s.payment === "change" ? currency.tender(total)! : total;
  const exact = currency.make(tender)!;
  const kinds = s.payment === "mix" ? shuffle([...exact, ...currency.alternative(exact, random)], random) : exact;
  const wanted = lines.map(l => l.id);
  const other = pool.filter(id => !wanted.includes(id)).slice(0, s.simple ? 1 : [2, 3, 4][s.level]);
  return { lines, units: sum(lines.map(l => l.qty)), total, wallet: issue(kinds, "w"),
    shelf: shuffle([...wanted, ...other], random), signature: key(lines), currency };
}
