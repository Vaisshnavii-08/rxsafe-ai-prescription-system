import React from "react";

const StatCard = ({ title, value }) => {
  return (
    <div className="bg-white shadow rounded-xl p-6 text-center">
      <h3 className="text-gray-600 text-md">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
};

export default StatCard;
