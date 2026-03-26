import React, { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiUser,
  FiHome,
  FiUpload,
  FiBell,
  FiSearch,
  FiFileText,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function PatientLayout() {
  const navigate = useNavigate();
  const { logout: authLogout, user } = useAuth();
  const [open, setOpen] = useState(false);

  const logout = () => {
    authLogout();          // clear context + axios
    navigate("/login");    // force redirect
  };

  const menuItems = [
    { name: "Dashboard", path: "/patient/dashboard", icon: <FiHome /> },
    { name: "Upload Prescription", path: "/patient/upload", icon: <FiUpload /> },
    { name: "My Prescriptions", path: "/patient/prescriptions", icon: <FiFileText /> },
    { name: "Alerts", path: "/patient/alerts", icon: <FiBell /> },
    { name: "Nearby Doctors", path: "/patient/nearby-doctors", icon: <FiSearch /> },
    { name: "My Profile", path: "/patient/profile", icon: <FiUser /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <div
        className={`
          fixed md:static z-30 bg-white shadow-xl h-screen w-64 
          flex flex-col justify-between 
          border-r border-gray-200 px-4 py-4
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-64 md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow">
              {user?.name?.[0] || "U"}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                {user?.name || "Patient"}
              </p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Menu */}
          <nav className="mt-4 flex flex-col space-y-1.5">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded-lg font-medium transition-all
                   ${
                     isActive
                       ? "bg-blue-600 text-white shadow-md"
                       : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                   }`
                }
                onClick={() => setOpen(false)}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-3
                       bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      {/* MOBILE TOGGLE */}
      <button
        className="md:hidden fixed top-4 right-4 z-40 bg-blue-600 text-white p-2 rounded-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <FiX /> : <FiMenu />}
      </button>

      {/* MAIN CONTENT */}
      <div className="flex-1 px-6 pt-4 pb-8 md:ml-0">
  <Outlet />
</div>

    </div>
  );
}
