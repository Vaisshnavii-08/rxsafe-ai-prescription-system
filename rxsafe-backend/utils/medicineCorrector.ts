const medicineDictionary = [
  "amoxicillin",
  "paracetamol",
  "ibuprofen",
  "penicillin",
  "azithromycin",
  "metformin",
  "atorvastatin",
  "omeprazole",
  "cetirizine"
];

export const correctMedicineNames = (text: string) => {

  const words = text.split(/\s+/);

  const detected: string[] = [];

  words.forEach((word) => {

    const cleaned = word.toLowerCase();

    medicineDictionary.forEach((drug) => {

      // only match if word is similar length
      if (
        cleaned.length >= 5 &&
        drug.startsWith(cleaned.substring(0,3))
      ) {
        detected.push(drug);
      }

    });

  });

  return [...new Set(detected)];
};