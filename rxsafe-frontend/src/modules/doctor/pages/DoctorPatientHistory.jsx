import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";

export default function DoctorPatientHistory() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load history for this patient
  const loadHistory = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/prescriptions/doctor/${patientId}`
      );

      setPatient(res.data.patient || null);
      setPrescriptions(res.data.prescriptions || []);
    } catch (err) {
      console.error("Failed to load patient history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [patientId]);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  if (!patient) {
    return <p className="p-6 text-red-600">Patient not found.</p>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Patient Info */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-2">{patient.name}</h2>
        <p className="text-gray-600">{patient.email}</p>

        <div className="mt-2 text-sm text-gray-700">
          <p>Age: {patient.age || "N/A"}</p>
          <p>Weight: {patient.weightKg || "N/A"} kg</p>
          <p>
            Conditions:{" "}
            {patient.medicalConditions?.length
              ? patient.medicalConditions.join(", ")
              : "None"}
          </p>
        </div>
      </div>

      {/* Prescription List */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          Prescription Records
        </h2>

        {prescriptions.length === 0 ? (
          <p>No prescriptions found for this patient.</p>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-200 text-left">
              <tr>
                <th className="p-2 border">Drugs</th>
                <th className="p-2 border">Interactions</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {prescriptions.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="p-2 border">
                    {p.drugsDetected?.join(", ") || "None"}
                  </td>

                  <td className="p-2 border">
                    {p.interactionsDetected?.length || 0}
                  </td>

                  <td className="p-2 border">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>

                  <td className="p-2 border">
                    <Link
                      to={`/doctor/prescription/${p._id}`}
                      className="text-blue-600 underline"
                    >
                      View Full →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
