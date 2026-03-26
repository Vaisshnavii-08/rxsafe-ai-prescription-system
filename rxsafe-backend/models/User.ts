/**
 * USER MODEL — FINAL VERSION WITH DOCTOR VERIFICATION + ALLERGIES SUPPORT
 */

import mongoose, { Document, Schema, CallbackError } from "mongoose";
import bcrypt from "bcryptjs";

/* ============================================================
 * INTERFACE
 * ============================================================ */

export interface IUserDocument extends Document {

  name: string;
  email: string;
  passwordHash: string;

  role: "patient" | "doctor" | "admin";

  specialties?: string[];

  doctorVerification?: {
    status: "pending" | "approved" | "rejected";
    degree?: string;
    specialization?: string;
    registrationNumber?: string;
    issuingAuthority?: string;
    graduationYear?: number;
    documents?: {
      degreeCertificateUrl?: string;
      licenseUrl?: string;
    };
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    rejectionReason?: string;
  };

  location?: {
    type: "Point";
    coordinates: [number, number];
  } | null;

  availability?: {
    status: "Available" | "Busy" | "Offline";
    start?: string;
    end?: string;
    days?: string[];
  };

  allergies?: string[];

  medicalConditions?: string[];

  age?: number | null;

  weightKg?: number | null;

  createdAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;

  toJSON(): Record<string, any>;
}

/* ============================================================
 * SCHEMA
 * ============================================================ */

const userSchema = new Schema<IUserDocument>(
  {

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"]
    },

    passwordHash: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true,
      default: "patient"
    },

    /* ======================================================
       DOCTOR FIELDS
    ====================================================== */

    specialties: {
      type: [String],
      lowercase: true,
      trim: true,
      default: []
    },

    doctorVerification: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
      },
      degree: { type: String, trim: true },
      specialization: { type: String, trim: true },
      registrationNumber: { type: String, trim: true },
      issuingAuthority: { type: String, trim: true },
      graduationYear: { type: Number },
      documents: {
        degreeCertificateUrl: { type: String },
        licenseUrl: { type: String }
      },
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      verifiedAt: { type: Date },
      rejectionReason: { type: String, trim: true }
    },

    /* ======================================================
       LOCATION (OPTIONAL, DOCTOR)
    ====================================================== */

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined
      },
      coordinates: {
        type: [Number],
        default: undefined
      }
    },

    /* ======================================================
       AVAILABILITY (DOCTOR)
    ====================================================== */

    availability: {

      status: {
        type: String,
        enum: ["Available", "Busy", "Offline"],
        default: "Available"
      },

      start: {
        type: String,
        default: ""
      },

      end: {
        type: String,
        default: ""
      },

      days: {
        type: [String],
        default: []
      }

    },

    /* ======================================================
       PATIENT FIELDS
    ====================================================== */

    allergies: {
      type: [String],
      lowercase: true,
      trim: true,
      default: []
    },

    medicalConditions: {
      type: [String],
      lowercase: true,
      trim: true,
      default: []
    },

    age: {
      type: Number,
      min: 0,
      max: 120,
      default: null
    },

    weightKg: {
      type: Number,
      min: 1,
      max: 500,
      default: null
    }

  },
  { timestamps: true }
);

/* ============================================================
 * LOCATION INDEX
 * ============================================================ */

userSchema.index(
  { location: "2dsphere" },
  { partialFilterExpression: { "location.coordinates": { $exists: true } } }
);

/* ============================================================
 * PASSWORD HASH
 * ============================================================ */

userSchema.pre<IUserDocument>("save", async function (next) {

  if (!this.isModified("passwordHash")) return next();

  try {

    const salt = await bcrypt.genSalt(10);

    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);

    next();

  } catch (err) {

    next(err as CallbackError);

  }

});

/* ============================================================
 * METHODS
 * ============================================================ */

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {

  return bcrypt.compare(candidatePassword, this.passwordHash);

};

userSchema.methods.toJSON = function () {

  const user = this.toObject();

  delete user.passwordHash;
  delete user.__v;

  return user;

};

/* ============================================================
 * EXPORT
 * ============================================================ */

export default mongoose.model<IUserDocument>("User", userSchema);