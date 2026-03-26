import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import AlertCard from "../../components/alerts/AlertCard";

export default function PatientPrescriptionDetails() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOCR, setShowOCR] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

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
          Prescription File
        </h2>

        {fileUrl && (

          <div className="flex gap-3">

            <button
              onClick={() => setShowViewer(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              View Prescription
            </button>

            <a
              href={`${API_BASE_URL}${fileUrl}`}
              download
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Download
            </a>

          </div>

        )}

      </div>

      {/* MODAL VIEWER */}

      {showViewer && (

        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">

          <div className="bg-white p-4 rounded-xl max-w-4xl w-full">

            <div className="flex justify-between mb-2">

              <h2 className="font-semibold">Prescription Viewer</h2>

              <button
                onClick={() => setShowViewer(false)}
                className="text-red-600 font-semibold"
              >
                Close
              </button>

            </div>

            {fileUrl.toLowerCase().endsWith(".pdf") ? (

              <iframe
                src={`${API_BASE_URL}${fileUrl}`}
                title="Prescription PDF"
                className="w-full h-[600px]"
              />

            ) : (

              <img
                src={`${API_BASE_URL}${fileUrl}`}
                alt="Prescription"
                className="max-h-[600px] mx-auto"
              />

            )}

          </div>

        </div>

      )}

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

      <div className="bg-white p-4 rounded-xl shadow space-y-3">

        <h2 className="text-red-600 font-semibold">
          Drug Interaction Alerts
        </h2>

        {alerts.length === 0 && (
          <p className="text-green-600">
            No harmful interactions detected
          </p>
        )}

        {alerts.map((alert, i) => (
          <AlertCard key={i} alert={alert} />
        ))}

      </div>

      {/* AI SUGGESTIONS */}

      <div className="bg-white p-4 rounded-xl shadow">

        <h2 className="font-semibold mb-2">
          AI Suggested Alternatives
        </h2>

        {!suggestions.length ? (

          <p className="text-gray-500">
            No alternative medicines suggested.
          </p>

        ) : (

          suggestions.map((s, i) => (

            <div key={i} className="bg-blue-50 p-3 rounded mb-2">

              <b>{s.originalDrug}</b> → <b>{s.alternativeDrug}</b>

              {s.reason && (
                <p className="text-sm mt-1 text-gray-700">
                  {s.reason}
                </p>
              )}

            </div>

          ))

        )}

      </div>

      {/* AI EXPLANATION */}

      {aiAnalysis && (

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">

          <h2 className="font-semibold mb-2 text-purple-700">
            AI Clinical Explanation
          </h2>

          <p className="text-gray-700 whitespace-pre-line">
            {aiAnalysis}
          </p>

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