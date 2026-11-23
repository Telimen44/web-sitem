import { icon, noteArt, portraitURL, berryURL } from "./art.ts";
import { LEVELS, MONEY, PRODUCTS, RANGES, lira } from "./catalog.ts";
import type { Settings, History } from "./settings.ts";
import { btn, coinLabel, iconButton } from "./ui.ts";

export type Panel = "help" | "teacher" | "sound" | "pause" | "list" | "leave" | "full" | "avatar" | "album";
export const tabs = ["Görev", "Ürünler", "Para", "Destek", "Sonuçlar"];
const chosen = (a: unknown,b: unknown) => a === b ? "selected" : "";
const checked = (a: boolean) => a ? "checked" : "";
function select(key: keyof Settings, title: string, value: unknown, choices: [string | number, string][]) {
  return `<label class="field">${title}<select data-field="${key}">${choices.map(([v,t])=>`<option value="${v}" ${chosen(v,value)}>${t}</option>`).join("")}</select></label>`;
}
function number(key: keyof Settings, title: string, value: number, min: number, max: number) {
  return `<label class="field">${title}<input type="number" min="${min}" max="${max}" step="1" inputmode="numeric" data-field="${key}" value="${Number.isFinite(value)?value:""}"></label>`;
}
function toggle(s: Settings,key: keyof Settings,title: string) {
  return `<label class="toggle"><input type="checkbox" data-field="${key}" ${checked(!!s[key])}><span>${title}</span></label>`;
}
export function heading(iconId: string, name: string) {
  return `<header class="dialog-head">${icon(iconId,"dialog-icon")}<h2 id="dialog-title" tabindex="-1">${name}</h2>${iconButton("close","Kapat","close")}</header>`;
}
export function help() {
  return heading("map","Nasıl Oynanır?") + `<div class="dialog-scroll"><ol class="guide">
    <li>${icon("house")}<div><b>Annenden listeyi ve parayı al.</b><p>Konuşmayı yeniden dinlemek için ses düğmesine dokun.</p></div></li>
    <li>${icon("basket")}<div><b>Raftaki ürüne, sonra sepete dokun.</b><p>İstersen ürünü doğrudan sepete sürükle.</p></div></li>
    <li>${icon("till")}<div><b>Her ürünü kasada okut ve öde.</b><p>Parayı seç. Geri almak için aynı paraya tekrar dokun.</p></div></li>
    <li>${icon("bag")}<div><b>Ürünleri poşetle ve eve dön.</b><p>Alışverişini annene teslim et.</p></div></li></ol>
    <p class="key-help">Klavyede Tab ile ilerle, Enter veya Boşluk ile seç. F tam ekranı açar. Esc oyunu duraklatır.</p></div><footer>${btn("close","Anladım","check","primary")}</footer>`;
}
export function avatarPanel(s: Settings) {
  return heading("basket","Karakterini seç")+`<div class="dialog-scroll avatar-list">${[["green","Yeşil yelek",portraitURL],["berry","Mor yelek",berryURL]].map(([key,label,url])=>
    `<button class="avatar-choice" data-action="choose-avatar" data-id="${key}" aria-pressed="${s.avatar===key}"><img src="${url}" alt=""><b>${label}</b></button>`).join("")}</div>`;
}
export function album(h: History) {
  const stickers=[["basket","İlk sepetim"],["bread","Taze ekmek"],["milk","Süt kutusu"],["apple","Kırmızı elma"],["coin","Parlak lira"],["store","Mahalle marketi"],["house","Ev yolum"],["star","Alışveriş yıldızı"]];
  return heading("star","Çıkartmalarım")+`<div class="dialog-scroll"><p>Her alışverişte bir çıkartma kazanırsın.</p><div class="sticker-grid">${stickers.map(([id,label],i)=>{
    const count=Math.floor((h.completed+stickers.length-1-i)/stickers.length);
    return `<div class="${count?"earned":"locked"}">${icon(id)}<b>${label}</b><small>${count?count+" adet":"Henüz alınmadı"}</small></div>`;
  }).join("")}</div></div><footer>${btn("close","Tamam","check","primary")}</footer>`;
}
export function soundForm(s: Settings) {
  return `<div class="checks">${toggle(s,"muted","Tüm sesleri kapat")}${toggle(s,"voice","Türkçe seslendirme")}${toggle(s,"music","Arka plan müziği")}${toggle(s,"effects","Ses efektleri")}</div>
    <label class="field volume">Ses düzeyi <output>${s.volume}%</output><input data-field="volume" type="range" min="0" max="100" step="5" value="${s.volume}"></label>`;
}
export function soundPanel(s: Settings) {
  return heading("music","Ses Ayarları") + `<div class="dialog-scroll">${soundForm(s)}</div><footer>${btn("try-sound","Sesi Dene","sound")}${btn("save","Kaydet","check","primary")}</footer>`;
}
export function reportText(h: History) {
  return ["Mahalle Marketi – Alışveriş Sonuçları",`Bu sekmede tamamlanan görev sayısı: ${h.completed}`,
    "Tamamlanan seviyeler: " + h.levels.map(n=>LEVELS[n]).join(", "), "",
    ...h.recent.map((r,i)=>[
      `Görev ${h.completed-i} · ${LEVELS[r.level]}`,`İstenen ürün: ${r.units} · Doğru seçilen: ${r.correct}`,
      `İpucu: ${r.hints} · Ödeme: Başarılı (${r.paid} TL) · Alışveriş: ${r.total} TL`,
      r.payment==="change"?`Para üstü: Başarılı (${r.change} TL)`:"Para üstü: Bu görevde kullanılmadı",
      `Para işleminde ipucu: ${r.independentMoney?"Kullanılmadı":"Kullanıldı"} · Yıldız: ${r.stars}`].join("\n"))
  ].join("\n\n");
}
function results(h: History) {
  if (!h.completed) return `<p class="empty">Bu sekmede henüz tamamlanan alışveriş yok.</p>`;
  const last=h.recent[0];
  return `<p><b>${h.completed} alışveriş tamamlandı.</b></p><p>${h.levels.map(n=>LEVELS[n]).join(" · ")}</p>
    <h3>Son alışveriş</h3><dl class="summary">
    <div><dt>Doğru seçilen ürün</dt><dd>${last.correct} / ${last.units}</dd></div><div><dt>Kullanılan ipucu</dt><dd>${last.hints}</dd></div>
    <div><dt>Ödeme</dt><dd>Başarılı · ${lira(last.paid)}</dd></div><div><dt>Para üstü</dt><dd>${last.payment==="change"?"Başarılı · "+lira(last.change):"Bu görevde yok"}</dd></div></dl>
    ${btn("download","Sonuçları İndir","list")}<p class="small">İndirme, bu sekmedeki son 30 alışverişi içerir.</p>`;
}
export function teacher(s: Settings, tab: number, h: History) {
  let content="";
  if (tab===0) {
    const [low,high]=RANGES[s.level];
    content=`<div class="fields">${select("level","Zorluk seviyesi",s.level,LEVELS.map((x,i)=>[i,x]))}
      ${select("count","İstenen ürün çeşidi",s.count,[[0,`Otomatik (${low}–${high})`],...Array.from({length:high-low+1},(_,i)=>[low+i,String(low+i)] as [number,string])])}
      ${number("minimum","En düşük tutar (TL)",s.minimum,1,1000)}${number("maximum","En yüksek tutar (TL)",s.maximum,1,1000)}
      ${select("sequence","Görev sıralaması",s.sequence,[["random","Karışık görevler"],["gradual","Adım adım daha çok ürün"]])}</div>
      ${toggle(s,"quantities","Aynı üründen iki adet istenebilsin")}`;
  } else if (tab===1) {
    content=`<p class="intro">Rafa çıkacak ürünleri ve birim fiyatlarını seçin.</p><div class="product-settings">${PRODUCTS.map(p=>
      `<div><label><input type="checkbox" data-product="${p.id}" ${checked(s.products.includes(p.id))}>${icon(p.id)}<strong>${p.name}</strong></label><label class="price"><input aria-label="${p.name} fiyatı" type="number" inputmode="numeric" min="1" max="200" data-price="${p.id}" value="${Number.isFinite(s.prices[p.id])?s.prices[p.id]:""}"> TL</label></div>`).join("")}</div>`;
  } else if (tab===2) {
    content=`<div class="fields">${select("payment","Ödeme çalışması",s.payment,[["exact","Tam para"],["mix","Para kombinasyonu"],["change","Para üstü öğretimi"]])}
      ${select("changeStyle","Para üstü etkinliği",s.changeStyle,[["make","Para üstünü oluştur"],["check","Kasiyerin önerisini kontrol et"]])}</div>
      <fieldset><legend>Kullanılabilecek paralar</legend><div class="currency-settings">${MONEY.map(m=>
        `<label><input type="checkbox" data-denom="${m.id}" ${checked(s.money.includes(m.id))}>${noteArt(m.id)}<span>${coinLabel(m.id)}</span></label>`).join("")}</div></fieldset>`;
  } else if (tab===3) {
    content=`<h3>Görünüm ve etkileşim</h3><div class="checks">${toggle(s,"largeText","Büyük yazı")}${toggle(s,"largeArt","Büyük ürün görselleri")}
      ${toggle(s,"reduced","Hareketi azalt")}${toggle(s,"tapOnly","Yalnızca dokunarak seç")}${toggle(s,"simple","Sade arayüz")}${toggle(s,"pinList","Alışveriş listesini açık tut")}</div>
      <h3>Öğrenme desteği</h3><div class="fields">${number("tries","Otomatik ipucundan önce deneme",s.tries,1,5)}
      ${select("hintLevel","En yüksek ipucu düzeyi",s.hintLevel,[[1,"Sözel hatırlatma"],[2,"Nesneyi vurgula"],[3,"Hareketi örnekle"]])}</div>
      <div class="checks">${toggle(s,"autoHint","Otomatik ipucu")}${toggle(s,"manualHint","İpucu düğmesi")}${toggle(s,"addition","Kasada toplamayı göster")}${toggle(s,"changeAid","Para üstünde görsel destek")}</div><h3>Sesler</h3>${soundForm(s)}`;
  } else content=results(h);
  return heading("teacher","Öğretmen Ayarları")+`<nav class="tabs" aria-label="Ayar bölümleri">${tabs.map((t,i)=>`<button type="button" data-action="tab" data-id="${i}" ${i===tab?'aria-current="page"':""}>${t}</button>`).join("")}</nav>
    <div class="dialog-scroll">${content}</div><p class="form-error" role="alert"></p><footer><span class="small">Görev kuralları yeni alışverişte uygulanır.</span>${btn("save","Kaydet","check","primary")}</footer>`;
}
export function readField(input: HTMLInputElement | HTMLSelectElement, draft: Settings) {
  const key=input.dataset.field as keyof Settings | undefined;
  if (key) {
    const value=input instanceof HTMLInputElement && input.type==="checkbox" ? input.checked :
      typeof draft[key]==="number" ? (input.value===""?NaN:Number(input.value)) : input.value;
    Object.assign(draft,{[key]:value});
  } else if (input instanceof HTMLInputElement) {
    const {product,denom,price}=input.dataset;
    if (price) draft.prices[price]=input.value===""?NaN:Number(input.value);
    if (product || denom) {
      const key=product?"products":"money", id=product||denom!;
      draft[key]=draft[key].filter(x=>x!==id);
      if (input.checked) draft[key].push(id);
    }
  }
}
