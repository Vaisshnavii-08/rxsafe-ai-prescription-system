import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

const severityClasses = {
  high: "bg-red-100 text-red-700 border-red-300",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-700 border-green-300",
};

export default function AdminPrescriptionDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescription();
  }, []);

  const loadPrescription = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_BASE_URL}/api/prescriptions/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setPrescription(res.data.data);
      } else {
        toast.error("Unable to fetch prescription");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error retrieving prescription");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!prescription) {
    return (
      <div className="p-6 text-center text-red-600">
        No data found.
      </div>
    );
  }

  const { nlpResult, alerts, suggestions } = prescription;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/admin/prescriptions")}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        ← Back to Prescriptions
      </button>

      <h1 className="text-2xl font-bold">
        Admin – Prescription Details
      </h1>

      {/* BASIC INFORMATION */}
      <section className="bg-white border rounded-lg shadow p-6 space-y-3">
        <h2 className="text-xl font-semibold mb-4">
          Basic Information
        </h2>

        <p>
          <b>Original Filename:</b>{" "}
          {prescription.originalFilename || "N/A"}
        </p>

        <p>
          <b>Stored Filename:</b> {prescription.filename}
        </p>

        {prescription.fileUrl && (
          <a
            href={`${API_BASE_URL}${prescription.fileUrl}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            Download File
          </a>
        )}

        <p>
          <b>Uploaded By:</b>{" "}
          {prescription.uploader?.name}
        </p>

        <p>
          <b>Patient:</b>{" "}
          {prescription.patient?.name}
        </p>

        <p>
          <b>Date:</b>{" "}
          {new Date(
            prescription.createdAt
          ).toLocaleString()}
        </p>

        <p>
          <b>Processing Status:</b>{" "}
          {prescription.processingStatus}
        </p>
      </section>

      {/* FILE PREVIEW */}
      {prescription.fileUrl && (
        <section className="bg-white border rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            File Preview
          </h2>

          {prescription.contentType ===
          "application/pdf" ? (
            <iframe
              src={`${API_BASE_URL}${prescription.fileUrl}`}
              className="w-full h-96 border rounded"
              title="PDF Preview"
            />
          ) : (
            <img
              src={`${API_BASE_URL}${prescription.fileUrl}`}
              alt="Prescription"
              className="max-w-full rounded shadow"
            />
          )}
        </section>
      )}

      {/* OCR RESULTS */}
      <section className="bg-white border rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          OCR Extracted Text
        </h2>

        <pre className="bg-gray-50 p-4 rounded whitespace-pre-wrap text-gray-700">
          {prescription.ocrText ||
            "No OCR text extracted"}
        </pre>
      </section>

      {/* EXTRACTED DRUGS */}
      <section className="bg-white border rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Extracted Drugs (
          {nlpResult?.extracted?.length || 0})
        </h2>

        {nlpResult?.extracted?.length === 0 ? (
          <p className="text-gray-500">
            No drugs detected.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nlpResult.extracted.map((drug, i) => (
              <div
                key={i}
                className="p-4 border rounded bg-gray-50"
              >
                <p>
                  <b>Name:</b> {drug.name}
                </p>

                <p>
                  <b>Dose:</b>{" "}
                  {drug.dose || "—"}
                </p>

                <p>
                  <b>Frequency:</b>{" "}
                  {drug.frequency || "—"}
                </p>

                <p>
                  <b>Route:</b>{" "}
                  {drug.route || "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ALERTS */}
      <section className="bg-white border rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Alerts ({alerts?.length || 0})
        </h2>

        {alerts?.length === 0 ? (
          <p className="text-gray-500">
            No alerts generated.
          </p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`p-4 border rounded ${
                  severityClasses[
                    alert.severity
                  ]
                }`}
              >
                <p>
                  <b>Drugs:</b>{" "}
                  {alert.drugs?.join(", ") ||
                    "—"}
                </p>

                <p>
                  <b>Severity:</b>{" "}
                  {alert.severity}
                </p>

                <p>
                  <b>Description:</b>{" "}
                  {alert.description}
                </p>

                <p>
                  <b>Score:</b>{" "}
                  {alert.score}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SUGGESTIONS */}
      <section className="bg-white border rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Suggestions (
          {suggestions?.length || 0})
        </h2>

        {suggestions?.length === 0 ? (
          <p className="text-gray-500">
            No suggestions.
          </p>
        ) : (
          <div className="space-y-4">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="p-4 border rounded bg-gray-50"
              >
                <p>
                  <b>Original Drug:</b>{" "}
                  {s.originalDrug || "—"}
                </p>

                <p>
                  <b>Alternative:</b>{" "}
                  {s.alternativeDrug || "—"}
                </p>

                <p>
                  <b>Reason:</b> {s.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}