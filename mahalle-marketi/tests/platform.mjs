import assert from "node:assert/strict";

export async function platformChecks(browser,base) {
  const page=await browser.newPage({viewport:{width:740,height:360}});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.toneStarts=0;
    const start=OscillatorNode.prototype.start;
    OscillatorNode.prototype.start=function(...args){window.toneStarts++;return start.apply(this,args);};
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>[],cancel(){}}});
    for(const k of ["getItem","setItem"]) Storage.prototype[k]=()=>{throw new DOMException("Depolama kapalı","SecurityError");};
  });
  await page.goto(base+"/oyun/");
  const b=name=>page.locator('[data-action="'+name+'"]:visible').last();
  const read=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
  await b("fullscreen").click();
  await page.waitForFunction(()=>!!document.fullscreenElement);
  await page.keyboard.press("f");await page.waitForFunction(()=>!document.fullscreenElement);
  await b("start").click();
  await page.waitForFunction(()=>window.toneStarts>1 && JSON.parse(window.render_game_to_text()).audio.state==="running");
  assert.equal((await read()).audio.track,"home");
  await b("replay").click();assert.equal((await read()).audio.talking,true);
  await page.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).audio.talking);
  await page.keyboard.press("Escape");assert.equal((await read()).panel,"pause");
  await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).audio.state==="suspended");
  await b("close").click();
  await page.evaluate(()=>{
    Object.defineProperty(document,"hidden",{configurable:true,value:true});
    document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal((await read()).paused,true);assert.equal((await read()).audio.music,false);
  await page.evaluate(()=>{
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).audio.state==="running");
  await b("mute").click();assert.equal((await read()).muted,true);
  await b("pause").click();await b("leave").click();await b("menu").click();
  await page.setViewportSize({width:320,height:568});await b("teacher").click();
  await page.locator('[data-action="tab"][data-id="3"]').click();
  for(const key of ["largeText","largeArt","tapOnly","simple","reduced"])
    await page.locator('[data-field="'+key+'"]').check();
  await page.locator('[data-field="autoHint"]').uncheck();
  assert.ok(await page.locator("dialog").evaluate(d=>d.scrollWidth<=d.clientWidth+1));
  await b("save").click();await b("start").click();await b("next").click();await b("next").click();
  await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==="shop");
  assert.ok(await page.locator("#game").evaluate(e=>["tap-only","simple","reduced"].every(c=>e.classList.contains(c))));
  const shop=await read();assert.ok(shop.shelf.length<=shop.list.length+1);
  await b("hint").click();await b("hint").click();
  assert.ok(await page.locator(".item.hint-object").count());
  await b("hint").click();assert.ok(await page.locator(".item.demonstrate").count());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
  assert.deepEqual(errors,[]);
  await page.close();

  const voice=await browser.newPage();
  await voice.addInitScript(()=>{
    window.voiceEvents=[];
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
      getVoices:()=>[{lang:"tr-TR",localService:true}],cancel(){},
      speak(u){window.voiceEvents.push(u);u.onstart?.();}
    }});
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{constructor(text){this.text=text;}}});
  });
  await voice.goto(base+"/oyun/");await voice.locator("#start-btn").click();
  assert.ok(await voice.evaluate(()=>window.voiceEvents[0].text.startsWith("Canım")));
  await voice.evaluate(()=>window.voiceEvents[0].onend());
  assert.equal(await voice.evaluate(()=>JSON.parse(window.render_game_to_text()).audio.talking),false);
  await voice.locator('[data-action="replay"]').click();
  await voice.evaluate(()=>window.voiceEvents[0].onend());
  assert.equal(await voice.evaluate(()=>JSON.parse(window.render_game_to_text()).audio.talking),true);
  await voice.evaluate(()=>window.voiceEvents.at(-1).onerror());
  assert.equal(await voice.evaluate(()=>JSON.parse(window.render_game_to_text()).audio.talking),false);
  await voice.close();
  console.log("OK Chromium: tam ekran, klavye, Web Audio, sekme duraklatma, ses olayları, kapalı depolama, 320 px ve kademeli ipucu");
}
