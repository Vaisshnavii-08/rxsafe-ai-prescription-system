import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function DoctorProfile() {

  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const loadProfile = async () => {

    if (!token) {
      navigate("/login");
      return;
    }

    try {

      const res = await axios.get(
        `${API_BASE_URL}/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        setDoctor(res.data.data);
      } else {
        toast.error("Unable to load profile");
      }

    } catch (err) {
      console.error(err);
      toast.error("Error fetching doctor profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return <p className="p-6 text-center">Loading profile...</p>;
  }

  if (!doctor) {
    return (
      <p className="p-6 text-center text-red-600">
        Profile not found.
      </p>
    );
  }

  const specialtiesText =
    (doctor.specialties || [])
      .map((s) => (typeof s === "string" ? s : s?.name))
      .join(", ") || "Not specified";

  return (

    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold text-gray-800">
        Doctor Profile
      </h1>

      {/* PROFILE CARD */}

      <div className="bg-white shadow rounded-xl p-6 space-y-4">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-xl font-semibold">
              {doctor.name}
            </h2>

            <p className="text-gray-600">
              {doctor.email}
            </p>
          </div>

          <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700">
            Doctor
          </span>

        </div>

        <hr />

        {/* SPECIALTIES */}

        <div>
          <p className="font-medium text-gray-700">
            Specialties
          </p>
          <p className="text-gray-600">
            {specialtiesText}
          </p>
        </div>

        {/* AVAILABILITY */}

        <div>
          <p className="font-medium text-gray-700">
            Availability
          </p>

          {doctor.availability ? (
            <p className="text-gray-600">
              {doctor.availability.start} – {doctor.availability.end}

              {doctor.availability.days?.length > 0 && (
                <>
                  {" "}({doctor.availability.days.join(", ")})
                </>
              )}
            </p>
          ) : (
            <p className="text-gray-500">
              Availability not set
            </p>
          )}

        </div>

        {/* LOCATION */}

        <div>
          <p className="font-medium text-gray-700">
            Clinic Location
          </p>

          {doctor.location?.coordinates ? (

            <p className="text-gray-600">
              Latitude: {doctor.location.coordinates[1]} <br />
              Longitude: {doctor.location.coordinates[0]}
            </p>

          ) : (

            <p className="text-gray-500">
              Location not updated
            </p>

          )}
        </div>

        {/* ACCOUNT INFO */}

        <div>
          <p className="font-medium text-gray-700">
            Account Information
          </p>

          <p className="text-gray-600">
            Role: {doctor.role}
          </p>

          <p className="text-gray-600">
            Member Since: {doctor.createdAt
              ? new Date(doctor.createdAt).toLocaleDateString()
              : "—"}
          </p>

        </div>

      </div>

    </div>
  );
}