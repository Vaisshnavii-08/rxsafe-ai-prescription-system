import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function DoctorAssignedPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignedPrescriptions();
  }, []);

  const fetchAssignedPrescriptions = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/prescriptions/doctor/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPrescriptions(response.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load assigned prescriptions.");
      toast.error("Unable to fetch prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (id) => {
    navigate(`/doctor/prescription/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-3xl font-bold mb-4">
        Assigned Prescriptions
      </h1>

      {loading && (
        <p className="text-gray-600">Loading prescriptions...</p>
      )}

      {error && (
        <p className="text-red-600">{error}</p>
      )}

      {!loading && prescriptions.length === 0 && (
        <p className="text-gray-600">
          No prescriptions assigned yet.
        </p>
      )}

      {!loading && prescriptions.length > 0 && (
        <div className="bg-white shadow-md rounded p-4">

          <table className="w-full border-collapse">

            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Uploaded On</th>
                <th className="p-3 text-left">Medicines</th>
                <th className="p-3 text-left">Alerts</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {prescriptions.map((p) => (

                <tr key={p._id} className="border-b hover:bg-gray-50">

                  <td className="p-3">
                    {p.patient?.name || "Unknown Patient"}
                  </td>

                  <td className="p-3">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>

                  <td className="p-3">
                    {p.nlpResult?.extracted?.length || 0} medicines
                  </td>

                  <td className="p-3">
                    {p.alerts?.length > 0 ? (
                      <span className="text-red-600 font-semibold">
                        {p.alerts.length} alert(s)
                      </span>
                    ) : (
                      <span className="text-green-600">None</span>
                    )}
                  </td>

                  <td className="p-3">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => openDetails(p._id)}
                    >
                      View Details
                    </button>
                  </td>

                </tr>

              ))}
            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}