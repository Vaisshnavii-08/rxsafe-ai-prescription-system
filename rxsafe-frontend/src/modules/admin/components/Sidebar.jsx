import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", path: "/admin-dashboard" },
    { name: "Drug Lexicon", path: "/admin/drugs" },
    { name: "Users", path: "/admin/users" },
    { name: "Prescriptions", path: "/admin/prescriptions" },
    { name: "Interactions", path: "/admin/interactions" },
    { name: "Bulk Import", path: "/admin/drugs/bulk" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <h2 className="text-2xl font-bold p-6 border-b">Admin Panel</h2>

      <nav className="flex-1 p-4 space-y-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg ${
                isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="m-4 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
