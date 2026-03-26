import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function PatientNearbyDoctors() {
  const navigate = useNavigate();

  const [loading, setLoading]     = useState(false);
  const [locating, setLocating]   = useState(false);
  const [doctors, setDoctors]     = useState([]);
  const [specialty, setSpecialty] = useState("");
  const [radiusKm, setRadiusKm]   = useState(10);
  const [coords, setCoords]       = useState({ lat: null, lng: null });

  /* ─── fetch using explicit coords (never reads stale state) ─── */
  const fetchDoctors = useCallback(
    async (lat, lng) => {
      if (!lat || !lng) {
        toast.error("Location required — allow access or enter manually.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) { navigate("/login"); return; }

      try {
        setLoading(true);

        const url =
          `${API_BASE_URL}/api/doctors/nearby` +
          `?lat=${lat}&lng=${lng}` +
          `&radiusKm=${radiusKm}` +
          `&specialty=${encodeURIComponent(specialty)}`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data?.success) { toast.error("Unable to fetch doctors"); return; }
        setDoctors(res.data.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Error fetching nearby doctors");
      } finally {
        setLoading(false);
      }
    },
    [radiusKm, specialty, navigate]
  );

  /* ─── detect location on mount ─── */
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setLocating(false);
        fetchDoctors(lat, lng);          // ✅ pass directly — no stale state
      },
      () => {
        setLocating(false);
        toast.error("Location access denied. Enter coordinates manually.");
      },
      { timeout: 10000 }
    );
  }, [fetchDoctors]);

  useEffect(() => {
    detectLocation();
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── manual search (uses current coords state) ─── */
  const handleSearch = () => {
    if (!coords.lat || !coords.lng) {
      toast.error("No location set. Allow GPS or enter coordinates.");
      return;
    }
    fetchDoctors(coords.lat, coords.lng);
  };

  const openDoctor = (id) => navigate(`/doctor/${id}`);

  const openMaps = (doctor) => {
    if (!doctor.location?.coordinates) { toast("Location not available"); return; }
    const [lng, lat] = doctor.location.coordinates;
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
  };

  const riskColor = (d) => {
    if (!d.availability) return "bg-gray-100 text-gray-500";
    return d.availability.status === "Available"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Find Nearby Doctors</h1>
          <p className="text-sm text-slate-500 mt-1">
            {coords.lat
              ? `📍 Using location: ${Number(coords.lat).toFixed(4)}, ${Number(coords.lng).toFixed(4)}`
              : locating
              ? "📡 Detecting your location..."
              : "⚠️ Location not set"}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Search Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
                Latitude
              </label>
              <input
                type="number"
                value={coords.lat ?? ""}
                onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value }))}
                placeholder="e.g. 12.9716"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
                Longitude
              </label>
              <input
                type="number"
                value={coords.lng ?? ""}
                onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value }))}
                placeholder="e.g. 77.5946"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
                Specialty
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Cardiology, Neurology…"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
                Radius (km)
              </label>
              <input
                type="number"
                value={radiusKm}
                min={1}
                max={100}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSearch}
              disabled={loading || locating}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Searching…" : "Search"}
            </button>

            <button
              onClick={detectLocation}
              disabled={locating}
              className="px-5 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition"
            >
              {locating ? "Detecting…" : "📡 Re-detect Location"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-700 mb-4">
            Nearby Doctors
            {doctors.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({doctors.length} found)
              </span>
            )}
          </h2>

          {locating ? (
            <p className="text-slate-500 text-sm">Detecting your location…</p>
          ) : loading ? (
            <p className="text-slate-500 text-sm">Searching for doctors nearby…</p>
          ) : doctors.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No doctors found. Try increasing the radius or changing the specialty.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {doctors.map((d) => (
                <div
                  key={d._id}
                  className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{d.name}</p>
                      <p className="text-sm text-slate-500">
                        {Array.isArray(d.specialties) && d.specialties.length
                          ? d.specialties.join(", ")
                          : "General Physician"}
                      </p>
                    </div>
                    {d.availability?.status && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${riskColor(d)}`}>
                        {d.availability.status}
                      </span>
                    )}
                  </div>

                  {d.distanceKm !== undefined && (
                    <p className="text-sm text-slate-600 mt-2">
                      📍 {Number(d.distanceKm).toFixed(2)} km away
                    </p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openDoctor(d._id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => openMaps(d)}
                      className="px-3 py-1.5 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition"
                    >
                      Open Maps
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}