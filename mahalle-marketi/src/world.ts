import { art, cast, objects, poses, prepare } from "./art.ts";
import { MONEY } from "./catalog.ts";
import type { Game, Phase } from "./game.ts";
import type { Sound } from "./audio.ts";

const durations: Partial<Record<Phase, number>> = { exit: 1200, out: 4300, approach: 1300, return: 4300 };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const blend = (a: number, b: number, t: number) => a + (b - a) * clamp(t);
export class World {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  sound: Sound;
  game?: Game;
  elapsed = 0;
  burst = 0;
  burstItem = "";
  reduced = false;
  paused = false;
  actor = { x: 0, y: 0 };
  lastFoot = 0;
  onTravel: () => void;
  constructor(canvas: HTMLCanvasElement, sound: Sound, onTravel: () => void) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d")!;
    this.sound = sound; this.onTravel = onTravel;
    new ResizeObserver(() => this.resize()).observe(canvas);
    for (const img of Object.values(art)) img.addEventListener("load", () => this.paint());
    if (art.street.complete) prepare(art.kitchen);
    else art.street.addEventListener("load",()=>prepare(art.kitchen),{once:true});
    let last = performance.now(), painted = 0;
    const loop = (now: number) => {
      const dt = Math.min(80, now - last); last = now;
      if (!this.paused && !document.hidden) {
        this.advance(dt, false); painted += dt;
        if (painted >= 1000 / 24) { this.paint(); painted = 0; }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width && r.height) {
      const h = Math.round(800 * r.height / r.width);
      if (this.canvas.height !== h) this.canvas.height = h;
      this.paint();
    }
  }
  reset(g?: Game) {
    this.game = g; this.elapsed = 0; this.lastFoot = 0; this.burst = 0;
    if (g?.phase==="home") prepare(art.kitchen);
    if (g?.phase==="gift" || g?.phase==="shop") prepare(art.shop);
    if (g?.phase==="shop" || g?.phase==="scan") prepare(art.checkout);
    this.paint();
  }
  pulse(id: string) { this.burstItem = id; this.burst = 750; }
  duration(phase: Phase) { return (durations[phase] || 0) * (this.reduced ? 0.18 : 1); }
  advance(ms: number, draw = true) {
    if (this.paused || document.hidden) return;
    this.elapsed += ms; this.burst = Math.max(0, this.burst - ms);
    const p = this.game?.phase;
    if (p && durations[p]) {
      const step = Math.floor(this.elapsed / 435);
      if (!this.reduced && step > this.lastFoot) { this.lastFoot = step; this.sound.effect("step"); }
      if (this.elapsed >= this.duration(p)) this.onTravel();
    }
    if (draw) this.paint();
  }
  img(image: HTMLImageElement, ...coords: [number,number,number,number] | [number,number,number,number,number,number,number,number]) {
    if (!image.complete || !image.naturalWidth) return;
    if (coords.length === 4) this.ctx.drawImage(image,...coords);
    else this.ctx.drawImage(image,...coords);
  }
  obj(id: string, x: number, y: number, size: number) {
    const i = objects.ids.indexOf(id); if (i < 0) return;
    this.img(art.objects, i % objects.cols * 32, Math.floor(i / objects.cols) * 32, 32,32,
      Math.round(x-size/2), Math.round(y-size/2), size,size);
  }
  note(id: string, x: number, y: number, width: number) {
    const i = MONEY.findIndex(n => n.id === id); if (i < 0) return;
    this.img(art.notes, i % 4 * 80, Math.floor(i / 4) * 40, 80,40,
      Math.round(x-width/2), Math.round(y-width/4),width,width/2);
  }
  person(who: string, frame: string, x: number, feet: number, size: number, facing = 1, shadow = true) {
    const c = this.ctx;
    if (shadow) {
      c.fillStyle = "rgba(56,37,29,.24)"; c.beginPath();
      c.ellipse(x,feet-2,size*0.23,size*.043,0,0,Math.PI*2); c.fill();
    }
    c.save(); c.translate(Math.round(x),Math.round(feet)); c.scale(facing,1);
    const variant=who==="child" && (this.game?.s.avatar||this.sound.settings.avatar)==="berry" ? "child2" : who;
    this.img(art.cast, poses.indexOf(frame)*40, cast.indexOf(variant)*54,40,54,-size*20/54,-size,size*40/54,size);
    if (who!=="child" && this.sound.talking && !this.reduced) {
      // The small face layer keeps lip movement independent of the hand and walking poses.
      const mouth=Math.floor(this.elapsed/165)%2 ? "talk" : "idle";
      const bob=["stride","rightstep","frontstep","backstep","happy","talk2"].includes(frame)?1:0;
      const pixel=size/54;
      this.img(art.cast,poses.indexOf(mouth)*40+17,cast.indexOf(variant)*54+18,10,6,
        -3*pixel,(18+bob-54)*pixel,10*pixel,6*pixel);
    }
    c.restore();
    if (who === "child") this.actor = { x: Math.round(x), y: Math.round(feet) };
  }
  idle(offset = 0) { return !this.reduced && (this.elapsed+offset)%3750 > 3500 ? "blink" : "idle"; }
  speaking() {
    if (!this.sound.talking || this.reduced) return this.idle();
    return ["talk","idle","talk2","idle"][Math.floor(this.elapsed/185)%4];
  }
  walk() { return this.reduced ? "idle" : ["leftstep","stride","rightstep","idle"][Math.floor(this.elapsed/145)%4]; }
  door(x: number, foot: number, w: number, h: number, openness: number) {
    if (openness <= 0) return;
    const c = this.ctx;
    c.fillStyle = "#3d332d"; c.fillRect(x,foot-h,w*clamp(openness),h);
    c.fillStyle = "#93613b"; c.fillRect(x+w*clamp(openness)-3,foot-h,3,h);
  }
  room(image: HTMLImageElement, height: number) {
    const ratio=image.naturalWidth && image.naturalHeight ? image.naturalWidth/image.naturalHeight : 2.25;
    const width=Math.max(800,height*ratio), nativeHeight=width/ratio;
    const left=(800-width)/2, top=(height-nativeHeight)*.68;
    this.img(image,left,top,width,nativeHeight);
    return {x:(u:number)=>left+width*u, y:(u:number)=>top+nativeHeight*u, width, height:nativeHeight};
  }
  paint() {
    const c=this.ctx,w=800,h=this.canvas.height, g=this.game, p=g?.phase;
    c.imageSmoothingEnabled=false; c.fillStyle="#6cbeba"; c.fillRect(0,0,w,h);
    const walk = p === "out" || p === "return";
    if (!p || walk) {
      const t = p ? clamp(this.elapsed/this.duration(p)) : 0;
      const progress = p === "return" ? 1-t : t;
      const pan = walk && !this.reduced ? 48 : 0;
      const sw = walk ? w+pan : Math.max(w,h*2.4);
      const ox = walk ? -pan*progress : (w-sw)/2;
      const sceneHeight = walk ? h : sw/2.4;
      const sky = walk ? 0 : (h-sceneHeight)*.45;
      this.img(art.street,ox,sky,sw,sceneHeight);
      if (!p) this.person("child",this.idle(),ox+sw*.437,sky+sceneHeight*.905,sceneHeight*.195);
      if (walk) {
        const streetH=h-sky, foot=h-streetH*.105;
        if (p==="return" && t>.83) this.door(ox+sw*.198,sky+streetH*.79,sw*.039,streetH*.17,(t-.83)*6);
        const x=ox+sw*blend(.215,.862,progress);
        const depth=t<.1?1-t/.1:t>.91?(t-.91)/.09:0;
        const y=foot-depth*streetH*.06;
        const pose=t<.08?(this.lastFoot%2?"front":"frontstep"):t>.94?(this.lastFoot%2?"back":"backstep"):this.walk();
        this.person("child",pose,x,y,streetH*(.4-depth*.04),p==="return"?-1:1);
        if (p==="return") this.obj("bag",x-19,y-streetH*.10,streetH*.14);
      }
      return;
    }
    const home=["home","gift","exit","deliver","praise","win"].includes(p);
    const shop=p==="shop" || p==="approach";
    const room=this.room(home?art.kitchen:shop?art.shop:art.checkout,h);
    const floor=h*.94, adult=Math.min(h*.79,186), kid=adult*.77;
    if (home) {
      const ptime=clamp(this.elapsed/1350);
      const momX=p==="win"?461:p==="praise"?blend(420,461,this.reduced?1:ptime):420;
      const childX=p==="exit" ? blend(531,735,this.elapsed/this.duration(p)) : p==="praise"||p==="win"?507:531;
      const momPose=p==="praise"||p==="win" ? (p==="win" || this.reduced || ptime>.62 ? (!this.reduced&&Math.floor(this.elapsed/520)%2?"pat":"pet"):this.walk()) :
        p==="gift" && this.elapsed<1900 ? "reach" : p==="exit"?this.idle():this.speaking();
      if (p==="exit") this.door(room.x(.868),room.y(.745),room.width*.09,room.height*.62,clamp(this.elapsed/this.duration(p)*2-0.7));
      this.person("mother",momPose,momX,floor,adult);
      const kidPose=p==="exit" ? (this.elapsed/this.duration(p)>.84?"backstep":this.walk()) :
        p==="gift"?"reach":p==="deliver"?"carry":p==="praise"||p==="win"?"happy":this.idle(900);
      this.person("child",kidPose,childX,floor,kid,p==="exit"?1:-1);
      if (p==="gift" && g) {
        this.obj("wallet",childX-26,floor-kid*.29,kid*.34);
        const f=this.reduced?1:clamp((this.elapsed-160)/1100);
        if (f<1) this.note(g.q.wallet[0].kind,blend(momX+29,childX-26,f),floor-kid*.38-Math.sin(f*Math.PI)*17,38);
      }
      if (p==="deliver") this.obj("bag",childX-30,floor-kid*.22,kid*.38);
      if (p==="praise" && g) {
        if (this.elapsed<1900) {
          const f=this.reduced?1:clamp(this.elapsed/1150);
          g.q.lines.forEach((l,i)=>this.obj(l.id,blend(514,397,f)+i*19,floor-kid*.36-24*Math.sin(f*Math.PI),25));
        }
        this.obj("heart",484,floor-adult*.91,20);
      }
      if (p==="win" && !this.reduced) {
        for (let i=0;i<14;i++) {
          c.fillStyle=["#fff1ab","#de8d52","#84ba8a"][i%3];
          c.fillRect((i*127+28)%w,(i*57+this.elapsed*.027)%(h+12),4,5);
        }
      }
      return;
    }
    const childX=p==="approach"?blend(370,540,this.elapsed/this.duration(p)):shop?370:366;
    const cashierX=room.x(shop ? .755 : .713), counterY=room.y(shop ? .625 : .657);
    const active=this.burst>0;
    c.save(); c.beginPath(); c.rect(0,0,w,counterY); c.clip();
    const cashierPose=active?"reach":p==="bag" && g?.bagged.length===g?.q.units?"happy":this.speaking();
    this.person("cashier",cashierPose,cashierX,counterY+adult*.35,adult,-1,false);
    c.restore();
    if (!shop && g) {
      c.fillStyle="#cbec9d"; c.font="bold 9px monospace";c.textAlign="center";c.textBaseline="middle";
      c.fillText(String(g.scannedTotal),room.x(.865),room.y(.434));
    }
    const carrying=p==="bag" && g?.bagged.length===g?.q.units;
    this.person("child",p==="approach"?this.walk():carrying?"carry":active?"reach":this.idle(1050),childX,floor,kid);
    if (shop) this.obj("basket",childX+23,floor-kid*.18,37);
    if (p==="bag" && g) {
      const filled = g.bagged.length/g.q.units;
      const bagX=carrying?childX+25:room.x(.60), bagY=carrying?floor-kid*.19:counterY-10;
      this.obj("bag",bagX,bagY,35+filled*12);
      if (g.bagged.length) this.obj(g.bagged[g.bagged.length-1],bagX,bagY-12,19);
    }
    if (active && !this.reduced) {
      const f=1-this.burst/750;
      const fromX=shop?childX-50:p==="change"?cashierX:childX+19;
      const toX=shop||p==="change"?childX+23:p==="scan"?room.x(.745):cashierX-8;
      const x=blend(fromX,toX,f), y=blend(floor-kid*.27,counterY-6,f)-Math.sin(f*Math.PI)*30;
      if (MONEY.some(m=>m.id===this.burstItem)) this.note(this.burstItem,x,y,37);
      else this.obj(this.burstItem,x,y,29);
    }
  }
}
