import React from "react";

export default function RiskBadge({ level }) {
if (!level) return null;

let color = "bg-gray-400";

if (level === "Critical Risk") color = "bg-red-500";
if (level === "Moderate Risk") color = "bg-orange-500";
if (level === "Low Risk") color = "bg-yellow-500";
if (level === "Safe") color = "bg-green-500";

return (
<span
className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${color}`}
>
{level} </span>
);
}
