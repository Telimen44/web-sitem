export const PRODUCTS = [
  ["bread", "Ekmek", 5], ["milk", "Süt", 30], ["flour", "Un", 15],
  ["eggs", "Yumurta", 20], ["yogurt", "Yoğurt", 20], ["cheese", "Peynir", 30],
  ["pasta", "Makarna", 10], ["rice", "Pirinç", 15], ["sugar", "Şeker", 10],
  ["salt", "Tuz", 5], ["apple", "Elma", 10], ["banana", "Muz", 15],
  ["tomato", "Domates", 10], ["cucumber", "Salatalık", 5], ["butter", "Tereyağı", 20],
  ["olives", "Zeytin", 25], ["tea", "Çay", 25], ["biscuit", "Bisküvi", 10]
].map(([id, name, price]) => ({ id: String(id), name: String(name), price: Number(price) }));
export const PRODUCT = Object.fromEntries(PRODUCTS.map(p => [p.id, p])) as Record<string, (typeof PRODUCTS)[number]>;
const units: Record<string,string> = {
  milk:"kutu", flour:"paket", eggs:"kutu", yogurt:"kâse", cheese:"paket", pasta:"paket",
  rice:"paket", sugar:"paket", salt:"kutu", butter:"paket", olives:"kavanoz", tea:"paket", biscuit:"paket"
};
export function spokenProduct(id: string, count: number) {
  return [count===1?"bir":count===2?"iki":String(count), units[id], PRODUCT[id].name.toLocaleLowerCase("tr")].filter(Boolean).join(" ");
}
export const MONEY = [
  { id: "b5", value: 5 }, { id: "b10", value: 10 }, { id: "b20", value: 20 },
  { id: "b50", value: 50 }, { id: "b100", value: 100 }, { id: "b200", value: 200 },
  { id: "c1", value: 1 }, { id: "c5", value: 5 }
];
export const MONEY_BY_ID = Object.fromEntries(MONEY.map(m => [m.id, m]));
export const LEVELS = ["İlk Alışverişim", "Alışveriş Ustası", "Para Üstü Ustası"];
export const RANGES = [[1, 2], [2, 4], [3, 5]];
export const lira = (amount: number) => `${amount} TL`;
export const sum = (numbers: number[]) => numbers.reduce((total, number) => total + number, 0);
export function shuffle<T>(items: readonly T[], rand = Math.random): T[] {
  const copy = Array.from(items);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
