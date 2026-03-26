import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";

const severityColors = {
  major: "bg-red-50 border-red-300 text-red-700",
  moderate: "bg-yellow-50 border-yellow-300 text-yellow-700",
  minor: "bg-green-50 border-green-300 text-green-700"
};

export default function PatientPrescriptionDetails() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOCR, setShowOCR] = useState(false);

  const loadPrescription = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_BASE_URL}/api/prescriptions/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPrescription(res.data?.data || null);

    } catch {
      toast.error("Failed to load prescription");
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    loadPrescription();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!prescription) return <div className="p-6">Prescription not found</div>;

  const {
    fileUrl,
    alerts = [],
    suggestions = [],
    riskLevel,
    severityScore = 0,
    ocrText,
    doctorNotes,
    aiAnalysis,
    nlpResult
  } = prescription;

  const extractedDrugs = nlpResult?.extracted || [];

  const getRiskColor = (level) => {

    switch (level) {

      case "Critical":
        return "bg-red-600";

      case "Moderate":
        return "bg-yellow-500 text-black";

      case "Low":
        return "bg-orange-400";

      default:
        return "bg-green-500";

    }

  };

  const getRiskBarColor = () => {

    if (severityScore >= 75) return "bg-red-500";
    if (severityScore >= 50) return "bg-yellow-500";
    if (severityScore > 0) return "bg-orange-400";
    return "bg-green-500";

  };

  return (

    <div className="max-w-4xl mx-auto p-6 space-y-6">

      <button
        onClick={() => navigate("/patient/prescriptions")}
        className="text-blue-600 underline text-sm"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold">
        Prescription Details
      </h1>

      {/* RISK SUMMARY */}

      <div className={`p-4 rounded-xl text-white ${getRiskColor(riskLevel)}`}>
        <h2 className="text-lg font-bold">{riskLevel}</h2>
        <p>Severity Score: {severityScore}</p>
      </div>

      {/* AI RISK METER */}

      <div className="bg-white p-4 rounded-xl shadow">

        <h2 className="font-semibold mb-2">
          AI Prescription Risk
        </h2>

        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">

          <div
            className={`${getRiskBarColor()} h-4 rounded-full`}
            style={{ width: `${severityScore}%` }}
          />

        </div>

        <p className="text-sm text-gray-600">
          Risk Score: {severityScore}/100
        </p>

      </div>

      {/* VIEW PRESCRIPTION */}

    
<div className="bg-white p-4 rounded-xl shadow">

  <h2 className="font-semibold mb-3">
    View Prescription
  </h2>

  {fileUrl ? (
    <a
      href={`${API_BASE_URL}${fileUrl}`}
      target="_blank"
      rel="noreferrer"
      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
    >
      Open Prescription
    </a>
  ) : (
    <p className="text-gray-500">
      Prescription file not available.
    </p>
  )}

</div>

      {/* DRUGS */}

      <div className="bg-white p-4 rounded-xl shadow">

        <h2 className="font-semibold mb-2">
          Medicines Detected
        </h2>

        <ul className="list-disc ml-6">

          {extractedDrugs.map((d, i) => (

            <li key={i}>
              <b>{d.name}</b> {d.dose ? `- ${d.dose}` : ""}
            </li>

          ))}

        </ul>

      </div>

      {/* ALERTS */}

      <div className="bg-white p-4 rounded-xl shadow">

        <h2 className="text-red-600 font-semibold mb-3">
          Drug Interaction Alerts
        </h2>

        {alerts.length === 0 && (

          <p className="text-green-600">
            No harmful interactions detected
          </p>

        )}

        {alerts.map((alert, i) => {

          const sev = alert.severity?.toLowerCase() || "minor";

          return (

            <div
              key={i}
              className={`p-3 border rounded mb-2 ${severityColors[sev]}`}
            >

              <p className="font-semibold">
                {(alert.drugs || []).join(" + ")}
              </p>

              <p className="text-sm">
                {alert.description}
              </p>

            </div>

          );

        })}

      </div>

      {/* AI SUGGESTIONS */}

      <div className="bg-white p-4 rounded-xl shadow">

        <h2 className="font-semibold mb-2">
          AI Suggested Alternatives
        </h2>

        {!suggestions || suggestions.length === 0 ? (

          <p className="text-gray-500">
            No alternative medicines suggested.
          </p>

        ) : (

          suggestions.map((s, i) => (

            <div key={i} className="bg-blue-50 p-3 rounded mb-2">

              <b>{s.originalDrug}</b>
              {" → "}
              <b>{s.alternativeDrug}</b>

              {s.reason && (

                <p className="text-sm mt-1 text-gray-700">
                  {s.reason}
                </p>

              )}

            </div>

          ))

        )}

      </div>

      {/* AI CLINICAL EXPLANATION */}

      {aiAnalysis && (

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">

          <h2 className="font-semibold mb-2 text-purple-700">
            AI Clinical Explanation
          </h2>

          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {aiAnalysis}
          </p>

        </div>

      )}

      {/* DOCTOR NOTES */}

      {doctorNotes && (

        <div className="bg-white p-4 rounded-xl shadow">

          <h2 className="font-semibold mb-1">
            Doctor Notes
          </h2>

          <p>{doctorNotes}</p>

        </div>

      )}

      {/* OCR */}

      <div className="bg-white p-4 rounded-xl shadow">

        <button
          onClick={() => setShowOCR(!showOCR)}
          className="text-blue-600 underline"
        >
          {showOCR ? "Hide OCR Text" : "Show OCR Text"}
        </button>

        {showOCR && (

          <pre className="bg-gray-100 p-3 rounded mt-2 text-sm whitespace-pre-wrap">
            {ocrText}
          </pre>

        )}

      </div>

    </div>

  );

}