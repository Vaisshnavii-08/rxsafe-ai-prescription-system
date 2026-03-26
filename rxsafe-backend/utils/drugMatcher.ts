import axios from "axios";

/* -------------------------------------------------------
   EXTRACT AGE
------------------------------------------------------- */

export function extractAgeFromText(text: string): number | null {
  const match = text.match(/age\s*[:\-]?\s*(\d{1,3})/i);
  if (!match) return null;
  const age = parseInt(match[1]);
  return age > 0 && age < 130 ? age : null;
}

/* -------------------------------------------------------
   MERGE DUPLICATE DRUGS WITH DOSES
   ["Paracetamol","Paracetamol","Amoxicillin"] + OCR text
   → [{ name:"Paracetamol", doses:["500mg","650mg"] }, ...]
------------------------------------------------------- */

export interface DrugWithDose {
  name: string;
  doses: string[];
}

export function mergeDrugsWithDoses(
  drugs: string[],
  ocrText: string
): DrugWithDose[] {
  const lines = ocrText.split("\n").map((l) => l.trim()).filter(Boolean);
  const drugMap = new Map<string, Set<string>>();

  for (const drug of drugs) {
    const key = drug.toLowerCase().trim();
    if (!drugMap.has(key)) drugMap.set(key, new Set());

    for (const line of lines) {
      if (line.toLowerCase().includes(key)) {
        const doseMatches = line.match(/\b(\d+\.?\d*\s*(?:mg|mcg|ml|g|iu|units?))\b/gi);
        if (doseMatches) {
          doseMatches.forEach((d) =>
            drugMap.get(key)!.add(d.toLowerCase().replace(/\s/g, ""))
          );
        }
      }
    }
  }

  const result: DrugWithDose[] = [];
  const seen = new Set<string>();

  for (const drug of drugs) {
    const key = drug.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      name:  drug,
      doses: [...(drugMap.get(key) || [])],
    });
  }

  console.log("[drugMatcher] Merged drugs with doses:", JSON.stringify(result, null, 2));
  return result;
}

/* -------------------------------------------------------
   EXTRACT DRUGS VIA GROQ
------------------------------------------------------- */

export async function extractDrugsFromText(text: string): Promise<string[]> {
  console.log("=== [drugMatcher] extractDrugsFromText CALLED ===");
  console.log("[drugMatcher] Text length:", text?.length);
  console.log("[drugMatcher] Text preview:", text?.slice(0, 200));

  if (!text || text.trim().length === 0) {
    console.warn("[drugMatcher] EMPTY TEXT — skipping Groq");
    return [];
  }

  const apiKey = process.env.GROQ_API_KEY;
  console.log("[drugMatcher] GROQ_API_KEY present:", !!apiKey);

  if (!apiKey) {
    console.error("[drugMatcher] GROQ_API_KEY not set in .env");
    return [];
  }

  try {
    console.log("[drugMatcher] Calling Groq API...");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `You are a medical assistant specializing in reading prescriptions.
Extract ALL medicine and drug names from the prescription text.

Rules:
- Include brand names and generic names
- Correct OCR spelling errors (e.g. "Ibuproben" → "Ibuprofen")
- If the same drug appears multiple times with different doses, include it ONCE per occurrence
- Do NOT deduplicate — if Paracetamol 500mg and Paracetamol 650mg both appear, return ["Paracetamol","Paracetamol"]
- Do NOT include dosage numbers, frequencies, or non-drug words
- Return ONLY a raw JSON array, no markdown, no explanation
- Example: ["Amoxicillin", "Paracetamol", "Paracetamol"]
- If no drugs found, return: []`,
          },
          {
            role: "user",
            content: `Extract all drug names from this prescription:\n\n${text}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log("[drugMatcher] Groq HTTP status:", response.status);

    const raw: string = response.data?.choices?.[0]?.message?.content || "";
    console.log("[drugMatcher] Groq raw response:", raw);

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const drugs: string[] = JSON.parse(cleaned);
    const result = Array.isArray(drugs) ? drugs : [];

    console.log("[drugMatcher] Final extracted drugs:", result);
    return result;

  } catch (err: any) {
    console.error("[drugMatcher] Groq API ERROR:");
    console.error("  Status:", err?.response?.status);
    console.error("  Data:", JSON.stringify(err?.response?.data));
    console.error("  Message:", err?.message);
    return [];
  }
}

/* -------------------------------------------------------
   matchDrugNames — standardize via Groq
------------------------------------------------------- */

export async function matchDrugNames(drugs: string[]): Promise<string[]> {
  if (!drugs || drugs.length === 0) return [];

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return drugs;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",   // ← fixed (was decommissioned llama3-8b-8192)
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `You are a pharmacist. Standardize these drug names:
- Use proper generic names where possible
- Fix spelling errors
- Remove duplicates
- Return ONLY a raw JSON array, no markdown, no explanation
- Example: ["Amoxicillin", "Paracetamol"]`,
          },
          {
            role: "user",
            content: `Standardize: ${JSON.stringify(drugs)}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const raw: string = response.data?.choices?.[0]?.message?.content || "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const result: string[] = JSON.parse(cleaned);

    console.log("[drugMatcher] matchDrugNames result:", result);
    return Array.isArray(result) ? result : drugs;

  } catch (err: any) {
    console.error("[drugMatcher] matchDrugNames error:", err?.response?.data || err?.message);
    return drugs;
  }
}