import { icon, noteArt } from "./art.ts";
import { MONEY_BY_ID, PRODUCT, lira } from "./catalog.ts";
import type { Piece } from "./money.ts";
export function btn(action: string, label: string, sprite = "", cls = "", extra = "") {
  return `<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${sprite ? icon(sprite) : ""}<span>${label}</span></button>`;
}
export function iconButton(action: string, label: string, sprite: string) {
  return `<button type="button" class="icon-button" data-action="${action}" title="${label}" aria-label="${label}">${icon(sprite)}</button>`;
}
export function coinLabel(kind: string) {
  return `${lira(MONEY_BY_ID[kind].value)} ${kind[0] === "c" ? "madeni para" : "banknot"}`;
}
export function noteButton(n: Piece, selected: boolean, hint = "", count=1) {
  const stack=count>1?` ×${count}`:"";
  return `<button type="button" data-action="money" data-id="${n.uid}" data-kind="${n.kind}" class="money-piece ${hint}" aria-pressed="${selected}" aria-label="${coinLabel(n.kind)}${stack}${selected ? ', geri al' : ', seç'}">${noteArt(n.kind)}<span>${lira(n.value)}${n.kind[0] === "c" ? " · Madeni" : ""}${stack}</span></button>`;
}
export function mini(id: string, count = "", checked = false) {
  return `<span class="mini ${checked ? "done" : ""}">${icon(id)}<span>${PRODUCT[id].name}${count}</span>${checked ? icon("check","tiny") : ""}</span>`;
}
export function itemButton(id: string, price: number, qty: number | undefined, selected: boolean, hint: string) {
  return `<button type="button" class="item ${hint}" data-action="item" data-id="${id}" aria-pressed="${selected}" aria-label="${PRODUCT[id].name}, ${lira(price)}${qty === undefined ? "" : `, ${qty} adet`}">${icon(id,"item-art")}<strong>${PRODUCT[id].name}</strong><span>${lira(price)}${qty === undefined ? "" : ` · ${qty} adet`}</span></button>`;
}
