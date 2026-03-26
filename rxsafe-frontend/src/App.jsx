import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

/* ===================== PUBLIC ===================== */
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

/* ===================== PATIENT ===================== */
import PatientLayout from "./modules/patient/PatientLayout";
import PatientDashboard from "./modules/patient/pages/PatientDashboard";
import UploadPrescription from "./modules/patient/pages/UploadPrescription";
import MyPrescriptions from "./modules/patient/pages/MyPrescriptions";
import PatientPrescriptionDetails from "./modules/patient/pages/PatientPrescriptionDetails";
import PatientProfile from "./modules/patient/pages/PatientProfile";
import PatientAlerts from "./modules/patient/pages/PatientAlerts";
import PatientNearbyDoctors from "./modules/patient/pages/PatientNearbyDoctors";

/* ===================== DOCTOR ===================== */
import DoctorLayout from "./modules/doctor/DoctorLayout";
import DoctorDashboard from "./modules/doctor/pages/DoctorDashboard";
import DoctorPatients from "./modules/doctor/pages/DoctorPatients";
import AssignedPatients from "./modules/doctor/pages/AssignedPatients";
import DoctorPatientDetails from "./modules/doctor/pages/DoctorPatientDetails";
import DoctorAssignedPrescriptions from "./modules/doctor/pages/DoctorAssignedPrescriptions";
import DoctorPrescriptionDetails from "./modules/doctor/pages/DoctorPrescriptionDetails";
import DoctorPatientPrescriptions from "./modules/doctor/pages/DoctorPatientPrescriptions";
import DoctorUpdateLocation from "./modules/doctor/pages/DoctorUpdateLocation";
import DoctorProfile from "./modules/doctor/pages/DoctorProfile";
import DoctorUploadPrescription from "./modules/doctor/pages/DoctorUploadPrescription";
import DoctorMyPrescriptions from "./modules/doctor/pages/DoctorMyPrescriptions";

/* ===================== ADMIN ===================== */
import AdminLayout from "./modules/admin/AdminLayout";
import AdminDashboard from "./modules/admin/AdminDashboard";
import AdminDrugManagement from "./modules/admin/pages/AdminDrugManagement";
import AdminUsers from "./modules/admin/pages/AdminUsers";
import AdminPrescriptions from "./modules/admin/pages/AdminPrescriptions";
import AdminInteractions from "./modules/admin/pages/AdminInteractions";
import AdminDrugBulkImport from "./modules/admin/pages/AdminDrugBulkImport";
import AdminPrescriptionDetails from "./modules/admin/pages/AdminPrescriptionDetails";

/* ===================== PROTECTED ROUTE ===================== */
const ProtectedRoute = ({ allowedRole, children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* ===================== PUBLIC ROUTE ===================== */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
};

/* ===================== ROLE REDIRECT ===================== */
const RoleRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${user.role}/dashboard`} replace />;
};

/* ===================== APP ===================== */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />

        <Routes>
          {/* ---------- PUBLIC ---------- */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

          {/* ---------- ROOT ROLE REDIRECT ---------- */}
          <Route path="/" element={<RoleRedirect />} />

          {/* ---------- PATIENT ---------- */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRole="patient">
                <PatientLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="upload" element={<UploadPrescription />} />
            <Route path="prescriptions" element={<MyPrescriptions />} />
            <Route path="prescription/:id" element={<PatientPrescriptionDetails />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route path="alerts" element={<PatientAlerts />} />
            <Route path="nearby-doctors" element={<PatientNearbyDoctors />} />
          </Route>

          {/* ---------- DOCTOR ---------- */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="assigned-patients" element={<AssignedPatients />} />
            <Route path="patient/:patientId" element={<DoctorPatientDetails />} />
            <Route path="patient/:patientId/prescriptions" element={<DoctorPatientPrescriptions />} />
            <Route path="assigned-prescriptions" element={<DoctorAssignedPrescriptions />} />
            <Route path="prescriptions" element={<DoctorMyPrescriptions />} />
            <Route path="prescription/:id" element={<DoctorPrescriptionDetails />} />
            <Route path="upload" element={<DoctorUploadPrescription />} />
            <Route path="update-location" element={<DoctorUpdateLocation />} />
            <Route path="profile" element={<DoctorProfile />} />
          </Route>

          {/* ---------- ADMIN ---------- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="drugs" element={<AdminDrugManagement />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="prescriptions" element={<AdminPrescriptions />} />
            <Route path="prescriptions/:id" element={<AdminPrescriptionDetails />} />
            <Route path="interactions" element={<AdminInteractions />} />
            <Route path="drugs/bulk" element={<AdminDrugBulkImport />} />
          </Route>

          {/* ---------- FALLBACK ---------- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
