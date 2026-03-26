import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import toast from "react-hot-toast";

export default function UpdateLocation() {
  const [loading, setLoading] = useState(false);

  const saveLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          await axios.patch(
            `${API_BASE_URL}/api/doctors/update-location`,
            { coordinates: [lng, lat] }
          );

          toast.success("Location updated");
        } catch (err) {
          console.error(err);
          toast.error("Failed to update location");
        } finally {
          setLoading(false);
        }
      },
      () => {
        toast.error("Failed to retrieve location");
        setLoading(false);
      }
    );
  };

  if (loading) {
    return <p className="p-6">Saving location…</p>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Update Location
      </h1>

      <button
        onClick={saveLocation}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
      >
        {loading ? "Saving..." : "Use My Current Location"}
      </button>
    </div>
  );
}
