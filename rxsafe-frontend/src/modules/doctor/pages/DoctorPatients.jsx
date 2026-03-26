import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadPatients = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_BASE_URL}/api/doctors/my-patients`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.success) {
        setPatients(res.data.data || []);
      } else {
        setPatients([]);
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to load assigned patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Assigned Patients
      </h1>

      <div className="bg-white p-6 rounded-xl shadow">
        {patients.length === 0 ? (
          <p>No patients assigned yet.</p>
        ) : (
          <table className="w-full border rounded-lg overflow-hidden">
            <thead className="bg-gray-200 text-left">
              <tr>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Age</th>
                <th className="p-3 border">Weight</th>
                <th className="p-3 border">Medical Conditions</th>
                <th className="p-3 border text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((p) => (
                <tr
                  key={p._id}
                  className="hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/doctor/patient/${p._id}`)}
                >
                  <td className="p-3 border">{p.name}</td>
                  <td className="p-3 border">{p.email}</td>
                  <td className="p-3 border">{p.age || "N/A"}</td>
                  <td className="p-3 border">
                    {p.weightKg ? `${p.weightKg} kg` : "N/A"}
                  </td>
                  <td className="p-3 border">
                    {(p.medicalConditions || []).length
                      ? p.medicalConditions.join(", ")
                      : "None"}
                  </td>

                  <td className="p-3 border text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/doctor/patient/${p._id}`);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      View Prescriptions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>
    </div>
  );
}