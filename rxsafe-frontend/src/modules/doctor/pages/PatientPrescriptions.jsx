import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPrescriptions = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/doctor-dashboard/prescriptions`
      );

      setPrescriptions(res.data.prescriptions || []);
    } catch (err) {
      toast.error("Failed to load prescriptions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Assigned Prescriptions
      </h1>

      <div className="bg-white p-6 rounded-xl shadow">
        {prescriptions.length === 0 ? (
          <p>No assigned prescriptions yet.</p>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-200 text-left">
              <tr>
                <th className="p-2 border">Patient</th>
                <th className="p-2 border">Drugs Detected</th>
                <th className="p-2 border">Interactions</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>

            <tbody>
              {prescriptions.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="p-2 border">
                    {p.patient?.name}
                    <br />
                    <span className="text-sm text-gray-500">
                      {p.patient?.email}
                    </span>
                  </td>

                  <td className="p-2 border">
                    {p.drugsDetected?.length
                      ? p.drugsDetected.join(", ")
                      : "None"}
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
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      View Details →
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
