import objectsURL from "../art/objects.png";
import castURL from "../art/cast.png";
import notesURL from "../art/money.png";
import streetURL from "../art/street.webp";
import kitchenURL from "../art/kitchen.webp";
import shopURL from "../art/shop.webp";
import checkoutURL from "../art/checkout.webp";
import atlas from "../art/objects.json";
import { MONEY } from "./catalog.ts";

export { default as titleURL } from "../art/title.png";
export { default as portraitURL } from "../art/portrait.png";
export { default as berryURL } from "../art/portrait-berry.png";
export const objects = atlas;
export const poses = ["idle","blink","talk","talk2","leftstep","stride","rightstep","reach","carry","happy","pet","front","frontstep","back","backstep","pat"];
export const cast = ["child","mother","cashier","child2"];
const pending = new WeakMap<HTMLImageElement,string>();
function picture(url: string, later=false) {
  const img = new Image();
  if (later) pending.set(img,url); else img.src = url;
  return img;
}
export function prepare(img: HTMLImageElement) {
  const url=pending.get(img);
  if (url) { pending.delete(img); img.src=url; }
}
export const art = {
  street: picture(streetURL), kitchen: picture(kitchenURL,true), shop: picture(shopURL,true), checkout: picture(checkoutURL,true),
  objects: picture(objectsURL), cast: picture(castURL), notes: picture(notesURL)
};
document.documentElement.style.setProperty("--objects", 'url("' + objectsURL + '")');
document.documentElement.style.setProperty("--notes", 'url("' + notesURL + '")');

function position(i: number, cols: number, rows: number) {
  return `background-size:${cols * 100}% ${rows * 100}%;background-position:${(i % cols) * 100 / (cols - 1)}% ${Math.floor(i / cols) * 100 / (rows - 1)}%`;
}
export function icon(id: string, cls = "") {
  const i = objects.ids.indexOf(id);
  return `<span aria-hidden="true" class="sprite ${cls}" style="${position(i, objects.cols, objects.rows)}"></span>`;
}
export function noteArt(kind: string) {
  return `<span aria-hidden="true" class="note-sprite" style="${position(MONEY.findIndex(m => m.id === kind), 4, 2)}"></span>`;
}
