import React from "react";
import { useAuth } from "../../../context/AuthContext";

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-medium">{user?.name}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
