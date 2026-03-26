import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE_URL, useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminPrescriptions() {

  const { token } = useAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH PRESCRIPTIONS ================= */

  const fetchPrescriptions = async () => {
    try {

      const res = await axios.get(
        `${API_BASE_URL}/api/prescriptions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPrescriptions(res.data.data || []);

    } catch (err) {

      console.error(err);
      toast.error("Failed to load prescriptions");

    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  /* ================= UI ================= */

  return (
    <div>

      <h1 className="text-3xl font-bold mb-6">
        All Prescriptions
      </h1>

      <div className="bg-white shadow rounded-xl p-6">

        {loading ? (

          <p>Loading...</p>

        ) : prescriptions.length === 0 ? (

          <p>No prescriptions found.</p>

        ) : (

          <table className="w-full border">

            <thead className="bg-gray-200 text-left">

              <tr>
                <th className="p-3 border">ID</th>
                <th className="p-3 border">Patient</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border">Created</th>
              </tr>

            </thead>

            <tbody>

              {prescriptions.map((p) => (

                <tr key={p._id} className="hover:bg-gray-50">

                  {/* CLICKABLE ID */}

                  <td className="p-3 border text-blue-600 underline">

                    <Link to={`/admin/prescriptions/${p._id}`}>
                      {p._id}
                    </Link>

                  </td>

                  <td className="p-3 border">
                    {p.patient?.name || "Unknown"}
                  </td>

                  <td className="p-3 border">
                    {p.processingStatus || "Processing"}
                  </td>

                  <td className="p-3 border">
                    {new Date(p.createdAt).toLocaleDateString()}
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