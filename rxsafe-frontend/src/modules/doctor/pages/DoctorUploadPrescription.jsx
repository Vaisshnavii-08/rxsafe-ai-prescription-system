import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../../context/AuthContext";

export default function DoctorUploadPrescription() {

  const [file, setFile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  /* ================================
     Load Patients for Doctor
  ================================= */
  const loadPatients = async () => {
    try {

      const res = await axios.get(
        `${API_BASE_URL}/api/users/patients`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        setPatients(res.data.data || []);
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to load patients");
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  /* ================================
     Upload Prescription
  ================================= */
  const handleUpload = async () => {

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (!patientId) {
      toast.error("Please select a patient");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", patientId);

    try {

      setLoading(true);

      await axios.post(
        `${API_BASE_URL}/api/prescriptions/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      toast.success("Prescription uploaded successfully");

      setFile(null);
      setPatientId("");

    } catch (err) {

      console.error(err);

      const message =
        err?.response?.data?.error ||
        "Failed to upload prescription";

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold text-gray-800">
        Upload Prescription
      </h1>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">

        {/* PATIENT SELECT */}
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Select Patient</option>

          {patients.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.email})
            </option>
          ))}

        </select>

        {/* FILE INPUT */}
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full"
        />

        {/* UPLOAD BUTTON */}
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Uploading..." : "Upload Prescription"}
        </button>

      </div>

    </div>
  );
}