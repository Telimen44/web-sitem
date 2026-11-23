import { icon, titleURL, portraitURL, berryURL, noteArt } from "./art.ts";
import { LEVELS, PRODUCT, lira } from "./catalog.ts";
import { countOf, type Game, type Phase } from "./game.ts";
import { isMotherPhase, motherDialogue } from "./mother-dialogue.ts";
import { amount, displayStacks } from "./money.ts";
import type { Settings } from "./settings.ts";
import { btn, iconButton, itemButton, mini, noteButton } from "./ui.ts";

const journey = ["Ev", "Mahalle", "Market", "Kasa", "Ödeme", "Eve dönüş"];
const stepOf: Record<Phase, number> = {home:0,gift:0,exit:0,out:1,shop:2,approach:3,scan:3,pay:4,review:4,change:4,bag:4,return:5,deliver:5,praise:5,win:5};
export const stageNames: Record<Phase,string> = {
  home:"Evin mutfağı",gift:"Alışveriş parası",exit:"Evden çıkış",out:"Markete doğru",shop:"Market rafları",
  approach:"Kasaya doğru",scan:"Kasa",pay:"Ödeme",review:"Para üstü",change:"Para üstü",bag:"Poşetleme",
  return:"Eve doğru",deliver:"Evin mutfağı",praise:"Evde",win:"Görev tamamlandı"
};
export function dialogue(g: Game) {
  const mother=motherDialogue(g.phase,g.q.lines);
  if (mother) return mother.text;
  switch (g.phase) {
    case "shop": return "Listendeki ürünü bul. Önce ürüne, sonra sepete dokun.";
    case "scan": return "Hoş geldin! Ürünlerini tek tek kasaya koyabilirsin.";
    case "pay": return `Toplam ${lira(g.q.total)} tuttu. Ödeme yapabilir misin?`;
    case "change": return "Sana ne kadar para üstü vermeliyim?";
    case "review": return "İşte para üstün. Birlikte kontrol edelim mi?";
    case "bag": return "Alışverişini tamamladın. Şimdi ürünlerini poşete koyabilirsin!";
    default: return "";
  }
}
export function bar(s: Settings, game?: Game) {
  return `<div class="brand">${icon("store")}<span>Telimen <b>Eğitim</b></span></div>
    ${game && !s.simple ? `<div class="path" aria-label="Aşama ${stepOf[game.phase]+1} / 6">${journey.map((step,i)=>`<span class="${i<stepOf[game.phase]?"past":i===stepOf[game.phase]?"current":""}" title="${step}">${i<stepOf[game.phase]?"✓":i+1}</span>`).join("")}<b>${journey[stepOf[game.phase]]}</b></div>` : ""}
    <div class="tools">${game?iconButton("pause","Oyunu duraklat","pause"):""}${iconButton("mute",s.muted?"Sesi aç":"Sesi kapat",s.muted?"mute":"sound")}${btn("fullscreen","Tam Ekran","expand","screen-button")}</div>`;
}
export function menu(s: Settings) {
  return {
    scene:`<div class="menu-title"><h1><img src="${titleURL}" alt="Mahalle Marketi"></h1><span class="ribbon">Paramı Sayıyorum!</span></div>`,
    desk:`<div class="welcome"><button class="portrait" type="button" data-action="avatar" aria-label="Çocuk karakterini seç" title="Çocuk karakterini seç"><img src="${s.avatar==="berry"?berryURL:portraitURL}" alt=""></button><div class="welcome-copy"><span class="eyebrow">SEVİYE ${s.level+1}</span><h2>${LEVELS[s.level]}</h2><p>Annene yardım et, alışverişini tamamla, paranı doğru kullan!</p></div>${btn("start","Oyuna Başla","play","primary start",'id="start-btn"')}</div>`,
    links:[["help","map","Nasıl Oynanır?"],["teacher","teacher","Öğretmen Ayarları"],["sound","music","Ses Ayarları"]].map(([act,spr,label])=>
      `<button type="button" class="menu-link" data-action="${act}"><span class="link-pic">${icon(spr)}</span><b>${label}</b>${icon("right","chevron")}</button>`).join("")
  };
}
export function listHTML(g: Game) {
  return `<div class="mini-list">${g.q.lines.map(l=>{
    const n=countOf(g.basket,l.id);
    return mini(l.id,` · ${n}/${l.qty}`,n===l.qty);
  }).join("")}</div>`;
}
export type ViewState = { selected: string; message: string; listOpen: boolean; hintKey: string; };
function hintClass(g: Game, id: string, v: ViewState) {
  return g.hintStep>=2 && id===v.hintKey ? `hint-object ${g.hintStep>=3?"demonstrate":""}` : "";
}
function bubble(g: Game) {
  const mother=isMotherPhase(g.phase);
  const items=g.phase==="home"?`<div class="ask-list">${g.q.lines.map(l=>mini(l.id,` ×${l.qty}`)).join("")}</div>`:"";
  return `<div class="bubble ${mother?"":"cashier-bubble"}"><div class="speaker"><b>${mother?"Anne":"Kasiyer"}</b>${iconButton("replay","Konuşmayı yeniden dinle","sound")}</div><p>${dialogue(g)}</p>${items}</div>`;
}
export function stage(g: Game, v: ViewState) {
  const p=g.phase;
  let content=`<span class="place">${icon(["home","gift","exit","praise","deliver","win"].includes(p)?"house":["out","return"].includes(p)?"map":p==="shop"?"store":"till")}${stageNames[p]}</span>`;
  if (p==="win") return `<div class="win-badge"><div>${Array.from({length:g.report().stars},()=>icon("star")).join("")}</div><h1>Tebrikler!</h1></div>`;
  if (p==="shop") {
    content+=`<aside class="list-corner"><div class="list-head">${btn("list","Alışveriş Listem","list","list-button",'aria-label="Alışveriş listemi büyüt"')}${g.s.level!==0&&!g.s.pinList?iconButton("pin-list",v.listOpen?"Listeyi katla":"Listeyi göster",v.listOpen?"minus":"plus"):""}</div>
      ${v.listOpen||g.s.pinList||g.s.level===0?listHTML(g):""}</aside>`;
  } else if (["home","gift","deliver","praise","scan","pay","change","review","bag"].includes(p)) content+=bubble(g);
  return content;
}
function next(label: string, active=true) {
  return btn("next",label,"right","primary",active?"":"disabled");
}
function hintBtn(g: Game) {
  return g.s.manualHint ? btn("hint","İpucu","hint","hint-button") : "";
}
function message(v: ViewState) {
  return v.message ? `<p class="feedback">${icon("hint","tiny")}<span>${v.message}</span></p>` : "";
}
function heading(title: string, detail="", right="") {
  return `<div class="desk-heading"><div><h2 tabindex="-1">${title}</h2>${detail?`<p>${detail}</p>`:""}</div>${right}</div>`;
}
function tray(g: Game, v: ViewState) {
  const shop=g.phase==="shop", scan=g.phase==="scan", bag=g.phase==="bag";
  const source=shop?g.q.shelf:[...new Set(scan?g.basket:g.scanned)];
  const current=scan?g.scanned:g.bagged;
  const grid = source.map(id=>{
    const available=shop?undefined:countOf(scan?g.basket:g.scanned,id)-countOf(current,id);
    return available===0?"":itemButton(id,g.s.prices[id],available,v.selected===id,hintClass(g,id,v));
  }).join("");
  const contents=shop?g.basket:current;
  const complete=contents.length===g.q.units;
  const title=shop?"Raflardan ürün seç":scan?"Ürünlerini kasada okut":"Ürünlerini poşetle";
  const where=shop?"sepete":scan?"okuyucuya":"poşete";
  const caption=complete?(shop?"Listedeki ürünlerin hepsi sepette.":scan?"Bütün ürünler fişe eklendi.":"Alışverişin hazır!") :
    v.selected?`${PRODUCT[v.selected].name} seçildi. Şimdi ${where} dokun.`:`Önce bir ürüne, sonra ${where} dokun.`;
  const label=shop?"Sepete koy":scan?"Kasada okut":"Poşete koy";
  const collected=[...new Set(contents)].map(id=>shop?
    `<button type="button" class="return-item" data-action="remove" data-id="${id}" aria-label="${PRODUCT[id].name} rafa geri bırak">${icon(id)}${countOf(contents,id)} ${icon("minus","tiny")}</button>`:
    mini(id,` ×${countOf(contents,id)}`)).join("");
  const receipt=scan?`<div class="receipt"><h3>Alışveriş fişi</h3>${g.q.lines.filter(l=>g.scanned.includes(l.id)).map(l=>{
    const n=countOf(g.scanned,l.id);
    return `<div><span>${PRODUCT[l.id].name} ×${n}</span><b>${lira(l.price*n)}</b></div>`;
  }).join("")}<div class="total"><b>Toplam</b><strong>${lira(g.scannedTotal)}</strong></div></div>`:"";
  return heading(title,caption,hintBtn(g))+message(v)+`<div class="play-grid"><div><div class="shelf ${shop?"wood":""}">${grid || `<div class="rack-done">${icon("check")}<b>${scan?"Sepet boş.":"Tüm ürünler poşette."}</b></div>`}</div>
    ${scan&&g.s.addition&&g.lastSum?`<p class="math">${g.lastSum}</p>`:""}</div>
    <div class="operation"><button type="button" class="drop-zone ${v.selected?"armed":""} ${v.hintKey==="drop"&&g.hintStep>=2?"hint-object":""}" data-action="drop" aria-label="${label}">${icon(shop?"basket":scan?"till":"bag","drop-art")}<span><strong>${label}</strong><small>${contents.length} / ${g.q.units} ürün</small></span></button>
    ${receipt}${!scan&&contents.length?`<div class="contents" aria-label="${shop?"Sepettekiler, dokunarak geri bırak":"Poşettekiler"}">${collected}</div>`:""}
    ${next(shop?"Kasaya Git":bag?"Eve Dön":"Ödemeye Geç",complete)}</div></div>`;
}
function money(g: Game, v: ViewState) {
  const pay=g.phase==="pay", reviewing=g.phase==="review";
  const selected=pay?g.paidIds:g.changeIds, pieces=pay?g.q.wallet:g.drawer;
  const picked=pay?g.paid:g.pickedChange;
  const title=pay?"Cüzdanından ödeme yap":reviewing?"Kasiyerin önerisini kontrol et":"Para üstünü oluştur";
  const panel=(paid: boolean)=>displayStacks(pieces.filter(n=>selected.has(n.uid)===paid)).map(({piece,count})=>noteButton(piece,paid,hintClass(g,piece.uid,v),count)).join("");
  const caption=pay?"Vereceğin paraya dokun. Seçtiğin parayı geri alabilirsin.":
    reviewing?"Kasiyerin uzattığı para, alman gereken para üstü mü?":"Alacağın paralara tek tek dokun.";
  const aid=!pay && g.s.changeAid?`<div class="change-aid"><span>${lira(g.q.total)} + ? = ${lira(g.paid)}</span><div aria-hidden="true"><i style="width:${g.q.total/g.paid*100}%"></i></div></div>`:"";
  return heading(title,caption,hintBtn(g))+message(v)+`<div class="money-status"><span>Alışveriş <b>${lira(g.q.total)}</b></span><span>Verilen <b>${lira(g.paid)}</b></span>${!pay?`<span>Para üstü <b>?</b></span>`:""}</div>${aid}`+
    (reviewing ? `<div class="offered"><h3>Kasiyerin önerisi</h3><div class="notes">${displayStacks(g.offer).map(({piece,count})=>`<span class="money-piece">${noteArt(piece.kind)}<b>${lira(piece.value)}${count>1?" ×"+count:""}</b></span>`).join("")}</div></div><div class="actions">${btn("offer-no","Düzeltilmeli","back")}${btn("offer-yes","Doğru","check","primary")}</div>`:
    `<div class="money-grid"><div class="wallet-tray"><h3>${icon(pay?"wallet":"till")}${pay?"Cüzdanım":"Kasa çekmecesi"} <small>${lira(amount(pieces)-picked)}</small></h3>
      <div class="notes">${panel(false)||`<span class="empty">Bütün paraları seçtin.</span>`}</div></div>
      <div class="payment-tray"><h3>${icon(pay?"till":"wallet")}${pay?"Verdiğim para":"Aldığım para üstü"} <small>${lira(picked)}</small></h3>
      <div class="notes">${panel(true)||`<span class="empty">Seçtiğin paralar burada görünür.</span>`}</div>
      ${btn(pay?"confirm-pay":"confirm-change",pay?"Ödemeyi Onayla":"Para Üstünü Al","check","primary")}</div></div>`);
}
export function desk(g: Game,v: ViewState) {
  switch(g.phase) {
    case "shop":case "scan":case "bag": return tray(g,v);
    case "pay":case "review":case "change":return money(g,v);
    case "home":return heading("Alışveriş listen hazır","Anneni dinle ve listedeki ürünlere bak.",next("Listemi Aldım"));
    case "gift":return heading("Cüzdanını al",`Annen alışveriş için ${lira(amount(g.q.wallet))} verdi.`,next("Paramı Al ve Çık"))+
      `<div class="gift-money">${icon("wallet")}${displayStacks(g.q.wallet).map(({piece,count})=>`<span class="gift-note" role="img" aria-label="${count} adet ${lira(piece.value)}">${noteArt(piece.kind)}${count>1?" ×"+count:""}</span>`).join("")}<b>${lira(amount(g.q.wallet))}</b></div>`;
    case "exit":case "out":case "approach":case "return": {
      const text=g.phase==="return"?"Poşetinle eve dönüyorsun.":g.phase==="approach"?"Sepetinle kasaya yürüyorsun.":g.phase==="out"?"Mahalle marketine yürüyorsun.":"Kapıdan çıkıyorsun.";
      return heading(stageNames[g.phase],text,btn("next","Yürüyüşü Geç","right"));
    }
    case "deliver":return heading("Alışverişini annene ver",g.balance?`Cüzdanında ${lira(g.balance)} kaldı. Poşetini annene uzat.`:"Poşetindeki ürünleri birlikte çıkarın.",next("Poşeti Teslim Et"));
    case "praise":return heading("Alışverişi tamamladın!","Annen aldığın ürünleri teslim aldı.",next("Yıldızlarımı Gör"));
    case "win": return heading("Alışveriş görevini başarıyla tamamladın!","Yeni bir listeyle yeniden oynayabilirsin.")+
      `<div class="actions">${btn("album","Çıkartmalarım","star")}${btn("menu","Ana Menü","house")}${btn("start","Yeni Alışveriş","play","primary")}</div>`;
  }
}
