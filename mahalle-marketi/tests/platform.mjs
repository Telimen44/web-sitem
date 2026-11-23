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

  console.log("OK Chromium: tam ekran, klavye, Web Audio, sekme duraklatma, kapalı depolama, 320 px ve kademeli ipucu");
}

export async function motherVoiceChecks(browser,fileURL) {
  // WebKit's offline emulation also blocks file: navigation on Windows.
  const context=await browser.newContext({offline:browser.browserType().name()!=="webkit"});
  await context.route(/^https?:/,route=>route.abort());
  const voice=await context.newPage();
  const errors=[];
  voice.on("pageerror",error=>errors.push(error.message));
  const click=(action,id)=>voice.locator(`[data-action="${action}"]${id ? `[data-id="${id}"]` : ""}:visible`).last().click();
  const state=()=>voice.evaluate(()=>JSON.parse(window.render_game_to_text()));
  const advance=ms=>voice.evaluate(ms=>window.advanceTime(ms),ms);
  const whenClips=count=>voice.waitForFunction(n=>window.recordedStarts.length>=n,count);
  const voices=()=>voice.evaluate(()=>window.voiceEvents.length);
  await voice.addInitScript(()=>{
    window.voiceEvents=[];
    window.recordedStarts=[];
    window.recordedStops=0;
    if (typeof AudioBufferSourceNode!=="undefined") {
      const start=AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start=function(at){
        window.recordedStarts.push({at,duration:this.buffer.duration});
        return start.call(this,at);
      };
      const stop=AudioBufferSourceNode.prototype.stop;
      AudioBufferSourceNode.prototype.stop=function(...args){window.recordedStops++;return stop.apply(this,args);};
    }
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
      getVoices:()=>[{name:"Microsoft Tolga",lang:"tr-TR",localService:true}],cancel(){},
      speak(u){window.voiceEvents.push(u);u.onstart?.();}
    }});
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{constructor(text){this.text=text;}}});
  });
  try {
    await voice.goto(fileURL);await click("start");
    const home=await state();
    if (home.audio.state==="idle") {
      assert.equal(browser.browserType().name(),"webkit");
      assert.equal(await voice.evaluate(()=>!!(window.AudioContext||window.webkitAudioContext)),false);
      assert.match(await voice.locator(".bubble p").innerText(),/^Canım/);
      await click("replay");
      assert.equal(await voices(),0);
      assert.deepEqual(errors,[]);
      console.log("OK",browser.browserType().name(),"Web Audio bulunmadığında anne metni ve sessiz yeniden dinleme");
      return;
    }
    const count=1+home.list.length+Number(home.list.length>1);
    await whenClips(count);
    assert.equal(await voices(),0);
    const first=await voice.evaluate(()=>window.recordedStarts);
    assert.ok(first.every((clip,index)=>clip.duration>0 && (!index || clip.at>=first[index-1].at+first[index-1].duration)));

    await click("replay");await whenClips(count*2);
    assert.ok(await voice.evaluate(n=>window.recordedStops>=n,count));
    await click("mute");assert.equal((await state()).audio.talking,false);
    await click("replay");
    assert.equal(await voice.evaluate(()=>window.recordedStarts.length),count*2);
    assert.equal(await voices(),0);
    await click("mute");await click("next");await whenClips(count*2+1);
    assert.equal((await state()).phase,"gift");
    assert.equal(await voices(),0);

    await click("next");await advance(9000);
    for(const line of home.list) for(let i=0;i<line.qty;i++) {
      await click("item",line.id);await click("drop");
    }
    await click("next");await advance(3000);
    assert.ok(await voice.evaluate(()=>window.voiceEvents.at(-1).text.startsWith("Hoş geldin!")));
    await voice.evaluate(()=>window.voiceEvents.at(-1).onend());
    assert.equal((await state()).audio.talking,false);
    await click("replay");
    await voice.evaluate(()=>window.voiceEvents.at(-2).onend());
    assert.equal((await state()).audio.talking,true);
    await voice.evaluate(()=>window.voiceEvents.at(-1).onerror());
    assert.equal((await state()).audio.talking,false);

    for(const line of home.list) for(let i=0;i<line.qty;i++) {
      await click("item",line.id);await click("drop");
    }
    await click("next");
    for(const piece of (await state()).wallet) await click("money",piece.uid);
    await click("confirm-pay");
    for(const line of home.list) for(let i=0;i<line.qty;i++) {
      await click("item",line.id);await click("drop");
    }
    const beforeDelivery=await voices();
    await click("next");await advance(6000);await whenClips(count*2+2);
    assert.equal((await state()).phase,"deliver");
    await click("next");await whenClips(count*2+3);
    assert.equal((await state()).phase,"praise");
    assert.equal(await voices(),beforeDelivery);
    await voice.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).audio.talking);
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
  console.log("OK",browser.browserType().name(),"çevrimdışı anne kayıtları, yeniden dinleme, sessiz mod ve erkek cihaz sesi");
}
