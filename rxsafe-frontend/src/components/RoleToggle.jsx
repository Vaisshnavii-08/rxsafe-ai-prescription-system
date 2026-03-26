import React from "react";

const RoleToggle = ({ role, setRole, onlyTwoRoles = false }) => {
  const roles = onlyTwoRoles
    ? ["patient", "doctor"]
    : ["patient", "doctor", "admin"];

  const roleIndex = roles.indexOf(role);

  return (
    <div className="relative w-full bg-gray-100 rounded-full p-1 flex items-center shadow-inner">
      
      {/* Sliding background */}
      <div
        className="absolute top-1 bottom-1 bg-blue-600 rounded-full transition-all duration-300"
        style={{
          width: `${100 / roles.length}%`,
          left: `${(100 / roles.length) * roleIndex}%`,
        }}
      ></div>

      {/* Buttons */}
      {roles.map((r, idx) => (
        <button
          key={r}
          type="button"
          onClick={() => setRole(r)}
          className={`flex-1 text-center py-2.5 text-sm font-semibold relative z-10 transition-all duration-300
            ${role === r ? "text-white" : "text-gray-600"}
          `}
        >
          {r.charAt(0).toUpperCase() + r.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default RoleToggle;
