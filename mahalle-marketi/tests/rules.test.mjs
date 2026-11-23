import test from "node:test";
import assert from "node:assert/strict";
import { defaults, levelDefaults } from "../src/settings.ts";
import { Game } from "../src/game.ts";
import { generate } from "../src/quest.ts";
import { amount, Currency, subset, displayStacks, issue } from "../src/money.ts";
import { MONEY, RANGES } from "../src/catalog.ts";

function random(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function sample(payment = "exact", changeStyle = "make", seed = 5) {
  const s = { ...defaults(), products: ["milk", "bread", "yogurt"], count: 2,
    minimum: 35, maximum: 35, payment, changeStyle };
  return new Game(generate(s, "", 0, random(seed)), s, random(seed));
}
function scanAll(g) {
  while (g.phase !== "shop") assert.ok(g.next());
  assert.equal(g.next(), false);
  assert.match(g.collect("yogurt"), /listemizde yok/);
  for (const l of g.q.lines) for (let i = 0; i < l.qty; i++) assert.equal(g.collect(l.id), "");
  assert.match(g.collect("milk"), /yeterince/);
  assert.ok(g.takeBack("bread"));
  assert.ok(!g.next());
  g.collect("bread"); g.next(); g.next();
  assert.ok(!g.next());
  for (const id of g.basket) assert.ok(g.transfer(id));
  assert.ok(!g.transfer("bread"));
  assert.equal(g.scannedTotal, 35);
  assert.ok(g.next());
}
function finish(g) {
  assert.equal(g.phase, "bag");
  assert.equal(g.balance,amount(g.q.wallet)-g.q.total);
  assert.ok(!g.next());
  for (const id of g.scanned) assert.ok(g.transfer(id));
  assert.ok(!g.transfer("bread"));
  while (g.phase !== "win") assert.ok(g.next());
  assert.equal(g.report().stars, 3);
}
test("Süt ve ekmek, 35 TL, her ürün ve para bir kez kullanılır", () => {
  const g = sample();
  assert.deepEqual(g.q.wallet.map(n => n.value), [20, 10, 5]);
  assert.ok(g.confirmPay());
  scanAll(g);
  assert.equal(g.toggle("uydurma"), false);
  g.toggle("w0"); assert.ok(g.confirmPay());
  g.toggle("w0"); assert.equal(g.paid, 0);
  for (const p of g.q.wallet) g.toggle(p.uid);
  assert.equal(g.confirmPay(), "");
  assert.equal(g.pickedChange, 0);
  finish(g);
});
test("Kombinasyon modunda fazlası düzeltilir, farklı tam ödemeler geçerlidir", () => {
  const shape = sample("mix");
  const notes = shape.q.wallet;
  let ways = 0;
  for (let mask = 0; mask < 2 ** notes.length; mask++) {
    const picked = notes.filter((_, i) => mask & 2 ** i);
    if (amount(picked) !== 35) continue;
    const g = sample("mix"); scanAll(g);
    for (const p of notes) g.toggle(p.uid);
    assert.ok(g.confirmPay()); assert.equal(g.phase, "pay");
    for (const p of notes.filter(p => !picked.some(n => n.uid === p.uid))) g.toggle(p.uid);
    assert.equal(g.confirmPay(), ""); ways++;
  }
  assert.ok(ways >= 2);
});
test("Para üstünü oluşturma, yanlış ve doğru kasiyer önerilerini kontrol etme", () => {
  for (const mode of ["make", "check"]) for (const accept of [true, false]) {
    const g = sample("change", mode);
    g.random = () => accept ? 0.1 : 0.8;
    scanAll(g);
    assert.deepEqual(g.q.wallet.map(n => n.value), [50]);
    g.toggle("w0"); assert.equal(g.confirmPay(), "");
    assert.equal(g.changeDue, 15);
    if (mode === "check") {
      assert.ok(g.review(!accept)); assert.equal(g.phase, "review");
      assert.equal(g.review(accept), "");
    }
    if (g.phase === "change") {
      assert.ok(g.confirmChange());
      for (const value of [10, 5]) g.toggle(g.drawer.find(n => n.value === value).uid);
      assert.equal(g.confirmChange(), "");
    }
    assert.equal(g.pickedChange, 15); finish(g);
  }
});
test("Kısıtlı kupürlerle çözüm aranır, olanaksız ayar açıkça bildirilir", () => {
  assert.deepEqual(new Currency(["b20", "b50"], 100).make(60), ["b20","b20","b20"]);
  assert.equal(new Currency(["b20", "b50"], 100).make(35), null);
  const s = { ...defaults(), money: ["b200"], maximum: 45 };
  assert.throws(() => generate(s), /çözülebilen/);
  assert.throws(() => generate({ ...s, products: [] }), /ürün seçin/);
  const fixed = sample().s;
  const one = generate(fixed); assert.equal(generate(fixed, one.signature).signature, one.signature);
  const first = generate(defaults()); assert.notEqual(generate(defaults(), first.signature).signature, first.signature);
});
test("Bir ve beş liralık madeni para, tekrarlı ürünler ve fiziksel para yığınları",()=>{
  const s={...defaults(),products:["milk"],prices:{milk:6},count:1,quantities:true,minimum:12,maximum:12,money:["c1","c5"]};
  const g=new Game(generate(s),s);
  assert.equal(g.q.lines[0].qty,2);
  assert.deepEqual(g.q.wallet.map(p=>p.kind),["c5","c5","c1","c1"]);
  while(g.phase!=="shop")g.next();
  assert.equal(g.collect("milk"),"");assert.equal(g.collect("milk"),"");assert.ok(g.collect("milk"));
  g.next();g.next();g.transfer("milk");g.transfer("milk");assert.equal(g.scannedTotal,12);
  assert.ok(!g.transfer("milk"));g.next();
  for(const p of g.q.wallet)g.toggle(p.uid);
  assert.equal(g.confirmPay(),"");assert.equal(g.balance,0);
  const pile=issue(Array(25).fill("c1"),"c");
  assert.equal(displayStacks(pile)[0].count,25);
  assert.equal(subset(pile,19).length,19);
});
test("Kademeli sıra, ipucu basamakları ve ödül hesabı",()=>{
  const s={...defaults(),...levelDefaults(1),sequence:"gradual",simple:true,hintLevel:2};
  assert.equal(generate(s,"",0).lines.length,2);
  assert.equal(generate(s,"",1).lines.length,3);
  const q=generate(s,"",2);assert.equal(q.lines.length,4);assert.equal(q.shelf.length,5);
  const g=sample();scanAll(g);g.hint();g.hint();g.hint();
  assert.equal(g.hints,3);assert.equal(g.moneyHints,3);
  assert.equal(g.report().stars,1);assert.equal(g.report().independentMoney,false);
});
test("3.000 rastgele görevde adet, sınır, stok, tam ödeme ve para üstü çözülebilirliği", () => {
  const rand = random(234);
  for (let n = 0; n < 3000; n++) {
    const level = n % 3;
    const s = { ...defaults(), ...levelDefaults(level), quantities: n % 4 !== 0 };
    if (n % 5 === 0) s.money = ["b10", "b20", "b50"];
    if (n % 7 === 0) s.money = ["c1", "c5", "b10", "b20", "b50"];
    if (n % 11 === 0) s.prices.bread = 7;
    if (n % 13 === 0) s.sequence = "gradual";
    const q = generate(s, "", n % 6, rand);
    assert.ok(q.lines.length >= RANGES[level][0] && q.lines.length <= RANGES[level][1]);
    assert.equal(new Set(q.lines.map(l => l.id)).size, q.lines.length);
    assert.ok(q.lines.every(l => l.qty >= 1 && l.qty <= (s.quantities ? 2 : 1) && q.shelf.includes(l.id)));
    assert.equal(q.total, q.lines.reduce((v, l) => v + s.prices[l.id] * l.qty, 0));
    assert.ok(q.total >= s.minimum && q.total <= s.maximum);
    assert.ok(q.wallet.every(p => s.money.includes(p.kind) && MONEY.some(m => m.id === p.kind && m.value === p.value)));
    assert.equal(new Set(q.wallet.map(n => n.uid)).size, q.wallet.length);
    if (s.payment === "change") {
      assert.ok(amount(q.wallet) > q.total);
      assert.ok(q.currency.make(amount(q.wallet) - q.total));
    } else {
      assert.ok(subset(q.wallet, q.total));
      if (s.payment === "exact") assert.equal(amount(q.wallet), q.total);
    }
  }
});
