/**
 * AI Prescription Analysis Service
 * Provides additional clinical insight and suggestions.
 */

import OpenAI from "openai";

/* -----------------------------------------------------------
Initialize OpenAI client safely
----------------------------------------------------------- */

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

/* -----------------------------------------------------------
AI Analysis Function
----------------------------------------------------------- */

export const analyzePrescriptionAI = async (
  ocrText: string,
  drugs: any[],
  alerts: any[]
): Promise<{ explanation: string; confidence: number } | null> => {

  try {

    if (!client) {
      console.warn("AI skipped: OPENAI_API_KEY not configured");
      return null;
    }

    const prompt = `
You are a clinical decision support AI assisting doctors.

Prescription Text:
${ocrText}

Detected Drugs:
${JSON.stringify(drugs)}

Detected Alerts:
${JSON.stringify(alerts)}

Provide:

1. Safety risks
2. Clinical insights
3. Safer alternatives if applicable
4. A confidence score between 0-100

Return JSON format:
{
 "explanation": "...",
 "confidence": 85
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical safety assistant."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400
    });

    const aiText = completion?.choices?.[0]?.message?.content;

    if (!aiText) return null;

    try {
      return JSON.parse(aiText);
    } catch {
      return {
        explanation: aiText,
        confidence: 80
      };
    }

  } catch (err) {

    console.error("AI analysis failed:", err);

    return null;

  }

};