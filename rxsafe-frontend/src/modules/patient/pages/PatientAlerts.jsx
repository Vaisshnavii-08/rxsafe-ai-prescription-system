import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function PatientAlerts() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  /* ============================================
  ALERT COLOR BASED ON PRIORITY
  =========================================== */
  const getAlertStyles = (priority) => {
    if (!priority) return "border-blue-400 bg-blue-50 text-blue-700";

    const p = priority.toLowerCase();

    if (p.includes("critical"))
      return "border-red-500 bg-red-50 text-red-700";

    if (p.includes("high"))
      return "border-orange-500 bg-orange-50 text-orange-700";

    if (p.includes("moderate"))
      return "border-yellow-500 bg-yellow-50 text-yellow-700";

    return "border-green-500 bg-green-50 text-green-700";
  };

  /* ============================================
  LOAD ALERTS
  =========================================== */
  const loadAlerts = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/api/prescriptions/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.data?.success) {
        toast.error("Unable to load alerts");
        return;
      }

      const prescriptions = res.data.data || [];
      const collected = [];

      prescriptions.forEach((p) => {
        (p.alerts || []).forEach((alert) => {
          collected.push({
            ...alert,
            prescriptionId: p._id,
            createdAt: p.createdAt,
          });
        });
      });

      setAlerts(collected);
    } catch (err) {
      console.error(err);
      toast.error("Error loading alerts");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  /* ============================================
  OPEN PRESCRIPTION
  =========================================== */
  const openPrescription = (alert) => {
    if (!alert.prescriptionId) {
      toast.error("Prescription not available");
      return;
    }

    navigate(`/patient/prescription/${alert.prescriptionId}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">My Alerts</h1>

      {loading ? (
        <p>Loading alerts...</p>
      ) : alerts.length === 0 ? (
        <div className="bg-white p-6 border rounded-xl shadow">
          <p className="text-gray-600">No alerts found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, i) => {
            const styles = getAlertStyles(alert.priority);

            return (
              <div
                key={i}
                onClick={() => openPrescription(alert)}
                className={`p-4 border-l-4 rounded-xl shadow cursor-pointer hover:shadow-md transition ${styles}`}
              >
                <div className="flex justify-between">
                  <h2 className={`font-semibold ${styles}`}>
                    {alert.type || "Clinical Alert"}
                  </h2>
                  <span className="text-xs text-gray-500">
                    {alert.createdAt
                      ? new Date(alert.createdAt).toLocaleString()
                      : ""}
                  </span>
                </div>

                <p className="mt-1">{alert.description || alert.message}</p>

                {alert.drugsInvolved?.length > 0 && (
                  <p className="text-sm mt-2">
                    Medicines involved: <b>{alert.drugsInvolved.join(", ")}</b>
                  </p>
                )}

                {alert.priority && (
                  <p className="text-xs mt-2 font-medium">
                    Priority: {alert.priority}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
