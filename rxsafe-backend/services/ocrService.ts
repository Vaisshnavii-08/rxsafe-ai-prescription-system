import fs from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp";
import FormData from "form-data";

export interface OCRResult {
  text: string;
  provider: string;
  drugs: string[];
  rawResponse?: string;
}

/* ---------------- HELPERS ---------------- */

function detectMimeType(buffer: Buffer): string {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  return "image/jpeg";
}

async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize({ width: 2200 })
      .grayscale()
      .normalize()
      .sharpen()
      .threshold(150)
      .toBuffer();
  } catch {
    return buffer;
  }
}

/* ---------------- OCR.SPACE ---------------- */

async function processWithOCRSpace(
  buffer: Buffer,
  filename: string
): Promise<OCRResult> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) throw new Error("OCR_SPACE_API_KEY is not set in .env");

  const mimeType = detectMimeType(buffer);

  const formData = new FormData();
  formData.append("file", buffer, { filename, contentType: mimeType });
  formData.append("language", "eng");
  formData.append("OCREngine", "2");
  formData.append("isOverlayRequired", "false");
  formData.append("detectOrientation", "true");
  formData.append("scale", "true");

  const response = await axios.post(
    "https://api.ocr.space/parse/image",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        apikey: apiKey,
      },
    }
  );

  const result = response.data as {
    IsErroredOnProcessing?: boolean;
    ErrorMessage?: string[];
    ParsedResults?: { ParsedText?: string }[];
  };

  if (result?.IsErroredOnProcessing) {
    const errMsg = result?.ErrorMessage?.[0] || "OCR.space processing error";
    throw new Error(errMsg);
  }

  const text: string = (result?.ParsedResults ?? [])
    .map((r) => r.ParsedText ?? "")
    .join("\n")
    .trim();

  console.log("[OCR.space] Extracted text:", text);

  return {
    text,
    provider: "ocr.space",
    drugs: [],
    rawResponse: JSON.stringify(result),
  };
}

/* ---------------- MAIN PIPELINE ---------------- */

export async function processImage(imagePath: string): Promise<OCRResult> {
  console.log("[OCR] Processing file:", imagePath);

  const raw = fs.readFileSync(imagePath);
  const processed = await preprocessImage(raw);
  const filename = path.basename(imagePath);

  return processWithOCRSpace(processed, filename);
}

export const processPDF = async (): Promise<OCRResult> => ({
  text: "[PDF OCR not implemented]",
  provider: "manual",
  drugs: [],
});

export default {
  processImage,
  processPDF,
};