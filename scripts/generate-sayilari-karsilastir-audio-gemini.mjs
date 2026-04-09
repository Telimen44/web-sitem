import fs from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const model = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const voice = process.env.GEMINI_TTS_VOICE || "Sulafat";
const overwrite = process.argv.includes("--overwrite");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyKeys = new Set(
  onlyArg
    ? onlyArg
        .slice("--only=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : []
);

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "assets", "audio", "sayilari-karsilastir");
const manifestPath = path.join(outputDir, "manifest.json");

const clips = [
  {
    key: "question_buyuk",
    file: "hangisi-daha-buyuk.wav",
    text: "Hangisi daha büyük?",
    style:
      "Speak in Turkish with a warm, child-friendly classroom tone. Be clear, gently upbeat, and slightly slow.",
  },
  {
    key: "question_kucuk",
    file: "hangisi-daha-kucuk.wav",
    text: "Hangisi daha küçük?",
    style:
      "Speak in Turkish with a warm, child-friendly classroom tone. Be clear, gently upbeat, and slightly slow.",
  },
  {
    key: "question_esit",
    file: "sayilar-esit-mi.wav",
    text: "Sayılar eşit mi?",
    style:
      "Speak in Turkish with a warm, child-friendly classroom tone. Be clear, gently upbeat, and slightly slow.",
  },
  {
    key: "feedback_look_carefully",
    file: "dikkatli-bak.wav",
    text: "Dikkatli bak.",
    style:
      "Speak in Turkish. Sound calm, gentle, and supportive for a child. Avoid sounding harsh or robotic.",
  },
  {
    key: "feedback_try_again",
    file: "hadi-tekrar-dusun.wav",
    text: "Hadi tekrar düşün.",
    style:
      "Speak in Turkish. Sound patient, warm, and encouraging for a child. Keep it soft and motivating.",
  },
  {
    key: "game_complete",
    file: "tebrikler-oyunu-tamamladin.wav",
    text: "Tebrikler! Oyunu tamamladın.",
    style:
      "Speak in Turkish. Sound celebratory, warm, and child-friendly, like a caring teacher praising a student.",
  },
];

if (!apiKey) {
  console.error("GEMINI_API_KEY veya GOOGLE_API_KEY tanimli degil.");
  process.exit(1);
}

function buildPrompt(clip) {
  return [
    clip.style,
    'Read exactly the following Turkish text and nothing else.',
    `Text: "${clip.text}"`,
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
        contents: [
          {
            parts: [
              {
                text: buildPrompt(clip),
              },
            ],
          },
        ],
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

  throw new Error(`${clip.key} icin ses uretilemedi.`);
}

async function writeManifest() {
  const manifest = {};

  for (const clip of clips) {
    manifest[clip.key] = {
      text: clip.text,
      file: `assets/audio/sayilari-karsilastir/${clip.file}`,
      provider: "gemini-tts",
      model,
      voice,
    };
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

async function main() {
  await ensureDir(outputDir);

  const activeClips = onlyKeys.size
    ? clips.filter((clip) => onlyKeys.has(clip.key))
    : clips;

  if (activeClips.length === 0) {
    throw new Error("Uretilecek klip bulunamadi. --only parametresini kontrol et.");
  }

  for (const clip of activeClips) {
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
