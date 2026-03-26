import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

/* ================= UI COMPONENTS (OUTSIDE) ================= */

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3 text-gray-800">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */

export default function PatientProfile() {

  const { user } = useAuth();

  const [profile, setProfile] = useState(user);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    age: user?.age || "",
    weightKg: user?.weightKg || "",
    allergies: user?.allergies?.join(", ") || "",
    medicalConditions: user?.medicalConditions?.join(", ") || ""
  });

  /* ================= INPUT CHANGE ================= */

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /* ================= SAVE PROFILE ================= */

  const saveProfile = async () => {

    try {

      const token = localStorage.getItem("token");

      const payload = {
        age: formData.age ? Number(formData.age) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        allergies: formData.allergies
          ? formData.allergies.split(",").map(a => a.trim()).filter(Boolean)
          : [],
        medicalConditions: formData.medicalConditions
          ? formData.medicalConditions.split(",").map(m => m.trim()).filter(Boolean)
          : []
      };

      const res = await axios.put(
        `${API_BASE_URL}/api/users/me`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {

        toast.success("Profile updated successfully");

        setProfile(res.data.data);

        setEditing(false);

      } else {

        toast.error("Failed to update profile");

      }

    } catch (err) {

      console.error(err);
      toast.error("Error updating profile");

    }
  };

  if (!profile) {
    return <div className="p-6 max-w-3xl mx-auto">Loading profile...</div>;
  }

  /* ================= RENDER ================= */

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-bold">My Profile</h1>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={saveProfile}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>

            <button
              onClick={() => setEditing(false)}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}

      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-8">

        <Section title="Basic Information">
          <Row label="Name" value={profile.name || "Not provided"} />
          <Row label="Email" value={profile.email || "Not provided"} />
          <Row label="Role" value={profile.role || "Patient"} />
        </Section>

        <Section title="Health Details">

          {editing ? (
            <>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter Age"
                className="w-full border rounded-lg p-2"
              />

              <input
                type="number"
                name="weightKg"
                value={formData.weightKg}
                onChange={handleChange}
                placeholder="Enter Weight"
                className="w-full border rounded-lg p-2"
              />
            </>
          ) : (
            <>
              <Row label="Age" value={profile.age || "Not provided"} />
              <Row
                label="Weight"
                value={profile.weightKg ? `${profile.weightKg} kg` : "Not provided"}
              />
            </>
          )}

        </Section>

        <Section title="Allergies">

          {editing ? (
            <input
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="Penicillin, Dust"
              className="w-full border rounded-lg p-2"
            />
          ) : (
            <p>
              {profile.allergies?.length
                ? profile.allergies.join(", ")
                : "No allergies recorded"}
            </p>
          )}

        </Section>

        <Section title="Medical Conditions">

          {editing ? (
            <input
              name="medicalConditions"
              value={formData.medicalConditions}
              onChange={handleChange}
              placeholder="Diabetes, Asthma"
              className="w-full border rounded-lg p-2"
            />
          ) : (
            <p>
              {profile.medicalConditions?.length
                ? profile.medicalConditions.join(", ")
                : "No medical conditions recorded"}
            </p>
          )}

        </Section>

      </div>

    </div>
  );
}