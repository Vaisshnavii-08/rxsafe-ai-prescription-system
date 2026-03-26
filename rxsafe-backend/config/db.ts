/**
 * Database Configuration
 *
 * Establishes MongoDB connection using Mongoose.
 * Handles connection events and provides graceful shutdown.
 */

import mongoose from "mongoose";
import logger from "./logger";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Mongoose 7+ does NOT accept useNewUrlParser or useUnifiedTopology
    const conn = await mongoose.connect(mongoURI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed through app termination");
      process.exit(0);
    });

    return conn;
  } catch (error: any) {
    logger.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
