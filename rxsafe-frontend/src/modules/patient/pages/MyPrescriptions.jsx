import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import RiskBadge from "../../../components/RiskBadge";

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
const [loading, setLoading] = useState(true);
const [riskFilter, setRiskFilter] = useState("All");

  const navigate = useNavigate();

  const loadPrescriptions = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/api/prescriptions/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const sorted = (res.data.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setPrescriptions(sorted);
      } else {
        toast.error("Unable to load prescriptions");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching prescriptions");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Prescriptions</h1>

      <div className="mb-4">
  <label className="mr-2 font-medium">Filter:</label>

  <select
    value={riskFilter}
    onChange={(e) => setRiskFilter(e.target.value)}
    className="border px-3 py-1 rounded"
  >
    <option value="All">All</option>
    <option value="Safe">Safe</option>
    <option value="Low Risk">Low Risk</option>
    <option value="Moderate Risk">Moderate Risk</option>
    <option value="Critical Risk">Critical Risk</option>
  </select>
</div>

      {loading ? (
        <p>Loading...</p>
      ) : prescriptions.length === 0 ? (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <p className="text-gray-600">No prescriptions uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions
  .filter((p) => riskFilter === "All" || p.riskLevel === riskFilter)
  .map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/patient/prescription/${p._id}`)}
              className="p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex justify-between items-center">
                {/* LEFT SIDE */}
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">
                      {p.filename || "Prescription"}
                    </div>
                    <RiskBadge level={p.riskLevel} />
                  </div>

                  <div className="text-sm text-gray-600">
                    Status:{" "}
                    <span className="font-medium">{p.processingStatus}</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    Medicines: {p.extractedDrugs?.length || 0}
                  </div>

                  <div className="text-sm">
                    Alerts:{" "}
                    {p.alerts?.length > 0 ? (
                      <span className="text-red-600 font-semibold">
                        {p.alerts.length}
                      </span>
                    ) : (
                      <span className="text-green-600">None</span>
                    )}
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="text-right text-xs text-gray-500">
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleString()
                    : "—"}
                </div>
              </div>

              {/* SEVERITY SCORE */}
              {p.severityScore !== undefined && (
                <div className="mt-2 text-sm">
                  <b>Severity Score:</b>{" "}
                  <span
                    className={
                      p.severityScore >= 70
                        ? "text-red-600"
                        : p.severityScore >= 40
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {p.severityScore}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
