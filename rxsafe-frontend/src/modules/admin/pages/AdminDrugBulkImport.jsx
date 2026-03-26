import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL, useAuth } from "../../../context/AuthContext";

const AdminDrugBulkImport = () => {
  const { token } = useAuth();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ================= FILE SELECT ================= */

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  /* ================= UPLOAD ================= */

const handleUpload = async () => {
  if (!file) {
    toast.error("Please select a JSON file");
    return;
  }

  try {
    setLoading(true);

    const text = await file.text();
    const json = JSON.parse(text);

    const res = await axios.post(
      `${API_BASE_URL}/api/admin/drugs/bulk`,
      json,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    toast.success(`Imported ${res.data.imported} drugs`);
  } catch (err) {
    console.error(err);
    toast.error("Import failed");
  }

  setLoading(false);
};

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Bulk Drug Import
      </h1>

      <div className="bg-white shadow rounded-xl p-6">

        <h2 className="text-lg font-semibold mb-4">
          Upload CSV or JSON File
        </h2>

        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileChange}
          className="mb-4"
        />

        <div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Uploading..." : "Import Drugs"}
          </button>

        </div>

      </div>
    </div>
  );
};

export default AdminDrugBulkImport;