import React, { useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DoctorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const notOnDashboard = location.pathname !== "/doctor/dashboard";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* TOP NAV */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow relative z-40">
        <h1 className="text-lg font-semibold">Doctor Portal</h1>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-800 rounded-lg hover:bg-blue-900 transition"
          >
            <span className="text-sm font-medium">
              {user?.name || "Doctor"}
            </span>
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt="profile"
              className="w-8 h-8 rounded-full"
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-gray-700 rounded-xl shadow-xl border z-50">
              <Link
                to="/doctor/profile"
                className="block px-4 py-3 text-sm hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                My Profile
              </Link>

              <Link
                to="/doctor/update-location"
                className="block px-4 py-3 text-sm hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                Update Location
              </Link>

              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                  navigate("/login");
                }}
                className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {notOnDashboard && (
        <div className="bg-white px-6 py-3 shadow-sm">
          <button
            onClick={() => navigate("/doctor/dashboard")}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Doctor Dashboard
          </button>
        </div>
      )}

      <main className="flex-grow p-6">
        <Outlet />
      </main>
    </div>
  );
}
