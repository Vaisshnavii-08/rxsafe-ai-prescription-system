import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const extractDrugsWithAI = async (imagePath: string) => {

  const imageBase64 = fs.readFileSync(imagePath, {
    encoding: "base64",
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
Read this prescription and extract ONLY the medicine names.
Ignore dosage and handwriting errors.
Return a list like:
Amoxicillin
Paracetamol
Penicillin
            `,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
  });

  return response.choices[0].message.content;
};