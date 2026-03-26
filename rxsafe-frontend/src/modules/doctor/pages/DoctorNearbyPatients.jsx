import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function DoctorNearbyPatients() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [specialty, setSpecialty] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);

  const [location, setLocation] = useState({
    lat: "",
    lng: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    // Auto detect location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          console.log("Unable to auto-detect location");
        }
      );
    }
  }, []);

  const fetchNearby = async () => {
    if (!location.lat || !location.lng) {
      toast.error("Please provide latitude and longitude");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/api/doctors/nearby?lat=${location.lat}&lng=${location.lng}&radiusKm=${radiusKm}&specialty=${specialty}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setPatients(res.data.data || []);
      } else {
        toast.error("Unable to fetch nearby patients");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching nearby patients");
    } finally {
      setLoading(false);
    }
  };

  const openPatient = (id) => {
    navigate(`/doctor/patient/${id}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Search Nearby Patients
      </h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="font-semibold text-lg">Search Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Latitude */}
          <div>
            <label className="font-medium">Latitude</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={location.lat}
              onChange={(e) =>
                setLocation({ ...location, lat: e.target.value })
              }
              placeholder="Enter latitude"
            />
          </div>

          {/* Longitude */}
          <div>
            <label className="font-medium">Longitude</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={location.lng}
              onChange={(e) =>
                setLocation({ ...location, lng: e.target.value })
              }
              placeholder="Enter longitude"
            />
          </div>

          {/* Specialty */}
          <div>
            <label className="font-medium">Specialty (optional)</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g., Cardiology"
            />
          </div>

          {/* Radius */}
          <div>
            <label className="font-medium">Radius (km)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              placeholder="10"
            />
          </div>
        </div>

        <button
          onClick={fetchNearby}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Results */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-lg font-semibold">Nearby Patients</h2>

        {loading && <p>Loading nearby patients...</p>}

        {!loading && patients.length === 0 && (
          <p className="text-gray-600">No nearby patients found.</p>
        )}

        {!loading &&
          patients.length > 0 &&
          patients.map((p) => (
            <div
              key={p._id}
              className="border p-4 rounded-lg flex justify-between items-center hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-600">
                  Distance: {p.distanceKm?.toFixed(2)} km
                </p>
                <p className="text-sm text-gray-600">
                  Age: {p.age || "N/A"}
                </p>
                {p.conditions?.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Conditions: {p.conditions.join(", ")}
                  </p>
                )}
              </div>

              <button
                onClick={() => openPatient(p._id)}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                View Details
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
