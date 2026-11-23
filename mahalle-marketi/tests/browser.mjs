import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";
import { platformChecks } from "./platform.mjs";

const dist = new URL("../dist/index.html", import.meta.url);
const html = await readFile(dist);
const out = new URL("../output/playwright/", import.meta.url);
await mkdir(out, { recursive: true });
const host = createServer((req,res) => {
  if (req.url === "/oyun/" || req.url === "/oyun/index.html") {
    res.setHeader("Content-Type","text/html; charset=utf-8");res.end(html);
  } else { res.writeHead(404);res.end(); }
});
await new Promise(resolve=>host.listen(0,"127.0.0.1",resolve));
const base="http://127.0.0.1:"+host.address().port;
const parentHost=createServer((_req,res)=>{
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.end(`<!doctype html><html lang="tr"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0}iframe{width:100%;height:620px;border:0}</style>
    <iframe id="oyun" allow="fullscreen; autoplay" allowfullscreen src="${base}/oyun/"></iframe>
    <script>addEventListener("message",e=>{if(e.source===oyun.contentWindow && e.origin===${JSON.stringify(base)} && e.data?.type==="mahalle-marketi-height"){oyun.style.height=e.data.height+"px";oyun.dataset.measured="yes"}})</script></html>`);
});
await new Promise(resolve=>parentHost.listen(0,"127.0.0.1",resolve));
const frameBase="http://127.0.0.1:"+parentHost.address().port;
const engines={chromium,firefox,webkit};
const wanted=(process.env.GAME_BROWSERS||"chromium").split(",");
const results=[];
const state=p=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
const button=(p,action,id)=>p.locator('[data-action="'+action+'"]'+(id===undefined?"":'[data-id="'+id+'"]')+':visible').last();
async function click(p,a,id) {await button(p,a,id).click();}
async function isPhase(p,phase) {
  await p.waitForFunction(expected=>JSON.parse(window.render_game_to_text()).phase===expected,phase,{timeout:9000});
}
async function screenshot(page,name) {
  await page.screenshot({path:fileURLToPath(new URL(name+".png",out)),fullPage:true,animations:"disabled"});
}
async function noOverflow(p,stage) {
  const sizes=await p.evaluate(()=>({body:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
  assert.ok(sizes.body <= sizes.view+1,stage+" yatay taşma "+JSON.stringify(sizes));
}
function moneySubset(notes,target) {
  const memo=new Map([[0,[]]]);
  for (const n of notes) for (const [prev,arr] of Array.from(memo)) {
    if (prev+n.value<=target && !memo.has(prev+n.value)) memo.set(prev+n.value,[...arr,n.uid]);
  }
  return memo.get(target);
}
async function configure(p,{level=0,payment="exact",check=false,fixed=false,big=false}) {
  await click(p,"teacher");
  await p.locator('[data-field="level"]').selectOption(String(level));
  if (fixed) {
    await p.locator('[data-field="count"]').selectOption("2");
    await p.locator('[data-field="minimum"]').fill("35");
    await p.locator('[data-field="maximum"]').fill("35");
    await click(p,"tab","1");
    for (const c of await p.locator("input[data-product]").all()) {
      if (!["bread","milk","yogurt"].includes(await c.getAttribute("data-product"))) await c.uncheck();
    }
  }
  await click(p,"tab","2");
  await p.locator('[data-field="payment"]').selectOption(payment);
  await p.locator('[data-field="changeStyle"]').selectOption(check?"check":"make");
  if (fixed) {
    for (const c of await p.locator("input[data-denom]").all()) await c.uncheck();
    await click(p,"save"); assert.match(await p.locator(".form-error").innerText(),/para seçin/);
    for (const k of ["b5","b10","b20","b50"]) await p.locator('[data-denom="'+k+'"]').check();
  } else {
    await p.locator('[data-denom="c5"]').check();
  }
  await click(p,"tab","3"); await p.locator('[data-field="muted"]').check();
  await p.locator('[data-field="largeText"]').setChecked(big);
  await p.locator('[data-field="largeArt"]').setChecked(big);
  await click(p,"save");
  assert.equal((await state(p)).panel,null);
}
async function transfer(p,id,method,cdp) {
  const item=button(p,"item",id), dest=button(p,"drop");
  if (method==="drag" || method==="touchdrag") {
    await item.scrollIntoViewIfNeeded();
    const a=await item.boundingBox(),b=await dest.boundingBox();
    const x=a.x+a.width/2,y=a.y+a.height/2,tx=b.x+b.width/2,ty=b.y+b.height/2;
    if (method==="touchdrag") {
      await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
      for (let i=1;i<=9;i++) await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:x+(tx-x)*i/9,y:y+(ty-y)*i/9}]});
      await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    } else {
      const page=p.page?.()||p;
      await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(tx,ty,{steps:12});await page.mouse.up();
    }
    await p.waitForTimeout(205);
  } else if (method==="tap") { await item.tap();await dest.tap(); }
  else if (method==="keys") { await item.focus();await item.press("Space");await dest.focus();await dest.press("Enter"); }
  else { await item.click();await dest.click(); }
}
async function fullRun(browser,engine,options) {
  const {label,viewport,phone=false,board=false,fixed=false,offline=false,level=0,payment="exact",check=false}=options;
  const context=await browser.newContext({viewport,hasTouch:phone||board,isMobile:phone&&engine!=="firefox",deviceScaleFactor:1,acceptDownloads:true});
  const page=await context.newPage();
  const errors=[],external=[];
  page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
  page.on("requestfailed",r=>{if(!r.url().startsWith("data:"))errors.push(r.failure()?.errorText+" "+r.url());});
  page.on("request",r=>{if(/^https?:/.test(r.url()) && !r.url().startsWith(base+"/"))external.push(r.url());});
  const cdp=board && engine==="chromium"?await context.newCDPSession(page):null;
  if(process.env.GAME_TRACE) await page.addInitScript(()=>{
    window.inputTrace=[];
    for(const type of ["pointerdown","pointerup","click","pointercancel"]) document.addEventListener(type,e=>{
      const b=e.target.closest?.("[data-action]");
      window.inputTrace.push([Math.round(performance.now()),type,b?.dataset.action,b?.dataset.id,e.pointerType]);
      if(window.inputTrace.length>35)window.inputTrace.shift();
    },true);
  });
  try {
    if(offline)await context.setOffline(true);
    await page.goto(offline?dist.href:base+"/oyun/");await page.locator("#start-btn").waitFor();
    await page.evaluate(()=>document.fonts.ready);await noOverflow(page,"menü");
    await screenshot(page,engine+"-"+label+"-menu");
    await click(page,"help");await click(page,"close");
    await click(page,"avatar");await click(page,"choose-avatar","berry");
    await click(page,"sound");await page.locator('[data-field="muted"]').check();await click(page,"save");
    await configure(page,{level,payment,check,fixed,big:phone});
    await page.reload(); await page.locator("#start-btn").waitFor();
    assert.equal((await state(page)).muted,true);
    await click(page,"avatar");assert.equal(await button(page,"choose-avatar","berry").getAttribute("aria-pressed"),"true");await click(page,"close");
    await click(page,"start");await isPhase(page,"home");await noOverflow(page,"mutfak");
    await click(page,"replay");await screenshot(page,engine+"-"+label+"-home");
    await click(page,"next");await isPhase(page,"gift");await click(page,"next");
    if (fixed) {
      await click(page,"pause"); const before=(await state(page)).elapsed;
      await page.waitForTimeout(260);assert.equal((await state(page)).elapsed,before);
      await click(page,"close");
    }
    if ((await state(page)).phase==="exit") await click(page,"next");
    if ((await state(page)).phase==="out") {
      if (fixed) await screenshot(page,engine+"-"+label+"-street");
      if (!board) await click(page,"next");
    }
    await isPhase(page,"shop");
    let s=await state(page);const lines=s.list;
    if(fixed) assert.deepEqual(lines.map(l=>l.id).sort(),["bread","milk"]);
    await click(page,"list");await click(page,"close");
    assert.equal(await button(page,"next").isDisabled(),true);
    const wrong=s.shelf.find(id=>!lines.some(l=>l.id===id));
    const tap=phone||board?"tap":"click";
    if(wrong) {
      await transfer(page,wrong,tap);assert.equal((await state(page)).basket.length,0);
      assert.match((await state(page)).message,/listemizde yok/);
    }
    await screenshot(page,engine+"-"+label+"-shop");
    let i=0;
    for(const line of lines) for(let n=0;n<line.qty;n++) {
      const method=i===0?(cdp?"touchdrag":phone?"tap":"drag"):i===1&&!phone&&!board?"keys":tap;
      await transfer(page,line.id,method,cdp);i++;
      assert.equal((await state(page)).basket.length,i);
    }
    await transfer(page,lines[0].id,tap);assert.equal((await state(page)).basket.length,i);
    await click(page,"remove",lines[0].id);assert.equal(await button(page,"next").isDisabled(),true);
    await transfer(page,lines[0].id,tap);await click(page,"next");await isPhase(page,"scan");
    assert.equal(await button(page,"next").isDisabled(),true);
    let total=0;
    for(const l of lines) for(let n=0;n<l.qty;n++) {
      await transfer(page,l.id,cdp?"touchdrag":tap,cdp);total+=l.price;assert.equal((await state(page)).total,total);
    }
    if(fixed) assert.equal(total,35);
    await screenshot(page,engine+"-"+label+"-scan");
    await click(page,"next");await isPhase(page,"pay");await click(page,"confirm-pay");
    assert.equal((await state(page)).phase,"pay");s=await state(page);
    const payIds=payment==="change"?s.wallet.map(n=>n.uid):moneySubset(s.wallet,total);
    assert.ok(payIds);
    const give=uid=>(phone||board)?button(page,"money",uid).tap():click(page,"money",uid);
    for(let repeat=0;repeat<(board?8:1);repeat++) {
      await give(payIds[0]);assert.ok((await state(page)).paid>0);
      await give(payIds[0]);assert.equal((await state(page)).paid,0);
    }
    if(payment==="mix") {
      for(const n of s.wallet) await give(n.uid);
      await click(page,"confirm-pay");assert.equal((await state(page)).phase,"pay");
      for(const n of s.wallet) if(!payIds.includes(n.uid)) await give(n.uid);
    } else for(const uid of payIds) await give(uid);
    await noOverflow(page,"ödeme");await screenshot(page,engine+"-"+label+"-pay");
    await click(page,"confirm-pay");s=await state(page);
    const due=s.paid-total;
    if(fixed && payment==="change")assert.equal(due,15);
    if(check) {
      assert.equal(s.phase,"review");
      const right=s.offer.reduce((a,n)=>a+n.value,0)===due;
      await click(page,right?"offer-no":"offer-yes");assert.equal((await state(page)).phase,"review");
      await click(page,right?"offer-yes":"offer-no");
    }
    if((await state(page)).phase==="change") {
      await click(page,"confirm-change");assert.equal((await state(page)).phase,"change");
      const ids=moneySubset((await state(page)).drawer,due);assert.ok(ids);
      for(const uid of ids) await give(uid);
      assert.equal((await state(page)).pickedChange,due);
      await screenshot(page,engine+"-"+label+"-change");await click(page,"confirm-change");
    }
    await isPhase(page,"bag");assert.equal(await button(page,"next").isDisabled(),true);
    for(const l of lines) for(let n=0;n<l.qty;n++) await transfer(page,l.id,cdp?"touchdrag":tap,cdp);
    await click(page,"next");await isPhase(page,"return");if(!board) await click(page,"next");
    await isPhase(page,"deliver");await click(page,"next");await isPhase(page,"praise");
    await click(page,"next");await isPhase(page,"win");assert.equal((await state(page)).completed,1);
    await noOverflow(page,"sonuç");await screenshot(page,engine+"-"+label+"-win");
    await click(page,"album");assert.equal(await page.locator(".sticker-grid .earned").count(),1);await click(page,"close");
    await click(page,"start");await isPhase(page,"home");
    if(!fixed) assert.notDeepEqual((await state(page)).list.map(l=>l.id+"*"+l.qty).sort(),lines.map(l=>l.id+"*"+l.qty).sort());
    await click(page,"pause");await click(page,"leave");await click(page,"menu");await isPhase(page,"menu");
    await click(page,"teacher");await click(page,"tab","4");assert.match(await page.locator(".dialog-scroll").innerText(),/1 alışveriş tamamlandı/);
    const downloaded=page.waitForEvent("download");await click(page,"download");assert.equal((await downloaded).suggestedFilename(),"mahalle-marketi-sonuclari.txt");
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    console.log("OK",engine,label,viewport.width+"×"+viewport.height,total+" TL");
    results.push({engine,label,viewport,total,change:due,errors,external});
  } catch (e) {
    if(process.env.GAME_TRACE)console.error(await page.evaluate(()=>window.inputTrace));
    await screenshot(page,engine+"-"+label+"-hata");console.error(await state(page).catch(()=>null));throw e;
  } finally {await context.close();}
}
async function standalone(browser,engine) {
  const page=await browser.newPage({viewport:{width:360,height:780}});
  await page.goto(dist.href);await page.locator("#start-btn").waitFor();await click(page,"start");await isPhase(page,"home");
  await page.goto(frameBase);
  await page.locator('iframe[data-measured="yes"]').waitFor();
  const frame=page.frames().find(f=>f.url().endsWith("/oyun/"));
  await click(frame,"start");await isPhase(frame,"home");await noOverflow(frame,"iframe");
  await page.close();console.log("OK",engine,"çevrimdışı dosya ve ayrı kökenden otomatik boyutlanan iframe");
}
try {
  for (const name of wanted) {
    const browser=await engines[name].launch();
    try {
      await standalone(browser,name);
      if(name==="chromium" && !process.env.GAME_CASE)await platformChecks(browser,base);
      const cases=[{label:name==="firefox"?"para-ustu-35":"tam-para",viewport:{width:1366,height:768},fixed:true,
        offline:name==="chromium",payment:name==="firefox"?"change":"exact"}];
      if(name==="chromium") cases.push(
        {label:"tahta",viewport:{width:1920,height:1080},board:true,level:1,payment:"mix"},
        {label:"para-ustu",viewport:{width:390,height:844},phone:true,level:2,payment:"change"},
        {label:"kontrol",viewport:{width:820,height:1180},phone:true,level:2,payment:"change",check:true});
      if(name==="webkit")cases.push({label:"telefon",viewport:{width:375,height:812},phone:true,level:1,payment:"mix"});
      for(const c of cases.filter(c=>!process.env.GAME_CASE||c.label===process.env.GAME_CASE))await fullRun(browser,name,c);
    } finally {await browser.close();}
  }
  await writeFile(new URL("sonuclar.json",out),JSON.stringify(results,null,2));
} finally {parentHost.close();host.close();}
