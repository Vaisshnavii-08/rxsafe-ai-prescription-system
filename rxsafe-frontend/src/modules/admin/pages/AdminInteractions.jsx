import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminInteractions() {
  const { token } = useAuth();

  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInteractions = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/interactions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setInteractions(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load interactions");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Drug Interaction Records
      </h1>

      <div className="bg-white shadow rounded-xl p-6">

        {loading ? (
          <p>Loading...</p>
        ) : interactions.length === 0 ? (
          <p>No interactions logged yet</p>
        ) : (

          <table className="w-full border">

            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 border">Drug A</th>
                <th className="p-3 border">Drug B</th>
                <th className="p-3 border">Severity</th>
                <th className="p-3 border">Description</th>
              </tr>
            </thead>

            <tbody>

              {interactions.map((i) => (
                <tr key={i._id}>

                  <td className="p-3 border">{i.drugA}</td>

                  <td className="p-3 border">{i.drugB}</td>

                  <td className="p-3 border text-red-600 font-semibold">
                    {i.severityLabel}
                  </td>

                  <td className="p-3 border">{i.description}</td>

                </tr>
              ))}

            </tbody>

          </table>

        )}
      </div>
    </div>
  );
}