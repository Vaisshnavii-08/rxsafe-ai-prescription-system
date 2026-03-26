import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User";

dotenv.config();

const doctors = [
  {
    name: "Dr. Arjun Kumar",
    email: "arjun.kumar@rxsafe.com",
    password: "Doctor@123",
    role: "doctor",
    specialization: "Cardiologist",
    hospital: "Apollo Hospital",
    city: "Coimbatore",
  },
  {
    name: "Dr. Priya Nair",
    email: "priya.nair@rxsafe.com",
    password: "Doctor@123",
    role: "doctor",
    specialization: "Dermatologist",
    hospital: "KMCH Hospital",
    city: "Coimbatore",
  },
  {
    name: "Dr. Rahul Menon",
    email: "rahul.menon@rxsafe.com",
    password: "Doctor@123",
    role: "doctor",
    specialization: "Neurologist",
    hospital: "Ganga Hospital",
    city: "Coimbatore",
  },
  {
    name: "Dr. Meena Krishnan",
    email: "meena.krishnan@rxsafe.com",
    password: "Doctor@123",
    role: "doctor",
    specialization: "Pediatrician",
    hospital: "PSG Hospitals",
    city: "Coimbatore",
  },
  {
    name: "Dr. Suresh Iyer",
    email: "suresh.iyer@rxsafe.com",
    password: "Doctor@123",
    role: "doctor",
    specialization: "General Physician",
    hospital: "Sri Ramakrishna Hospital",
    city: "Coimbatore",
  },
];

async function seedDoctors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);

    console.log("MongoDB Connected");

    for (const doctor of doctors) {
      const hashedPassword = await bcrypt.hash(doctor.password, 10);

      const exists = await User.findOne({ email: doctor.email });

      if (!exists) {
       await User.create({
  ...doctor,
  passwordHash: hashedPassword,
});

        console.log(`Doctor created: ${doctor.name}`);
      } else {
        console.log(`Doctor already exists: ${doctor.email}`);
      }
    }

    console.log("Doctor seeding completed");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedDoctors();