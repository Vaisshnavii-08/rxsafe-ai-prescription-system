import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Activity,
  Upload,
  LogOut,
} from "lucide-react";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Drug Lexicon", icon: BookOpen, path: "/admin/drugs" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Prescriptions", icon: FileText, path: "/admin/prescriptions" },
    { label: "Interactions", icon: Activity, path: "/admin/interactions" },
    { label: "Bulk Import", icon: Upload, path: "/admin/drugs/bulk" },
  ];

  const getPageTitle = () => {
    const item = menuItems.find((i) =>
      location.pathname.startsWith(i.path)
    );
    return item ? item.label : "Admin Dashboard";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ================= SIDEBAR ================= */}

      <aside className="w-64 bg-white border-r shadow-lg flex flex-col">

        {/* LOGO / BRAND */}

        <div className="px-6 py-5 border-b">
          <h2 className="text-xl font-bold text-blue-700">
            RxSafe Admin
          </h2>
          <p className="text-xs text-gray-500">
            Prescription Safety System
          </p>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 p-3 space-y-1">

          {menuItems.map((item) => {

            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${
                  active
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}

        </nav>

        {/* LOGOUT */}

        <div className="p-3 border-t">

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 w-full transition"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <div className="flex-1 flex flex-col">

        {/* HEADER */}

        <header className="bg-white border-b shadow-sm px-8 py-4 flex justify-between items-center">

          <h1 className="text-2xl font-bold text-gray-800">
            {getPageTitle()}
          </h1>

          {/* USER INFO */}

          <div className="flex items-center gap-3">

            <div className="text-right">
              <div className="font-semibold">{user?.name || "Admin"}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>

            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="flex-1 p-8 overflow-auto">

          <Outlet />

        </main>

      </div>

    </div>
  );
}