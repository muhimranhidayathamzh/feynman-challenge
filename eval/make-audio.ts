// Synthetic recordings for the eval-golden fixtures (Prompt 4.4, fallback of
// D14). Each fixture with a script.txt and no audio.wav gets one, spoken by
// Gemini's text-to-speech in Indonesian; "hening" gets eight seconds of near
// silence. Real recordings are better: drop an audio.wav (16-bit PCM) into a
// fixture folder and this script leaves it alone.
//
//   npm run eval:audio
//
// Uses GEMINI_API_KEY from .env.local. Prints file names only.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

import { GoogleGenAI } from "@google/genai";

const FIXTURES = "eval/fixtures";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

/** 16-bit mono PCM into a WAV container. */
function wav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * 24 kHz down to 16 kHz by linear interpolation: Gemini listens at 16 kHz
 * anyway, and the fixtures live in git, so a third smaller is worth it.
 */
function downsample(pcm: Buffer, from: number, to: number): Buffer {
  const count = pcm.length / 2;
  const outCount = Math.floor((count * to) / from);
  const out = Buffer.alloc(outCount * 2);
  for (let index = 0; index < outCount; index += 1) {
    const position = (index * from) / to;
    const left = Math.floor(position);
    const a = pcm.readInt16LE(left * 2);
    const b = left + 1 < count ? pcm.readInt16LE((left + 1) * 2) : a;
    out.writeInt16LE(Math.round(a + (b - a) * (position - left)), index * 2);
  }
  return out;
}

/** Room tone, not digital zero: closer to a muted microphone. */
function nearSilence(seconds: number, sampleRate = 16_000): Buffer {
  const pcm = Buffer.alloc(seconds * sampleRate * 2);
  for (let index = 0; index < seconds * sampleRate; index += 1) {
    pcm.writeInt16LE(Math.round((Math.random() - 0.5) * 40), index * 2);
  }
  return wav(pcm, sampleRate);
}

async function speak(ai: GoogleGenAI, text: string): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [
      {
        parts: [
          {
            text: `Bacakan dengan nada santai seperti orang yang sedang menjelaskan ke teman, dalam bahasa Indonesia: ${text}`,
          },
        ],
      },
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
    },
  });
  const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  const data = part?.inlineData?.data;
  if (!data) throw new Error("TTS returned no audio");
  // Gemini TTS answers with raw 24 kHz, 16-bit mono PCM.
  return wav(downsample(Buffer.from(data, "base64"), 24_000, 16_000), 16_000);
}

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY belum diisi di .env.local.");
  const ai = new GoogleGenAI({ apiKey: key });

  for (const name of readdirSync(FIXTURES)) {
    const dir = `${FIXTURES}/${name}`;
    if (existsSync(`${dir}/audio.wav`)) {
      console.log(`${name}: audio.wav sudah ada, dilewati`);
      continue;
    }
    if (name === "hening") {
      writeFileSync(`${dir}/audio.wav`, nearSilence(8));
      console.log(`${name}: 8 detik hening`);
      continue;
    }
    const script = readFileSync(`${dir}/script.txt`, "utf8").trim();
    writeFileSync(`${dir}/audio.wav`, await speak(ai, script));
    console.log(`${name}: dibuat dengan ${TTS_MODEL}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
