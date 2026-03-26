import "dotenv/config";
import mongoose from "mongoose";
import User from "./dist/models/User.js"; // compiled JS model

console.log("[CHECK] Connecting to DB:", process.env.MONGODB_URI);

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected! Fetching users...\n");

    const users = await User.find().select("+passwordHash");

    console.log("USERS FOUND:", users.length);
    console.log("-------------------------------------");

    users.forEach((u) => {
      console.log({
        id: u._id,
        email: u.email,
        role: u.role,
        passwordHash: u.passwordHash,
      });
    });

    console.log("-------------------------------------");

    process.exit(0);
  } catch (err) {
    console.error("[ERROR]", err);
    process.exit(1);
  }
};

run();
