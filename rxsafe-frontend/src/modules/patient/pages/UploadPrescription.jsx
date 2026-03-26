import React, { useState, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/* ===============================
HELPER: GET USER ID FROM JWT
================================ */
function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
}

export default function UploadPrescription() {
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");

  /* ===============================
  HANDLE FILE SELECT
  ============================== */
  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);

    if (selected.type.includes("image")) {
      setPreview(URL.createObjectURL(selected));
    } else if (selected.type.includes("pdf")) {
      setPreview("PDF");
    } else {
      toast.error("Unsupported file type");
      setFile(null);
      setPreview(null);
    }
  };

  /* ===============================
  HANDLE DRAG DROP
  ============================== */
  const handleDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer.files[0];
    if (!selected) return;

    setFile(selected);

    if (selected.type.includes("image")) {
      setPreview(URL.createObjectURL(selected));
    } else if (selected.type.includes("pdf")) {
      setPreview("PDF");
    } else {
      toast.error("Unsupported file type");
      setFile(null);
      setPreview(null);
    }
  };

  /* ===============================
  UPLOAD PRESCRIPTION
  ============================== */
  const uploadPrescription = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem("token");
      const patientId = getUserIdFromToken();

      if (!token || !patientId) {
        toast.error("Session expired. Please login again.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", patientId);

      if (notes && notes.trim() !== "") {
        formData.append("notes", notes);
      }

      const res = await axios.post(`${API_BASE_URL}/api/prescriptions/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        toast.success("Prescription uploaded successfully");

        const id = res.data.data?._id;

        if (id) {
          navigate(`/patient/prescription/${id}`);
        } else {
          navigate("/patient/prescriptions");
        }
      } else {
        toast.error(res.data?.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Upload Prescription</h1>

      {/* DROP ZONE */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current.click()}
        className="border-2 border-dashed border-gray-400 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition"
      >
        {preview && preview !== "PDF" && (
          <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded" />
        )}

        {preview === "PDF" && (
          <p className="text-gray-600 font-medium">PDF Selected: {file?.name}</p>
        )}

        {!preview && (
          <div>
            <p className="text-gray-500">Drag & drop prescription here</p>
            <p className="text-sm text-gray-400 mt-1">Or click to select file</p>
            <p className="text-xs text-gray-400 mt-2">Allowed formats: JPG, PNG, PDF</p>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf"
          className="hidden"
        />
      </div>

      {/* NOTES */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes for doctor or system..."
        className="w-full border rounded-lg p-3"
      />

      {/* UPLOAD BUTTON */}
      <button
        onClick={uploadPrescription}
        disabled={uploading}
        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400"
      >
        {uploading ? "Processing Prescription..." : "Upload Prescription"}
      </button>
    </div>
  );
}
