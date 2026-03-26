import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
console.log("Gemini key loaded:", process.env.GEMINI_API_KEY);
export const extractMedicinesWithGemini = async (ocrText: string) => {
  try {

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
const prompt = `
You are a medical prescription AI.

Extract the medicine names from the following OCR text.

Correct spelling mistakes.

Return ONLY medicine names separated by spaces.

Example:
Amoxicillin Paracetamol Ibuprofen

OCR TEXT:
${ocrText}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

  const text = response.text();

console.log("GEMINI RESPONSE:", text);

return text;

   

  } catch (error) {

    console.error("Gemini extraction error:", error);

    return "";
  }
};