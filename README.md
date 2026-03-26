# AI-Based Prescription Error Detection System

## 📌 Overview

This project is an AI-powered system that analyzes medical prescriptions to detect potential errors and improve patient safety.

## 🚀 Features

* Extracts text from prescriptions (OCR / AI-based extraction)
* Identifies medicines and dosage
* Detects:

  * Drug–Drug interactions
  * Duplicate medications
  * High-risk prescriptions
* Suggests safer alternative medicines
* Classifies risk level (Low / Moderate / Critical)

## 🛠️ Tech Stack

* Frontend: React.js, Tailwind CSS
* Backend: Node.js, Express.js
* AI Logic: Rule-based + OCR integration

## 📂 Project Structure

* `rxsafe-frontend/` → UI
* `rxsafe-backend/` → Server & logic
* `prescriptions/` → Sample inputs

## ▶️ How to Run

### Backend

cd rxsafe-backend
npm install
npm run dev

### Frontend

cd rxsafe-frontend
npm install
npm run dev

## 📊 Example Output

* Medicines: Ibuprofen, Diclofenac
* Risk: Moderate
* Suggestion: Replace Ibuprofen with Paracetamol

## 🎯 Future Scope

* Real medical API integration
* Improved AI/NLP models
* Patient history tracking

## 👩‍💻 Author

Vaishnavi Sivakumar
