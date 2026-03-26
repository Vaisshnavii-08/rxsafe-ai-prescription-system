import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";

const severityColors = {
  major: "bg-red-50 border-red-400 text-red-700",
  moderate: "bg-yellow-50 border-yellow-400 text-yellow-700",
  minor: "bg-orange-50 border-orange-400 text-orange-700"
};

export default function DoctorPrescriptionDetails() {

  const { id } = useParams();

  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviewStatus, setReviewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  const loadPrescription = async () => {
    try {

      const res = await axios.get(
        `${API_BASE_URL}/api/prescriptions/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data?.data || null;

      setPrescription(data);
      setReviewStatus(data?.doctorReviewStatus || "");
      setNotes(data?.doctorNotes || "");

    } catch (err) {
      console.error(err);
      toast.error("Error loading prescription");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {

      const response = await axios.get(
        `${API_BASE_URL}/api/prescriptions/${id}/report`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob"
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "prescription-report.pdf");

      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch {
      toast.error("Failed to download report");
    }
  };

  const submitReview = async () => {

    if (!reviewStatus) {
      toast.error("Select review status");
      return;
    }

    try {

      setSubmitting(true);

      await axios.put(
        `${API_BASE_URL}/api/prescriptions/${id}/review`,
        {
          doctorReviewStatus: reviewStatus,
          doctorNotes: notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Review submitted");
      loadPrescription();

    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadPrescription();
  }, []);

  if (loading) return <p className="p-6 text-center">Loading...</p>;
  if (!prescription) return <p className="p-6 text-center text-red-600">Prescription not found</p>;

  const patient = prescription.patient || {};
  const uploader = prescription.uploader || {};

  const alerts = prescription.alerts || [];
  const suggestions = prescription.suggestions || [];
  const aiAnalysis = prescription.aiAnalysis;

  const severityScore = prescription.severityScore || 0;

  const getRiskBarColor = () => {

    if (severityScore >= 75) return "bg-red-500";
    if (severityScore >= 50) return "bg-yellow-500";
    if (severityScore > 0) return "bg-orange-400";
    return "bg-green-500";

  };

  return (

    <div className="p-6 max-w-4xl mx-auto space-y-8">

      {/* HEADER */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-2xl font-semibold mb-3">
          Prescription Details
        </h2>

        <p><b>Filename:</b> {prescription.originalFilename || prescription.filename}</p>
        <p><b>Uploaded By:</b> {uploader.name || "Unknown"}</p>

        <p>
          <b>Date:</b>{" "}
          {prescription.createdAt
            ? new Date(prescription.createdAt).toLocaleString()
            : "—"}
        </p>

        {prescription.fileUrl && (
          <a
            href={API_BASE_URL + prescription.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            View Prescription File
          </a>
        )}

        <button
          onClick={downloadReport}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        >
          Download Safety Report
        </button>

      </div>

      {/* AI RISK METER */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h3 className="text-xl font-semibold mb-3">
          AI Prescription Risk
        </h3>

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

      {/* PATIENT INFO */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h3 className="text-xl font-semibold mb-3">Patient</h3>

        <p><b>Name:</b> {patient.name || "—"}</p>
        <p><b>Email:</b> {patient.email || "—"}</p>
        <p><b>Age:</b> {patient.age || "—"}</p>

      </div>

      {/* ALERTS */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h3 className="text-xl font-semibold mb-3">
          Alerts ({alerts.length})
        </h3>

        {alerts.length === 0 && (
          <p className="text-green-600">No alerts detected</p>
        )}

        {alerts.map((alert, i) => {

          const sev = alert.severityLabel?.toLowerCase() || "minor";

          return (
            <div key={i} className={`p-4 border rounded mb-3 ${severityColors[sev]}`}>
              <p className="font-semibold">{alert.drugA} + {alert.drugB}</p>
              <p className="text-sm">{alert.description}</p>

              {alert.recommendedAction && (
                <p className="text-sm mt-1">
                  <b>Recommendation:</b> {alert.recommendedAction}
                </p>
              )}
            </div>
          );
        })}

      </div>

      {/* AI SUGGESTIONS */}

      <div className="bg-white p-4 rounded-xl shadow">

        <h2 className="font-semibold mb-2">
          AI Suggested Alternatives
        </h2>

        {suggestions.length === 0 ? (

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

      {/* REVIEW */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h3 className="text-xl font-semibold mb-3">
          Doctor Review
        </h3>

        <select
          value={reviewStatus}
          onChange={(e) => setReviewStatus(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Select Status</option>
          <option value="Safe">Safe</option>
          <option value="Needs Attention">Needs Attention</option>
          <option value="Critical">Critical</option>
        </select>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="border p-2 rounded w-full mt-3"
          placeholder="Doctor notes"
        />

        <button
          onClick={submitReview}
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-3"
        >
          Submit Review
        </button>

      </div>

    </div>

  );

}