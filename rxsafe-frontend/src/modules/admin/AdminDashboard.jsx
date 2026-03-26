import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Users, FileText, Pill, Activity } from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="p-6 bg-white rounded-xl shadow border flex items-center gap-4 hover:shadow-lg transition">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  </div>
);

export default function AdminDashboard() {

  const { token } = useAuth();

  const [stats, setStats] = useState({
    users: 0,
    prescriptions: 0,
    drugs: 0,
    interactions: 0
  });

  const [riskData, setRiskData] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const loadDashboard = async () => {

      try {

        const res = await axios.get(
          `${API_BASE_URL}/api/admin/stats`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const data = res.data.data;

        setStats({
          users: data?.totalUsers || 0,
          prescriptions: data?.totalPrescriptions || 0,
          drugs: data?.totalLexicon || 0,
          interactions: data?.totalInteractions || 0
        });

        const chart = (data?.severityCounts || []).map((s) => ({
          name: s._id || "Unknown",
          value: s.count
        }));

        setRiskData(chart);

        const pres = await axios.get(
          `${API_BASE_URL}/api/admin/prescriptions`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setRecent(pres?.data?.data?.slice(0,5) || []);

      } catch (err) {

        console.error(err);
        toast.error("Failed to load dashboard");

      } finally {

        setLoading(false);

      }

    };

    loadDashboard();

  }, [token]);

  const getRiskBadge = (risk) => {

    if (!risk) return "bg-gray-100 text-gray-600";

    if (risk.toLowerCase().includes("safe"))
      return "bg-green-100 text-green-700";

    if (risk.toLowerCase().includes("moderate"))
      return "bg-yellow-100 text-yellow-700";

    if (risk.toLowerCase().includes("critical"))
      return "bg-red-100 text-red-700";

    return "bg-gray-100 text-gray-600";

  };

  if (loading) {
    return (
      <div className="text-gray-500 text-sm">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ================= STATS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatCard
          title="Total Users"
          value={stats.users}
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />

        <StatCard
          title="Prescriptions"
          value={stats.prescriptions}
          icon={FileText}
          color="bg-green-100 text-green-600"
        />

        <StatCard
          title="Drug Lexicon"
          value={stats.drugs}
          icon={Pill}
          color="bg-purple-100 text-purple-600"
        />

        <StatCard
          title="Interactions"
          value={stats.interactions}
          icon={Activity}
          color="bg-orange-100 text-orange-600"
        />

      </div>

      {/* ================= RISK ANALYTICS ================= */}

      <div className="bg-white p-6 rounded-xl shadow border">

        <h2 className="text-lg font-semibold mb-4">
          Prescription Risk Distribution
        </h2>

        {riskData.length === 0 ? (

          <div className="text-gray-500 text-sm">
            No risk data available yet.
          </div>

        ) : (

          <div style={{ width: "100%", height: 320 }}>

            <ResponsiveContainer>

              <PieChart>

                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >

                  {riskData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}

                </Pie>

                <Tooltip />
                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        )}

      </div>

      {/* ================= RECENT PRESCRIPTIONS ================= */}

      <div className="bg-white p-6 rounded-xl shadow border">

        <h2 className="text-lg font-semibold mb-4">
          Recent Prescriptions
        </h2>

        {recent.length === 0 ? (

          <div className="text-gray-500 text-sm">
            No prescriptions uploaded yet.
          </div>

        ) : (

          <div className="space-y-3">

            {recent.map((p) => (

              <div
                key={p._id}
                className="p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center transition"
              >

                <div>

                  <div className="font-medium">
                    {p.originalFilename || "Prescription"}
                  </div>

                  <div
                    className={`inline-block mt-1 px-2 py-1 text-xs rounded ${getRiskBadge(
                      p.riskLevel
                    )}`}
                  >
                    {p.riskLevel || "Safe"}
                  </div>

                </div>

                <div className="text-xs text-gray-400">
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}