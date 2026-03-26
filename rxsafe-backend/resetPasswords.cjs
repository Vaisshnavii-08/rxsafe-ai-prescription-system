const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// 🔹 UPDATE THIS WITH YOUR DB NAME
const MONGO_URI = "mongodb://127.0.0.1:27017/rxsafe";

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", UserSchema, "users");

async function resetPasswords() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const adminHash = await bcrypt.hash("Admin@123", 10);
    const doctorHash = await bcrypt.hash("Doctor@123", 10);
    const patientHash = await bcrypt.hash("Patient@123", 10);

    await User.updateMany(
      { role: "admin" },
      { $set: { passwordHash: adminHash } }
    );

    await User.updateMany(
      { role: "doctor" },
      { $set: { passwordHash: doctorHash } }
    );

    await User.updateMany(
      { role: "patient" },
      { $set: { passwordHash: patientHash } }
    );

    console.log("Passwords reset successfully");
    process.exit();
  } catch (err) {
    console.error("Error resetting passwords:", err);
    process.exit(1);
  }
}

resetPasswords();
