import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, useAuth } from "../../../context/AuthContext";
import {
  FileText,
  Bell,
  Stethoscope,
  HeartPulse,
  ClipboardList,
  Pill,
  Thermometer,
  Droplet,
  ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";

export default function PatientDashboard() {
  const { user } = useAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [recentPrescription, setRecentPrescription] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    moderate: 0,
    safe: 0
  });

  const healthTips = [
    "Drink 2–3 liters of water today to stay hydrated 💧",
    "A short 15-min walk can improve your BP levels 🚶‍♂️",
    "Avoid skipping medications — take them on time ⏰",
    "Eat more fruits and vegetables for a balanced diet 🥗"
  ];

  const randomTip =
    healthTips[Math.floor(Math.random() * healthTips.length)];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {

    try {

      const res = await axios.get(`${API_BASE_URL}/api/prescriptions/my`);

      const list = res.data?.data || [];

      setPrescriptions(list);
      setRecentPrescription(list[0] || null);

      const collectedAlerts = list.flatMap((p) => p.alerts || []);
      setAlerts(collectedAlerts);

      const normalized = list.map((p) => ({
        ...p,
        risk: (p.riskLevel || "").toLowerCase()
      }));

      setStats({
        total: list.length,
        critical: normalized.filter((p) => p.risk === "critical").length,
        moderate: normalized.filter((p) => p.risk === "moderate").length,
        safe: normalized.filter((p) => p.risk === "safe").length
      });

    } catch (err) {

      console.error(err);
      toast.error("Unable to load dashboard data");

    } finally {

      setLoading(false);

    }

  };

  if (loading) {
    return <>Loading dashboard...</>;
  }

  const prescriptionsCount = prescriptions.length;

  const lastCheckupDate = recentPrescription
    ? new Date(recentPrescription.createdAt).toLocaleDateString()
    : "—";

  return (

    <div className="p-6">

      {/* HEADER */}

      <div className="mb-5">

        <h1 className="text-4xl font-bold text-gray-900">
          Welcome Back, {user?.name?.split(" ")[0]} 👋
        </h1>

        <p className="text-gray-600">
          Your personalized clinical overview
        </p>

      </div>

      {/* RISK SUMMARY */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <StatCard label="Total Prescriptions" value={stats.total} color="bg-blue-50 text-blue-600" />

        <StatCard label="Critical Risk" value={stats.critical} color="bg-red-50 text-red-600" />

        <StatCard label="Moderate Risk" value={stats.moderate} color="bg-orange-50 text-orange-600" />

        <StatCard label="Safe" value={stats.safe} color="bg-green-50 text-green-600" />

      </div>

      {/* MINI STATS */}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">

        <MiniStat icon={<Pill />} label="Prescriptions" value={prescriptionsCount} />

        <MiniStat icon={<Thermometer />} label="Last Upload" value={lastCheckupDate} />

        <MiniStat icon={<Droplet />} label="Hydration" value="Normal" />

      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <EnhancedCard icon={<FileText />} title="Recent Prescription">

          {!recentPrescription ? (
            <p className="text-gray-500">
              You have not uploaded any prescriptions yet.
            </p>
          ) : (
            <p>
              <span className="font-medium">Uploaded:</span>{" "}
              {lastCheckupDate}
            </p>
          )}

        </EnhancedCard>

        {/* ALERT SUMMARY */}

        <EnhancedCard icon={<Bell />} title="Safety Alerts">

          {alerts.length === 0 ? (
            <p className="text-green-600">No alerts detected.</p>
          ) : (

            <div className="space-y-2">

              <p className="font-medium text-red-600 flex items-center gap-2">
                <ShieldAlert size={18} />
                {alerts.length} clinical alerts detected
              </p>

              <p className="text-sm text-gray-600">
                Review prescriptions for potential drug interactions.
              </p>

            </div>

          )}

        </EnhancedCard>

        <EnhancedCard icon={<Stethoscope />} title="Health Summary">

          <ul className="space-y-2 text-gray-700">
            <li>• Prescriptions monitored</li>
            <li>• Alerts generated when required</li>
            <li>• Clinical review supported</li>
          </ul>

        </EnhancedCard>

      </div>

      {/* SECOND ROW */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 pb-6">

        <EnhancedCard icon={<HeartPulse />} title="Medication Adherence">

          <div className="flex items-center gap-6">

            <CircularProgress value={85} />

            <p className="text-gray-700">
              You are following your medication schedule well.
            </p>

          </div>

        </EnhancedCard>

        <EnhancedCard icon={<ClipboardList />} title="Recent Activity">

          <ul className="space-y-3 text-gray-600">
            <li>• Logged in today</li>
            <li>• Viewed dashboard</li>
          </ul>

        </EnhancedCard>

        <EnhancedCard icon={<Stethoscope />} title="Daily Health Tip">

          <p className="text-gray-700">{randomTip}</p>

        </EnhancedCard>

      </div>

    </div>

  );
}

/* COMPONENTS */

const StatCard = ({ label, value, color }) => (
  <div className={`p-4 rounded-xl ${color}`}>
    <div className="text-sm font-medium">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const MiniStat = ({ icon, label, value }) => (
  <div className="p-4 bg-white rounded-xl shadow-sm flex items-center gap-3">
    <div className="p-2 rounded-full bg-blue-50 text-blue-600">{icon}</div>
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  </div>
);

const EnhancedCard = ({ icon, title, children }) => (
  <div className="p-5 bg-white rounded-xl shadow-sm border">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-full bg-blue-50 text-blue-600">{icon}</div>
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
    </div>
    <div>{children}</div>
  </div>
);

const CircularProgress = ({ value }) => (
  <div className="relative w-20 h-20">
    <svg className="w-20 h-20" viewBox="0 0 36 36">
      <path stroke="currentColor" strokeWidth="4" fill="none"
        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831
           a 15.9155 15.9155 0 0 1 0 -31.831" />
      <path stroke="currentColor" strokeWidth="4"
        strokeDasharray={`${value}, 100`} strokeLinecap="round"
        fill="none"
        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831
           a 15.9155 15.9155 0 0 1 0 -31.831" />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center font-semibold">
      {value}%
    </div>
  </div>
);