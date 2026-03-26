import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import csv from "csv-parser";
import { fileURLToPath } from "url";

import DrugLexicon from "../models/DrugLexicon";

dotenv.config();

/* Fix __dirname for ES modules */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const results: any[] = [];

const run = async () => {
  try {

    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("MongoDB connected");

    const csvPath = path.join(__dirname, "../seed/drugs.csv");

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {

        for (const drug of results) {

          await DrugLexicon.create({
            name: drug.name,
            therapeuticClass: drug.therapeuticClass,
            minDoseMg: Number(drug.minDoseMg),
            maxDoseMg: Number(drug.maxDoseMg),
          });

        }

        console.log("Drugs imported:", results.length);

        process.exit();
      });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();