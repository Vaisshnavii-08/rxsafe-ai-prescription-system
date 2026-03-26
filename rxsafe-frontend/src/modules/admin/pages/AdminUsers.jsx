import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

const AdminUsers = () => {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH USERS ================= */

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(res.data.data || []);
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error("Failed to load users");
      setUsers([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= DELETE USER ================= */

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/api/admin/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("User deleted");

      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    }
  };

  const roleBadge = (role) => {
    if (role === "admin")
      return "bg-purple-100 text-purple-700";
    if (role === "doctor")
      return "bg-blue-100 text-blue-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div>

      <h1 className="text-3xl font-bold mb-6">
        User Management
      </h1>

      <div className="bg-white p-6 rounded-xl shadow border">

        {loading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">No users found</p>
        ) : (

          <table className="w-full">

            <thead className="border-b bg-gray-100 text-sm">

              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-right">Action</th>
              </tr>

            </thead>

            <tbody>

              {users.map((u) => (

                <tr
                  key={u._id}
                  className="border-b hover:bg-gray-50"
                >

                  <td className="p-3 font-medium">
                    {u.name}
                  </td>

                  <td className="p-3 text-gray-600">
                    {u.email}
                  </td>

                  <td className="p-3">

                    <span
                      className={`px-2 py-1 text-xs rounded ${roleBadge(
                        u.role
                      )}`}
                    >
                      {u.role}
                    </span>

                  </td>

                  <td className="p-3 text-gray-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3 text-right">

                    {u.role !== "admin" && (
                      <button
                        onClick={() => deleteUser(u._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
};

export default AdminUsers;