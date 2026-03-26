import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../../context/AuthContext";
import { Link } from "react-router-dom";

export default function DoctorMyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyPrescriptions = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_BASE_URL}/api/prescriptions/doctor/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        setPrescriptions(res.data.data);
      } else {
        toast.error("Unable to load prescriptions");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyPrescriptions();
  }, []);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        My Prescriptions
      </h1>

      <div className="bg-white p-6 rounded-xl shadow">
        {prescriptions.length === 0 ? (
          <p>No prescriptions uploaded by you yet.</p>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 border">Patient</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Severity</th>
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
                    {new Date(p.createdAt).toLocaleString()}
                  </td>

                  <td className="p-2 border">
                    {p.severityScore > 70 ? (
                      <span className="text-red-600 font-semibold">High</span>
                    ) : p.severityScore > 40 ? (
                      <span className="text-yellow-600 font-semibold">
                        Moderate
                      </span>
                    ) : (
                      <span className="text-green-600 font-semibold">Low</span>
                    )}
                  </td>

                  <td className="p-2 border">
                    <Link
                      to={`/doctor/prescription/${p._id}`}
                      className="text-blue-600 underline"
                    >
                      View →
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
