import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";

export default function DoctorPatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);

  const token = localStorage.getItem("token");

  const loadData = async () => {
    setLoading(true);
    try {
      // Load patient information
      const userRes = await axios.get(
        `${API_BASE_URL}/api/users/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Load prescription list
      const presRes = await axios.get(
        `${API_BASE_URL}/api/prescriptions/doctor/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (userRes.data.success) setPatient(userRes.data.data);
      if (presRes.data.success) setPrescriptions(presRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load patient details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  if (loading) {
    return (
      <div className="p-6 text-gray-600">
        Loading patient details...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 text-red-600">
        Patient not found.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Patient Overview */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-3">
          Patient Details
        </h2>

        <p><b>Name:</b> {patient.name}</p>
        <p><b>Email:</b> {patient.email}</p>
        <p><b>Age:</b> {patient.age || "N/A"}</p>
        <p>
          <b>Weight:</b>{" "}
          {patient.weightKg ? `${patient.weightKg} kg` : "N/A"}
        </p>
        <p>
          <b>Medical Conditions:</b>{" "}
          {(patient.medicalConditions || []).length
            ? patient.medicalConditions.join(", ")
            : "None"}
        </p>
      </div>

      {/* Prescription List */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          Prescriptions ({prescriptions.length})
        </h2>

        {prescriptions.length === 0 ? (
          <p className="text-gray-500">
            No prescriptions found.
          </p>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((p) => (
              <div
                key={p._id}
                className="border p-4 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                onClick={() =>
                  navigate(`/doctor/prescription/${p._id}`)
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {p.filename}
                    </div>
                    <div className="text-sm text-gray-500">
                      Status: {p.processingStatus}
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
