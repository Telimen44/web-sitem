export function fitEmbed(root: HTMLElement) {
  if (window.parent === window || !document.referrer) return;
  root.classList.add("embedded");
  let parentOrigin: string;
  try { parentOrigin = new URL(document.referrer).origin; } catch { return; }
  if (!/^https?:\/\//.test(parentOrigin)) return;
  let previous = 0;
  const report = (force = false) => {
    const height = Math.ceil(root.getBoundingClientRect().height) + 3;
    if (!force && height === previous) return;
    previous = height;
    window.parent.postMessage({ type: "mahalle-marketi-height", height }, parentOrigin);
  };
  new ResizeObserver(() => report()).observe(root);
  window.addEventListener("message", event => {
    if (event.source === window.parent && event.origin === parentOrigin &&
        event.data?.type === "mahalle-marketi-measure") report(true);
  });
  report();
}
