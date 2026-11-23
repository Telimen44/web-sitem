import { PRODUCTS, spokenProduct } from "./catalog.ts";
import type { Phase } from "./game.ts";
import type { Line } from "./quest.ts";

const lines = {
  home: "Canım, marketten şunları alır mısın?",
  gift: "Al bakalım, alışveriş için paran burada!",
  deliver: "Hoş geldin canım! Alışverişi yaptın mı?",
  praise: "Harikasın! İstediğim her şeyi almışsın. Paranı da çok güzel kullandın. Seninle gurur duyuyorum!",
  and: "ve"
} as const;

export function isMotherPhase(phase: Phase): phase is "home" | "gift" | "deliver" | "praise" {
  return phase === "home" || phase === "gift" || phase === "deliver" || phase === "praise";
}

export function motherDialogue(phase: Phase, shopping: Line[]) {
  if (!isMotherPhase(phase)) return;
  if (phase !== "home") return { text: lines[phase], clips: [phase] };

  const items = shopping.map(({id, qty}) => spokenProduct(id, qty));
  const list = items.length === 1 ? items[0] : items.slice(0, -1).join(", ") + " ve " + items.at(-1);
  const clips: string[] = ["home"];
  shopping.forEach(({id, qty}, index) => {
    if (index > 0 && index === shopping.length - 1) clips.push("and");
    clips.push(`${id}-${qty}`);
  });
  return { text: `${lines.home} ${list.charAt(0).toLocaleUpperCase("tr")}${list.slice(1)}.`, clips };
}

export function motherRecordingScript() {
  const script: Record<string, string> = { ...lines };
  for (const item of PRODUCTS) {
    for (const count of [1, 2]) script[`${item.id}-${count}`] = spokenProduct(item.id, count);
  }
  return script;
}
