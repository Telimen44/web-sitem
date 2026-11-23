import { build } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const result = await build({ build: { write: false } });
const { output } = Array.isArray(result) ? result[0] : result;
let html = String(output.find(file => file.fileName === "index.html").source);
for (const file of output) {
  if (file.type === "chunk") {
    if (file.imports.length || file.dynamicImports.length) throw Error("Derleme ek betik istiyor.");
    html = html.replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/, () =>
      `<script type="module">${file.code.replace(/<\/script/gi, "<\\/script")}</script>`);
  } else if (file.fileName.endsWith(".css")) {
    html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/, () => `<style>${file.source}</style>`);
  }
}
const outputDirectory = new URL("../dist/", import.meta.url);
const license = await readFile(new URL("../art/Barlow-OFL.txt", import.meta.url), "utf8");
html = html.replace("</body>", () => '<script type="text/plain" id="barlow-font-license">' + license + "</script></body>");
await mkdir(outputDirectory, { recursive: true });
await writeFile(new URL("index.html", outputDirectory), html);
console.log(`Hazır: dist/index.html (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
