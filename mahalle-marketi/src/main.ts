import "./style.css";
import { icon, noteArt } from "./art.ts";
import { LEVELS, PRODUCT, lira } from "./catalog.ts";
import { Sound } from "./audio.ts";
import { Game, countOf } from "./game.ts";
import { amount } from "./money.ts";
import { generate } from "./quest.ts";
import { levelDefaults, loadSettings, readHistory, record, saveSettings, type Settings } from "./settings.ts";
import { album, avatarPanel, heading, help, readField, reportText, soundPanel, teacher, type Panel } from "./dialogs.ts";
import { bar, desk, dialogue, listHTML, menu, stage, stageNames, type ViewState } from "./screens.ts";
import { btn } from "./ui.ts";
import { World } from "./world.ts";
import { fitEmbed } from "./embed.ts";
import { motherDialogue } from "./mother-dialogue.ts";

const el = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const root=el("#game"), toolbar=el("#bar"), overlay=el("#scene-ui"), controls=el("#desk"), links=el("#menu-links");
const dialog=el<HTMLDialogElement>("#dialog"), canvas=el<HTMLCanvasElement>("#world"), status=el("#notice");
let settings=loadSettings();
const history=readHistory(), sound=new Sound(settings);
const reducedQuery=matchMedia("(prefers-reduced-motion: reduce)");
let game: Game | undefined, panel: Panel | undefined, tab=0, draft: Settings | undefined;
let returnFocus: HTMLElement | null=null;
const v: ViewState={selected:"",message:"",listOpen:false,hintKey:""};
const world=new World(canvas,sound,()=>advance());
let lastList=history.lastList;
const active=()=>game?.s || settings;
const musicFor=()=>!game?"menu":({home:"home",gift:"home",exit:"home",out:"street",shop:"shop",approach:"shop",scan:"till",
  pay:"till",change:"till",review:"till",bag:"shop",return:"street",deliver:"home",praise:"win",win:"win"}[game.phase]);
function announce(text: string) { status.textContent=text; }
function speakDialogue(g: Game, text=dialogue(g)) {
  sound.speak(text,motherDialogue(g.phase,g.q.lines)?.clips);
}
function applyAppearance() {
  const s=active(); world.reduced=s.reduced||reducedQuery.matches;
  root.classList.toggle("reduced",world.reduced); root.classList.toggle("big-text",s.largeText);
  root.classList.toggle("big-art",s.largeArt); root.classList.toggle("simple",s.simple);
  root.classList.toggle("tap-only",s.tapOnly);
}
function render() {
  const focused=document.activeElement as HTMLElement|null;
  const a=focused?.dataset.action, id=focused?.dataset.id;
  const oldParent=focused && [controls,toolbar,overlay,links].find(n=>n.contains(focused));
  applyAppearance();
  root.dataset.phase=game?.phase||"menu";
  toolbar.innerHTML=bar(settings,game);
  if (game) {
    overlay.innerHTML=stage(game,v); controls.innerHTML=desk(game,v); links.hidden=true; links.innerHTML="";
    canvas.setAttribute("aria-label",stageNames[game.phase]);
  } else {
    const screen=menu(settings);
    overlay.innerHTML=screen.scene; controls.innerHTML=screen.desk; links.innerHTML=screen.links; links.hidden=false;
    canvas.setAttribute("aria-label","Solda çiçekli ev, sağda kırmızı tenteli mahalle marketi.");
  }
  if (oldParent && a && !panel) {
    const next=Array.from(oldParent.querySelectorAll<HTMLButtonElement>("button")).find(b=>b.dataset.action===a && b.dataset.id===id && !b.disabled);
    if (next) next.focus({preventScroll:true});
  }
  world.resize();
}
function focusTask() {
  const title=controls.querySelector<HTMLElement>("h2");
  if (title) { title.tabIndex=-1; title.focus({preventScroll:true}); }
  if (root.getBoundingClientRect().top < -70) root.scrollIntoView({block:"start",behavior:"instant"});
}
function enter(feedback="") {
  if (!game) return;
  sound.stopVoice(); v.selected=""; v.hintKey=""; v.message=feedback;
  world.reset(game); sound.scene(musicFor());
  if (game.phase==="gift") { sound.effect("give"); sound.effect("wallet"); }
  else if (["out","return","exit"].includes(game.phase)) sound.effect("door");
  else if (["praise","win"].includes(game.phase)) sound.effect("stars");
  else sound.effect("bubble");
  if (game.phase==="win") record(history,game.report(),game.q.signature);
  render(); focusTask();
  if (!world.reduced && canvas.animate) canvas.animate([{opacity:.72},{opacity:1}],{duration:220,easing:"steps(5,end)"});
  const words=dialogue(game);
  announce([stageNames[game.phase],feedback,words].filter(Boolean).join(". "));
  if (words) speakDialogue(game,words);
}
function start() {
  try {
    const snapshot=structuredClone(settings);
    const q=generate(snapshot,lastList,history.completed);
    game=new Game(q,snapshot); lastList=q.signature; v.listOpen=snapshot.pinList;
    enter();
  } catch (err) {
    openPanel("teacher"); dialog.querySelector(".form-error")!.textContent=(err as Error).message;
  }
}
function goMenu() {
  game=undefined; v.message=""; sound.stopVoice(); sound.scene("menu"); world.reset(); render();
  el<HTMLButtonElement>("#start-btn").focus({preventScroll:true}); announce("Ana menü.");
}
function advance() {
  if (!panel && game?.next()) enter();
}
function modalContent() {
  if (!panel) return;
  if (panel==="help") dialog.innerHTML=help();
  else if (panel==="avatar") dialog.innerHTML=avatarPanel(settings);
  else if (panel==="album") dialog.innerHTML=album(history);
  else if (panel==="teacher") dialog.innerHTML=teacher(draft!,tab,history);
  else if (panel==="sound") dialog.innerHTML=soundPanel(draft!);
  else if (panel==="list" && game) dialog.innerHTML=heading("list","Alışveriş Listem")+
    `<div class="dialog-scroll expanded-list">${listHTML(game)}</div><footer>${btn("close","Alışverişe Dön","back","primary")}</footer>`;
  else if (panel==="pause") dialog.innerHTML=heading("pause","Oyun duraklatıldı")+
    `<div class="dialog-scroll pause-options">${btn("close","Devam Et","play","primary")}${btn("help","Nasıl Oynanır?","map")}${btn("sound","Ses Ayarları","music")}${btn("leave","Ana Menü","house")}</div>`;
  else if (panel==="leave") dialog.innerHTML=heading("house","Ana menüye dönülsün mü?")+
    `<div class="dialog-scroll"><p>Bu alışveriş sona erecek. Tamamladığın görevlerin sonuçları bu sekmede saklanır.</p></div><footer>${btn("close","Alışverişe Dön","back","primary")}${btn("menu","Ana Menüye Dön","house")}</footer>`;
  else dialog.innerHTML=heading("expand","Tam ekran")+
    `<div class="dialog-scroll"><p>Bu tarayıcı veya sayfa tam ekran izni vermedi. Oyunu kendi sekmesinde açabilir ya da burada devam edebilirsin.</p></div><footer>${btn("close","Oyuna Dön","back","primary")}</footer>`;
}
function openPanel(type: Panel) {
  if (!panel) returnFocus=document.activeElement as HTMLElement|null;
  panel=type; tab=0;
  if (type==="teacher"||type==="sound") draft=structuredClone(settings);
  world.paused=true; sound.setPaused(true); modalContent();
  if (!dialog.open) dialog.showModal();
  dialog.querySelector<HTMLElement>("#dialog-title")?.focus({preventScroll:true});
}
function closePanel() {
  panel=undefined; draft=undefined;
  if (dialog.open) dialog.close();
  world.paused=document.hidden;
  sound.settings=settings; sound.setPaused(document.hidden);
  if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
  returnFocus=null;
}
function save() {
  if (!draft) return;
  if (panel==="teacher") {
    try { generate(draft); }
    catch (e) { el(".form-error").textContent=(e as Error).message; return; }
  }
  settings=draft;
  if (game) {
    for (const k of ["muted","voice","music","effects","volume"] as const)
      Object.assign(game.s,{[k]:settings[k]});
  }
  const stored=saveSettings(settings);
  closePanel(); render();
  announce(stored?"Ayarlar kaydedildi.":"Ayarlar bu oyun süresince uygulanacak.");
}
function tickHint() {
  if (!game) return;
  const g=game; g.hint(); sound.effect("hint");
  let msg="", key="", target="drop";
  if (["shop","scan","bag"].includes(g.phase)) {
    const source=g.phase==="shop"?g.q.lines.map(l=>l.id):g.phase==="scan"?g.basket:g.scanned;
    const used=g.phase==="shop"?g.basket:g.phase==="scan"?g.scanned:g.bagged;
    const item=source.find(id=>countOf(used,id)<(g.q.lines.find(l=>l.id===id)?.qty||0));
    if (!item) { msg="Bütün ürünler tamam. Devam düğmesine dokun."; key="next"; }
    else if (v.selected===item) { msg=g.phase==="shop"?"Şimdi sepete dokun.":g.phase==="scan"?"Şimdi okuyucuya dokun.":"Şimdi poşete dokun."; key="drop"; }
    else { msg=`${PRODUCT[item].name} görseline bak. Önce onu seç.`; key=item; }
  } else if (g.phase==="review") {
    msg=`${lira(amount(g.offer))} ile ${lira(g.q.total)} toplandığında ${lira(g.paid)} ediyor mu?`;
    key=amount(g.offer)===g.changeDue?"offer-yes":"offer-no"; target=key;
  } else {
    const uid=g.nextMoney(), paying=g.phase==="pay", pieces=paying?g.q.wallet:g.drawer;
    const note=pieces.find(n=>n.uid===uid), chosen=paying?g.paidIds:g.changeIds;
    key=uid|| (paying?"confirm-pay":"confirm-change"); target=paying?"confirm-pay":"confirm-change";
    msg=note?(chosen.has(note.uid)?`${lira(note.value)} değerindeki seçili parayı geri al.`:`${lira(note.value)} değerindeki parayı seçmeyi dene.`):"Seçtiğin tutarı onaylayabilirsin.";
  }
  v.hintKey=key; v.message=msg; render();
  if (g.hintStep>=2) controls.querySelector<HTMLElement>(`[data-id="${key}"],[data-action="${key}"]`)?.classList.add("hint-object");
  if (g.hintStep>=3 && !world.reduced) {
    const from=controls.querySelector<HTMLElement>(`[data-id="${key}"],[data-action="${key}"]`),
      to=controls.querySelector<HTMLElement>(`[data-action="${target}"]`);
    if (from && to) fly(from.getBoundingClientRect(),to.getBoundingClientRect(),icon("hand"));
  }
  announce(msg); sound.speak(msg);
}
function wrong(message: string) {
  if (!game) return;
  game.attempts++;
  if (game.s.autoHint && game.attempts>=game.s.tries) {
    tickHint(); v.message=message+" "+v.message;
  } else { v.message=message; sound.speak(message); }
  render(); announce(v.message);
}
function fly(from: DOMRect,to: DOMRect,html: string) {
  if (world.reduced || !Element.prototype.animate) return;
  const ghost=document.createElement("div"); ghost.className="flying"; ghost.innerHTML=html;
  const x=from.left+from.width/2-22, y=from.top+from.height/2-22;
  ghost.style.left=x+"px"; ghost.style.top=y+"px"; document.body.append(ghost);
  const dx=to.left+to.width/2-22-x,dy=to.top+to.height/2-22-y;
  const animation=ghost.animate([{transform:"translate(0,0) scale(1)",opacity:1},
    {transform:`translate(${dx*.52}px,${dy*.52-16}px) scale(1.12)`,opacity:1},
    {transform:`translate(${dx}px,${dy}px) scale(.8)`,opacity:.2}],{duration:430,easing:"ease-in-out"});
  animation.onfinish=animation.oncancel=()=>ghost.remove();
}
function drop(id=v.selected) {
  if (!game || !["shop","scan","bag"].includes(game.phase)) return;
  if (!id) { v.message="Önce bir ürüne dokun."; announce(v.message); render(); return; }
  const from=controls.querySelector<HTMLElement>(`[data-action="item"][data-id="${id}"]`)?.getBoundingClientRect();
  const to=controls.querySelector<HTMLElement>('[data-action="drop"]')?.getBoundingClientRect();
  let error="";
  if (game.phase==="shop") error=game.collect(id);
  else if (!game.transfer(id)) error="Bu ürünü zaten taşıdın.";
  v.selected=""; v.hintKey="";
  if (error) { wrong(error); return; }
  if (from && to) fly(from,to,icon(id));
  sound.effect(game.phase==="scan"?"scan":game.phase==="bag"?"bag":"basket");
  world.pulse(id);
  v.message=game.phase==="scan"?`${PRODUCT[id].name} okutuldu. Toplam ${lira(game.scannedTotal)}.`:
    `${PRODUCT[id].name} ${game.phase==="shop"?"sepete":"poşete"} eklendi.`;
  render(); announce(v.message);
}
function selectMoney(uid: string, source: HTMLElement) {
  if (!game || !game.toggle(uid)) return;
  const paying=game.phase==="pay", selected=paying?game.paidIds:game.changeIds;
  const note=(paying?game.q.wallet:game.drawer).find(n=>n.uid===uid)!;
  const dest=controls.querySelector<HTMLElement>(selected.has(uid)?".payment-tray h3":".wallet-tray h3");
  if (dest) fly(source.getBoundingClientRect(),dest.getBoundingClientRect(),noteArt(note.kind));
  world.pulse(note.kind); sound.effect("note"); v.message=""; v.hintKey="";
  render(); announce(`${paying?"Verilen para":"Seçilen para üstü"} ${lira(paying?game.paid:game.pickedChange)}.`);
  const moved=controls.querySelector<HTMLButtonElement>(`[data-id="${uid}"]`); moved?.focus({preventScroll:true});
}
async function full() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else openPanel("full");
  } catch { openPanel("full"); }
}
function download() {
  const url=URL.createObjectURL(new Blob(["\ufeff",reportText(history)],{type:"text/plain;charset=utf-8"}));
  const link=document.createElement("a"); link.download="mahalle-marketi-sonuclari.txt"; link.href=url; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function action(act: string, id: string, target: HTMLElement) {
  if (act==="close") { closePanel(); return; }
  if (["help","teacher","sound","pause","list","leave","avatar","album"].includes(act)) { sound.effect("click");openPanel(act as Panel);return; }
  if (act==="choose-avatar" && panel==="avatar" && (id==="green"||id==="berry")) {
    settings.avatar=id;saveSettings(settings);closePanel();render();return;
  }
  if (act==="save") { save();return; }
  if (act==="tab") { tab=Number(id);modalContent();dialog.querySelector<HTMLElement>('[aria-current="page"]')?.focus();return; }
  if (act==="try-sound" && draft) {
    sound.settings=draft; sound.setPaused(false); sound.effect("yes"); sound.speak("Alışverişe hazır mısın?"); return;
  }
  if (act==="download") { download();return; }
  if (act==="menu") { closePanel();goMenu();return; }
  if (panel) return;
  if (act==="fullscreen") { void full();return; }
  if (act==="mute") {
    settings.muted=!settings.muted; if(game) game.s.muted=settings.muted;
    sound.stopVoice(); sound.refresh();saveSettings(settings);render();announce(settings.muted?"Ses kapalı.":"Ses açık.");return;
  }
  if (act==="start") { start();return; }
  if (!game) return;
  const g=game;
  if (act==="next") advance();
  if (act==="replay") speakDialogue(g);
  if (act==="pin-list") { v.listOpen=!v.listOpen;render(); }
  if (act==="hint") tickHint();
  if (act==="item") {
    v.selected=id;v.message="";sound.effect("pick");render();announce(`${PRODUCT[id].name} seçildi.`);
  }
  if (act==="drop") drop();
  if (act==="remove" && g.takeBack(id)) { v.selected="";v.message=`${PRODUCT[id].name} rafa bırakıldı.`;render();announce(v.message); }
  if (act==="money") selectMoney(id,target);
  if (["confirm-pay","confirm-change","offer-yes","offer-no"].includes(act)) {
    const paying=act==="confirm-pay", change=act==="confirm-change";
    const error=paying?g.confirmPay():change?g.confirmChange():g.review(act==="offer-yes");
    if (error) wrong(error);
    else { sound.effect("yes");enter(paying?(g.phase==="bag"?"Harika! Tam para verdin.":"Ödemen alındı."):
      g.phase==="change"?"Öneriyi doğru kontrol ettin. Şimdi para üstünü oluştur.":"Bravo! Para üstünü doğru aldın!"); }
  }
}
document.addEventListener("pointerdown",()=>sound.unlock(),{capture:true,once:true});
document.addEventListener("keydown",()=>sound.unlock(),{capture:true,once:true});
let handledPointer=false;
document.addEventListener("pointerdown",()=>{handledPointer=false;},{capture:true});
root.addEventListener("click",e=>{
  const b=(e.target as Element).closest<HTMLElement>("[data-action]");
  if (handledPointer && e.detail>0) { handledPointer=false;return; }
  if (b && !b.hasAttribute("disabled")) action(b.dataset.action!,b.dataset.id||"",b);
});
dialog.addEventListener("cancel",e=>{e.preventDefault();closePanel();});
dialog.addEventListener("input",e=>{
  const field=e.target;
  if (!draft || !(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) return;
  readField(field,draft);
  if (field.dataset.field==="level") { Object.assign(draft,levelDefaults(draft.level));modalContent(); }
  if (field.dataset.field==="volume") { const o=dialog.querySelector("output");if(o)o.textContent=draft.volume+"%"; }
  if (sound.settings===draft) sound.refresh();
});
document.addEventListener("keydown",e=>{
  if (e.key==="Escape" && !panel && game) { e.preventDefault(); openPanel("pause"); }
  if (e.key.toLowerCase()==="f" && !panel && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault();void full(); }
});
document.addEventListener("visibilitychange",()=>{
  world.paused=document.hidden||!!panel; sound.setPaused(world.paused);
});
reducedQuery.addEventListener("change",()=>applyAppearance());
document.addEventListener("fullscreenchange",()=>world.resize());

type Drag = { pointer: number; id: string; x: number; y: number; source: HTMLElement; ghost?: HTMLElement; };
let drag: Drag | undefined;
type Tap = { pointer: number; source: HTMLElement; x: number; y: number };
let tap: Tap | undefined;
function stopDrag() {
  if (drag?.source.hasPointerCapture(drag.pointer)) drag.source.releasePointerCapture(drag.pointer);
  drag?.ghost?.remove(); drag=undefined; root.classList.remove("dragging");
}
controls.addEventListener("pointerdown",e=>{
  if (!e.isPrimary || e.button!==0) return;
  if (e.pointerType!=="mouse") {
    const target=(e.target as Element).closest<HTMLElement>("[data-action]");
    // Use the primary pointer for pieces that move to a different control after a tap.
    // Native scrolling still cancels the tap when the finger moves.
    if (target && (["money","drop","remove"].includes(target.dataset.action!) ||
        (game?.s.tapOnly && target.dataset.action==="item"))) {
      tap={pointer:e.pointerId,source:target,x:e.clientX,y:e.clientY}; return;
    }
  }
  const b=(e.target as Element).closest<HTMLElement>('[data-action="item"]');
  if (!b || !game || game.s.tapOnly) return;
  drag={pointer:e.pointerId,id:b.dataset.id!,x:e.clientX,y:e.clientY,source:b};
  b.setPointerCapture(e.pointerId);
});
controls.addEventListener("pointermove",e=>{
  if (!drag || drag.pointer!==e.pointerId) return;
  if (!drag.ghost && Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<9) return;
  if (!drag.ghost) {
    drag.ghost=document.createElement("div");drag.ghost.className="flying dragged";drag.ghost.innerHTML=icon(drag.id);
    document.body.append(drag.ghost);root.classList.add("dragging");
  }
  drag.ghost.style.left=(e.clientX-24)+"px";drag.ghost.style.top=(e.clientY-24)+"px";
  if (e.clientY>innerHeight-45) window.scrollBy(0,16);
  if (e.clientY<45) window.scrollBy(0,-16);
});
controls.addEventListener("pointerup",e=>{
  if (tap?.pointer===e.pointerId) {
    const gesture=tap;tap=undefined;
    if (Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<10 &&
        gesture.source.contains(document.elementFromPoint(e.clientX,e.clientY))) {
      handledPointer=true;
      action(gesture.source.dataset.action!,gesture.source.dataset.id||"",gesture.source);
    }
    return;
  }
  if (!drag || drag.pointer!==e.pointerId) return;
  const moved=!!drag.ghost, id=drag.id, source=drag.source;
  const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-action="drop"]');
  stopDrag();
  if (moved) {
    handledPointer=true;
    if (hit) drop(id);
    else {v.selected=id;v.message="Ürün seçildi. Yerleştirmek için hedefe dokun.";render();announce(v.message);}
  } else if (e.pointerType!=="mouse") {
    // Some boards omit the emulated click for the first tap following a drag.
    handledPointer=true;
    action("item",id,source);
  }
});
controls.addEventListener("pointercancel",()=>{tap=undefined;stopDrag();});
window.addEventListener("blur",()=>{tap=undefined;stopDrag();});

declare global {
  interface Window { render_game_to_text(): string; advanceTime(ms: number): void; }
}
window.render_game_to_text=()=>JSON.stringify({
  phase:game?.phase||"menu",panel:panel||null,level:LEVELS[active().level],paused:world.paused,
  coordinates:"Canvas başlangıcı sol üst. X sağa, Y aşağı artar.",actor:game?world.actor:null,
  elapsed:Math.round(world.elapsed),selected:v.selected,message:v.message,muted:settings.muted,
  audio:{state:sound.ctx?.state||"idle",track:sound.track,music:!!sound.timer,talking:sound.talking},
  list:game?.q.lines,shelf:game?.q.shelf,basket:game?.basket,scanned:game?.scanned,bagged:game?.bagged,
  total:game?.scannedTotal,wallet:game?.q.wallet,paid:game?.paid,paidIds:game?[...game.paidIds]:[],
  drawer:game?.drawer,offer:game?.phase==="review"?game.offer:undefined,pickedChange:game?.pickedChange,
  completed:history.completed
});
window.advanceTime=(ms:number)=>{
  if (!Number.isFinite(ms) || ms<=0) return;
  for (let left=Math.min(ms,60000);left>0;left-=40) world.advance(Math.min(40,left),false);
  world.paint();
};
render();
fitEmbed(root);
