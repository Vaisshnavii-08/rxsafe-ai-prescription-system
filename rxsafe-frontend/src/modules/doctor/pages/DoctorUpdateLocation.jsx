import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";

export default function DoctorUpdateLocation() {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const handleUpdate = async () => {
    if (!lat || !lng) {
      toast.error("Latitude and Longitude are required");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/doctors/update-location`,
        { lat, lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Location updated successfully!");
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating location");
    } finally {
      setLoading(false);
    }
  };

  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        toast.success("Location detected");
      },
      () => toast.error("Failed to get location")
    );
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Update My Location
      </h1>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        {/* Latitude */}
        <div>
          <label className="block text-sm font-medium mb-1">Latitude</label>
          <input
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Enter latitude"
          />
        </div>

        {/* Longitude */}
        <div>
          <label className="block text-sm font-medium mb-1">Longitude</label>
          <input
            type="number"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Enter longitude"
          />
        </div>

        {/* Auto Detect */}
        <button
          onClick={autoDetectLocation}
          className="w-full py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Auto Detect My Location
        </button>

        {/* Save */}
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {loading ? "Updating..." : "Save Location"}
        </button>
      </div>
    </div>
  );
}
