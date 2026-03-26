import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function PrescriptionDetails() {
  const { id } = useParams();
  const [pres, setPres] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");

  const loadDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/prescriptions/${id}`);
      setPres(res.data.prescription);
      setNotes(res.data.prescription?.doctorNotes || "");
    } catch (err) {
      toast.error("Failed to load prescription");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/prescriptions/${id}/review`,
        { doctorNotes: notes }
      );

      toast.success("Review saved");
      loadDetails();
    } catch (err) {
      toast.error("Failed to save review");
      console.error(err);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  if (!pres) {
    return <p className="p-6 text-red-600">Prescription not found.</p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Prescription Details</h1>

      {/* Patient Info */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">
          Patient Information
        </h2>
        <p><strong>Name:</strong> {pres.patient?.name}</p>
        <p><strong>Email:</strong> {pres.patient?.email}</p>
        <p>
          <strong>Date:</strong>{" "}
          {new Date(pres.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Drug List */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">
          Drugs Detected
        </h2>
        {pres.drugsDetected?.length ? (
          <ul className="list-disc ml-5">
            {pres.drugsDetected.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : (
          <p>No drugs detected.</p>
        )}
      </div>

      {/* Interactions */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">
          Interactions
        </h2>
        {pres.interactionsDetected?.length ? (
          <ul className="list-disc ml-5">
            {pres.interactionsDetected.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        ) : (
          <p>No interactions found.</p>
        )}
      </div>

      {/* OCR */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">OCR Text</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {pres.ocrText || "No OCR available"}
        </pre>
      </div>

      {/* Uploaded file */}
      {pres.fileUrl && (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">
            Prescription File
          </h2>

          {pres.fileUrl.endsWith(".pdf") ? (
            <a
              href={pres.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              View PDF
            </a>
          ) : (
            <img
              src={pres.fileUrl}
              alt="Prescription"
              className="rounded max-w-md"
            />
          )}
        </div>
      )}

      {/* Review Notes */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold">
          Doctor Notes
        </h2>

        <textarea
          className="w-full p-3 border rounded mt-2"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={submitReview}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Save Review
        </button>
      </div>
    </div>
  );
}
