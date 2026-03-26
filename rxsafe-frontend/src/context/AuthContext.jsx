import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// Backend URL
export const API_BASE_URL = "http://localhost:5001";

// ❌ REMOVE withCredentials (JWT-based auth)
// axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
const [token, setToken] = useState(null);
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [loading, setLoading] = useState(true);
  /* ======================================================
     INITIAL LOAD FROM LOCAL STORAGE
  ====================================================== */
  useEffect(() => {
   const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("token");

if (storedUser && storedToken) {
  try {
    const parsedUser = JSON.parse(storedUser);

    setUser(parsedUser);
    setToken(storedToken);
    setIsAuthenticated(true);

    axios.defaults.headers.common["Authorization"] =
      `Bearer ${storedToken}`;
      } catch (err) {
        console.error("Auth restore failed:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  /* ======================================================
     LOGIN
  ====================================================== */
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      const { success, token, user } = res.data;

      if (!success || !token || !user) {
        return { success: false, error: "Invalid server response" };
      }

      setUser(user);
      setIsAuthenticated(true);

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      setToken(token);

      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  /* ======================================================
     SIGNUP
  ====================================================== */
  const signup = async (formData) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/signup`,
        formData
      );

      const { success, token, user } = res.data;

      if (!success || !token || !user) {
        return { success: false, error: "Invalid server response" };
      }

      setUser(user);
      setIsAuthenticated(true);

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      setToken(token);

      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Signup failed",
      };
    }
  };

  /* ======================================================
     LOGOUT (HARD RESET)
  ====================================================== */
  const logout = () => {
    setUser(null);
setToken(null);
setIsAuthenticated(false);

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    delete axios.defaults.headers.common["Authorization"];

    // Force full reset (IMPORTANT)
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
  user,
  token,
  isAuthenticated,
  loading,
  login,
  signup,
  logout,
  API_BASE_URL,
}}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
