import fs from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const model = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const voice = process.env.GEMINI_TTS_VOICE || "Sulafat";
const overwrite = process.argv.includes("--overwrite");

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "assets", "audio", "renkler");
const manifestPath = path.join(outputDir, "manifest.json");

const clips = [
  { key: "kirmizi", file: "kirmizi-olani-bul.wav", text: "Kırmızı olanı bul!" },
  { key: "mavi", file: "mavi-olani-bul.wav", text: "Mavi olanı bul!" },
  { key: "yesil", file: "yesil-olani-bul.wav", text: "Yeşil olanı bul!" },
  { key: "sari", file: "sari-olani-bul.wav", text: "Sarı olanı bul!" },
  { key: "turuncu", file: "turuncu-olani-bul.wav", text: "Turuncu olanı bul!" },
  { key: "mor", file: "mor-olani-bul.wav", text: "Mor olanı bul!" },
  { key: "pembe", file: "pembe-olani-bul.wav", text: "Pembe olanı bul!" }
];

if (!apiKey) {
  console.error("GEMINI_API_KEY veya GOOGLE_API_KEY tanimli degil.");
  process.exit(1);
}

function buildPrompt(text) {
  return [
    "Speak in Turkish with a warm, child-friendly classroom tone.",
    "Be clear, calm, encouraging, and slightly slow.",
    'Read exactly the following text and nothing else.',
    `Text: "${text}"`
  ].join(" ");
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function createWaveHeader(dataLength, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = Buffer.alloc(44);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

async function saveWaveFile(filePath, pcmBuffer) {
  const header = createWaveHeader(pcmBuffer.length);
  await fs.writeFile(filePath, Buffer.concat([header, pcmBuffer]));
}

function getRetryDelayMs(errorText) {
  const detailMatch = /"retryDelay":\s*"([\d.]+)s"/.exec(errorText);
  if (detailMatch) return Math.max(5000, Math.ceil(Number(detailMatch[1]) * 1000));

  const messageMatch = /Please retry in ([\d.]+)s/i.exec(errorText);
  if (messageMatch) return Math.max(5000, Math.ceil(Number(messageMatch[1]) * 1000));

  return 60000;
}

async function generateClip(clip) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const maxAttempts = 6;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(clip.text) }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
        model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429 && attempt < maxAttempts) {
        const delayMs = getRetryDelayMs(errorText);
        console.warn(`${clip.key} icin kota bekleniyor: ${Math.ceil(delayMs / 1000)} sn`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw new Error(`${clip.key} icin Gemini TTS hatasi: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const base64Audio = payload?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error(`${clip.key} icin ses verisi donmedi.`);
    }

    return Buffer.from(base64Audio, "base64");
  }

  throw new Error("Ses uretimi tamamlanamadi.");
}

async function writeManifest() {
  const manifest = {};
  for (const clip of clips) {
    manifest[clip.key] = {
      text: clip.text,
      file: `assets/audio/renkler/${clip.file}`,
      provider: "gemini-tts",
      model,
      voice,
    };
  }
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

async function main() {
  await ensureDir(outputDir);

  for (const clip of clips) {
    const filePath = path.join(outputDir, clip.file);
    if (!overwrite && (await fileExists(filePath))) {
      console.log(`Atlandi: ${clip.key}`);
      continue;
    }

    console.log(`Uretiliyor: ${clip.key}`);
    const pcmBuffer = await generateClip(clip);
    await saveWaveFile(filePath, pcmBuffer);
  }

  await writeManifest();
  console.log(`Tamamlandi. Sesler: ${outputDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
