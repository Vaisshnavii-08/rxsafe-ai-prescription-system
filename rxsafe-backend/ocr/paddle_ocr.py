from paddleocr import PaddleOCR
import sys
import json

# Initialize OCR model
ocr = PaddleOCR(lang="en")

image_path = sys.argv[1]

# Run OCR
results = ocr.predict(image_path)

text = []

for line in results:
    if "rec_texts" in line:
        text.extend(line["rec_texts"])

print(json.dumps({
    "text": " ".join(text)
}))