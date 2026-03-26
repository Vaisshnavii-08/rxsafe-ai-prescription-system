import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Users,
  ClipboardList,
  FilePlus,
  FileText,
  MapPin,
  UserCog,
  Stethoscope,
} from "lucide-react";

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    prescriptions: 0,
    reviews: 0,
    reports: 0,
  });

  /* ===============================
     FETCH DASHBOARD STATS
  =============================== */
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/doctors/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data) {
        setStats({
          patients: res.data.totalPatients || 0,
          prescriptions: res.data.totalPrescriptions || 0,
          reviews: res.data.todayReviews || 0,
          reports: res.data.pendingReports || 0,
        });
      }
    } catch (err) {
      console.error("Failed to load doctor stats", err);
    }
  };

  /* ===============================
     LOAD STATS + LISTEN FOR REVIEW
  =============================== */
  useEffect(() => {
    fetchStats();

    const refreshDashboard = () => {
      fetchStats();
    };

    window.addEventListener("reviewUpdated", refreshDashboard);

    return () => {
      window.removeEventListener("reviewUpdated", refreshDashboard);
    };
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* PAGE TITLE */}
      <div className="mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
          Dashboard Overview
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Quick summary of your clinical activity
        </p>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          icon={<Users className="h-8 w-8" />}
          label="Assigned Patients"
          value={stats.patients}
        />
        <StatCard
          icon={<ClipboardList className="h-8 w-8" />}
          label="Total Prescriptions"
          value={stats.prescriptions}
        />
        <StatCard
          icon={<Stethoscope className="h-8 w-8" />}
          label="Today's Reviews"
          value={stats.reviews}
        />
        <StatCard
          icon={<FileText className="h-8 w-8" />}
          label="Pending Reports"
          value={stats.reports}
        />
      </div>

      {/* ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ActionCard
          icon={<Users className="h-12 w-12" />}
          title="My Patients"
          desc="View assigned patients and their medical history."
          to="/doctor/patients"
        />
        <ActionCard
          icon={<ClipboardList className="h-12 w-12" />}
          title="Patient Prescriptions"
          desc="Review prescriptions assigned to you."
          to="/doctor/assigned-prescriptions"
        />
        <ActionCard
          icon={<FilePlus className="h-12 w-12" />}
          title="Upload Prescription"
          desc="Upload and process prescriptions using AI OCR."
          to="/doctor/upload"
        />
        <ActionCard
          icon={<FileText className="h-12 w-12" />}
          title="My Prescriptions"
          desc="View prescriptions uploaded by you."
          to="/doctor/prescriptions"
        />
        <ActionCard
          icon={<MapPin className="h-12 w-12" />}
          title="Update Location"
          desc="Update your clinic or hospital location."
          to="/doctor/update-location"
        />
        <ActionCard
          icon={<UserCog className="h-12 w-12" />}
          title="My Profile"
          desc="View and manage your doctor profile."
          to="/doctor/profile"
        />
      </div>
    </div>
  );
}

/* ---------- SHARED COMPONENTS ---------- */

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const ActionCard = ({ icon, title, desc, to }) => (
  <Link
    to={to}
    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100
               hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
    <p className="text-gray-600 text-[15px]">{desc}</p>
  </Link>
);