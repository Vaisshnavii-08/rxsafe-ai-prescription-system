import axios from "axios";
import fs from "fs";

export const processOCRSpace = async (filePath: string) => {

  const image = fs.readFileSync(filePath, { encoding: "base64" });

  const response = await axios.post(
    "https://api.ocr.space/parse/image",
    {
      base64Image: `data:image/jpeg;base64,${image}`,
      language: "eng",
      isOverlayRequired: false,
      OCREngine: 2
    },
    {
      headers: {
        apikey: process.env.OCR_SPACE_API_KEY
      }
    }
  );

  const parsedText =
    (response.data as any)?.ParsedResults?.[0]?.ParsedText || "";

  console.log("OCR SPACE TEXT:", parsedText);

  return {
    text: parsedText,
    provider: "ocr.space"
  };
};