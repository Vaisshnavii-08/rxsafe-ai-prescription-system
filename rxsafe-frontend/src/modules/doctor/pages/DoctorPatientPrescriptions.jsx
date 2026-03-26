import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../../context/AuthContext";

export default function DoctorPatientPrescriptions() {

  const { patientId } = useParams();

  const [prescriptions, setPrescriptions] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPrescriptions = async () => {
    try {

      const token = localStorage.getItem("token"); // FIXED

      const res = await axios.get(
        `${API_BASE_URL}/api/prescriptions/doctor/${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.data.success) {
        toast.error("Could not load prescriptions");
        return;
      }

      const data = res.data.data || [];

      setPrescriptions(data);
      setPatient(data?.[0]?.patient || null);

    } catch (err) {
      console.error("Prescription load error:", err);
      toast.error("Error loading prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadPrescriptions();
    }
  }, [patientId]);

  if (loading) {
    return (
      <p className="p-6 text-center">Loading...</p>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">
          Patient Prescriptions
        </h1>

        {patient && (
          <p className="text-gray-600 mt-1">
            <b>Patient:</b> {patient.name} ({patient.email})
          </p>
        )}
      </div>

      {/* PRESCRIPTION TABLE */}
      <div className="bg-white p-6 rounded-xl shadow">

        {prescriptions.length === 0 ? (
          <p>No prescriptions found for this patient.</p>
        ) : (

          <table className="w-full border">

            <thead className="bg-gray-200 text-left">
              <tr>
                <th className="p-2 border">Uploaded By</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Severity</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>

            <tbody>
              {prescriptions.map((rx) => {

                const score = rx.severityScore || 0;

                return (
                  <tr key={rx._id} className="hover:bg-gray-50">

                    <td className="p-2 border">
                      {rx.uploader?.name || "—"}
                    </td>

                    <td className="p-2 border">
                      {rx.createdAt
                        ? new Date(rx.createdAt).toLocaleString()
                        : "—"}
                    </td>

                    <td className="p-2 border">
                      {score > 70 ? (
                        <span className="text-red-600 font-bold">
                          High
                        </span>
                      ) : score > 40 ? (
                        <span className="text-yellow-600 font-bold">
                          Moderate
                        </span>
                      ) : (
                        <span className="text-green-700 font-bold">
                          Low
                        </span>
                      )}
                    </td>

                    <td className="p-2 border">
                      <Link
                        to={`/doctor/prescriptions/${rx._id}`}  // FIXED
                        className="text-blue-600 hover:underline font-medium"
                      >
                        View Details →
                      </Link>
                    </td>

                  </tr>
                );

              })}
            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}