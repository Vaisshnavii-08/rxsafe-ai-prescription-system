import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

const AdminDrugManagement = () => {
  const { token } = useAuth();

  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    category: "",
    minDose: "",
    maxDose: "",
  });

  const [editingId, setEditingId] = useState(null);

  /* ================= FETCH DRUGS ================= */

  const fetchDrugs = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/drug-lexicon`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDrugs(res.data.data || []);
    } catch (err) {
      console.error("Error fetching drugs", err);
      toast.error("Failed to load drug list");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchDrugs();
  }, [token]);

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      therapeuticClass: form.category,
      minDoseMg: form.minDose ? Number(form.minDose) : null,
      maxDoseMg: form.maxDose ? Number(form.maxDose) : null,
    };

    try {
      if (editingId) {
        await axios.put(
          `${API_BASE_URL}/api/drug-lexicon/${editingId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toast.success("Drug updated");
      } else {
        await axios.post(
          `${API_BASE_URL}/api/drug-lexicon`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toast.success("Drug added");
      }

      setForm({
        name: "",
        category: "",
        minDose: "",
        maxDose: "",
      });

      setEditingId(null);
      fetchDrugs();
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (drug) => {
    setEditingId(drug._id);

    setForm({
      name: drug.name || "",
      category: drug.therapeuticClass || "",
      minDose: drug.minDoseMg || "",
      maxDose: drug.maxDoseMg || "",
    });
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this drug?")) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/api/drug-lexicon/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Drug deleted");

      fetchDrugs();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Drug Lexicon Management
      </h1>

      {/* ================= FORM ================= */}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow mb-10 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Drug" : "Add New Drug"}
        </h2>

        <input
          type="text"
          placeholder="Drug Name"
          className="w-full p-3 border rounded"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Therapeutic Class / Category"
          className="w-full p-3 border rounded"
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value })
          }
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Min Dose (mg)"
            className="p-3 border rounded"
            value={form.minDose}
            onChange={(e) =>
              setForm({ ...form, minDose: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Max Dose (mg)"
            className="p-3 border rounded"
            value={form.maxDose}
            onChange={(e) =>
              setForm({ ...form, maxDose: e.target.value })
            }
          />
        </div>

        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          {editingId ? "Save Changes" : "Add Drug"}
        </button>
      </form>

      {/* ================= TABLE ================= */}

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          All Drugs
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : drugs.length === 0 ? (
          <p>No drugs found</p>
        ) : (
          <table className="w-full border">
            <thead className="bg-gray-200 text-left">
              <tr>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Category</th>
                <th className="p-3 border">Min Dose</th>
                <th className="p-3 border">Max Dose</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>

            <tbody>
              {drugs.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">
                    {d.name}
                  </td>

                  <td className="p-3 border">
                    {d.therapeuticClass || "-"}
                  </td>

                  <td className="p-3 border">
                    {d.minDoseMg ? `${d.minDoseMg} mg` : "-"}
                  </td>

                  <td className="p-3 border">
                    {d.maxDoseMg ? `${d.maxDoseMg} mg` : "-"}
                  </td>

                  <td className="p-3 border space-x-2">
                    <button
                      onClick={() => handleEdit(d)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(d._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Delete
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
};

export default AdminDrugManagement;