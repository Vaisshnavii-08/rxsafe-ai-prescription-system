import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";

export default function AssignedPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/doctor-dashboard/patients`);
      setPatients(res.data.patients || []);
    } catch (err) {
      toast.error("Failed to load patients");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h1 className="text-3xl font-bold mb-6">Assigned Patients</h1>

      {loading ? (
        <p>Loading...</p>
      ) : patients.length === 0 ? (
        <p>No assigned patients yet.</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Age</th>
              <th className="p-2 border">Weight</th>
              <th className="p-2 border">Medical Conditions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="p-2 border">{p.name}</td>
                <td className="p-2 border">{p.email}</td>
                <td className="p-2 border">{p.age || "-"}</td>
                <td className="p-2 border">
                  {p.weightKg ? `${p.weightKg} kg` : "-"}
                </td>
                <td className="p-2 border">
                  {(p.medicalConditions || []).length
                    ? p.medicalConditions.join(", ")
                    : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
