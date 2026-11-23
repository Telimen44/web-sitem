import { MONEY_BY_ID, shuffle, sum } from "./catalog.ts";

export type Piece = { uid: string; kind: string; value: number };
export const amount = (notes: Piece[]) => sum(notes.map(n => n.value));
export function displayStacks(pieces: Piece[]): {piece: Piece; count: number}[] {
  if (pieces.length <= 14) return pieces.map(piece => ({piece, count:1}));
  const stacks = new Map<string,{piece:Piece; count:number}>();
  for (const piece of pieces) {
    const stack = stacks.get(piece.kind);
    if (stack) stack.count++; else stacks.set(piece.kind,{piece,count:1});
  }
  return Array.from(stacks.values());
}
export function issue(kinds: string[], prefix: string): Piece[] {
  return kinds.map((kind, i) => ({ uid: prefix + i, kind, value: MONEY_BY_ID[kind].value }));
}

// Minimum number of allowed pieces for every reachable sum. Unlike greedy change,
// this also handles restricted drawers, e.g. 60 TL with only 20 and 50 TL.
export class Currency {
  kinds: string[];
  cost: number[];
  constructor(allowed: string[], limit: number, random = Math.random) {
    this.kinds = shuffle(allowed, random).sort((a, b) => MONEY_BY_ID[b].value - MONEY_BY_ID[a].value);
    this.cost = Array(limit + 1).fill(Infinity);
    this.cost[0] = 0;
    for (let n = 1; n <= limit; n++) {
      for (const kind of this.kinds) {
        const v = MONEY_BY_ID[kind].value;
        if (v <= n) this.cost[n] = Math.min(this.cost[n], 1 + this.cost[n - v]);
      }
    }
  }
  possible(n: number) { return Number.isFinite(this.cost[n]); }
  make(n: number): string[] | null {
    if (!this.possible(n)) return null;
    const result: string[] = [];
    while (n > 0) {
      const kind = this.kinds.find(k => this.cost[n - MONEY_BY_ID[k].value] === this.cost[n] - 1)!;
      result.push(kind);
      n -= MONEY_BY_ID[kind].value;
    }
    return result;
  }
  tender(total: number): number | null {
    for (const k of [...this.kinds].reverse()) {
      const value = MONEY_BY_ID[k].value;
      if (value > total && this.possible(value - total)) return value;
    }
    for (let t = total + 1; t < this.cost.length; t++)
      if (this.possible(t) && this.possible(t - total)) return t;
    return null;
  }
  alternative(exact: string[], random = Math.random): string[] {
    // Split a real piece into smaller allowed denominations, if possible.
    for (const kind of shuffle(exact, random)) {
      const value = MONEY_BY_ID[kind].value;
      const smaller = this.kinds.filter(k => MONEY_BY_ID[k].value < value);
      if (smaller.length) {
        const parts = new Currency(smaller, value, random).make(value);
        if (parts) return parts;
      }
    }
    return [this.kinds[this.kinds.length - 1]];
  }
}

export function subset(notes: Piece[], target: number): string[] | null {
  if (target < 0) return null;
  const paths = new Map<number, string[]>([[0, []]]);
  for (const note of notes) {
    for (const [n, ids] of Array.from(paths)) {
      const next = n + note.value;
      if (next <= target && !paths.has(next)) paths.set(next, [...ids, note.uid]);
    }
    if (paths.has(target)) break;
  }
  return paths.get(target) ?? null;
}
