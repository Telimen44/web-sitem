import fs from "node:fs/promises";
import path from "node:path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY tanimli degil.");
  process.exit(1);
}

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "gor-ve-sec.html");
const outputDir = path.join(projectRoot, "assets", "audio", "gor-ve-sec");
const voice = process.env.OPENAI_TTS_VOICE || "marin";
const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";

function normalizeTR(str) {
  return str
    .replace(/I/g, "ı")
    .replace(/İ/g, "i")
    .toLowerCase()
    .replace(/[^a-zçğıöşü]/g, "");
}

async function extractWords() {
  const html = await fs.readFile(sourcePath, "utf8");
  const words = new Set();
  const re = /w:\s*"([^"]+)"/g;
  let match;

  while ((match = re.exec(html)) !== null) {
    const word = match[1].trim();
    if (word) words.add(word);
  }

  return Array.from(words).sort((a, b) => a.localeCompare(b, "tr"));
}

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateSpeech(word, filePath) {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      voice,
      input: word,
      format: "mp3",
      instructions:
        "Speak in Turkish. Child-friendly, clear, warm, and slightly slow. Say only the single word."
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${word} icin ses uretilemedi: ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
}

async function writeManifest(words) {
  const manifest = {};

  for (const word of words) {
    manifest[normalizeTR(word)] = {
      text: word,
      file: `assets/audio/gor-ve-sec/${normalizeTR(word)}.mp3`
    };
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

async function main() {
  const words = await extractWords();
  await ensureDir();

  console.log(`${words.length} kelime bulundu. Sesler ${outputDir} klasorune yazilacak.`);

  for (const word of words) {
    const slug = normalizeTR(word);
    const filePath = path.join(outputDir, `${slug}.mp3`);

    if (await fileExists(filePath)) {
      console.log(`Atlandi: ${word}`);
      continue;
    }

    console.log(`Uretiliyor: ${word}`);
    await generateSpeech(word, filePath);
  }

  await writeManifest(words);
  console.log("Tamamlandi.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
