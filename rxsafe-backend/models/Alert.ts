import mongoose, { Schema, Document } from "mongoose";

export interface IAlert extends Document {
  user: mongoose.Types.ObjectId;
  prescription?: mongoose.Types.ObjectId;
  message: string;
  severity: "low" | "moderate" | "high" | "critical";
  createdAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    prescription: {
      type: Schema.Types.ObjectId,
      ref: "Prescription",
      required: false,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    severity: {
      type: String,
      enum: ["low", "moderate", "high", "critical"],
      default: "low",
    },
  },
  { timestamps: true }
);

const Alert = mongoose.model<IAlert>("Alert", alertSchema);
export default Alert;
