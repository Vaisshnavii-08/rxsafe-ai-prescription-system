import natural from "natural";

/* Drug vocabulary */

const DRUG_VOCAB = [
  "paracetamol",
  "amoxicillin",
  "ibuprofen",
  "aspirin",
  "metformin",
  "atorvastatin",
  "omeprazole",
  "losartan",
  "azithromycin",
  "ceftriaxone"
];

/* Spell checker */

const spellcheck = new natural.Spellcheck(DRUG_VOCAB);

/* Correct OCR words */

export function correctOCRText(text: string): string {

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/);

  const corrected: string[] = [];

  for (const word of words) {

    if (word.length < 3) {
      corrected.push(word);
      continue;
    }

    const suggestions = spellcheck.getCorrections(word, 1);

    if (suggestions.length > 0) {
      corrected.push(suggestions[0]);
    } else {
      corrected.push(word);
    }

  }

  return corrected.join(" ");
}