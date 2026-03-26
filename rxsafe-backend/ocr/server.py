from flask import Flask, request, jsonify
from paddleocr import PaddleOCR
import tempfile
import os

app = Flask(__name__)

print("Loading PaddleOCR model...")
ocr = PaddleOCR(lang="en")
print("OCR model loaded.")


@app.route("/ocr", methods=["POST"])
def run_ocr():

    file = request.files["image"]

    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    file.save(temp.name)

    result = ocr.ocr(temp.name)

    extracted_text = []

    if result:
        for line in result:
            for word in line:
                extracted_text.append(word[1][0])

    os.remove(temp.name)

    return jsonify({
        "text": " ".join(extracted_text)
    })


app.run(port=8001)