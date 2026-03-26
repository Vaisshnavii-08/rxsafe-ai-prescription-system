import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  History,
  Stethoscope,
  FileText,
  User,
  LogOut,
  Activity
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Wait for auth load
  if (loading) return null;

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';

  const patientNav = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'History', icon: History },
    { path: '/find-doctors', label: 'Find Doctors', icon: Stethoscope },
  ];

  const doctorNav = [
    { path: '/doctor-dashboard', label: 'Prescriptions', icon: FileText },
  ];

  const navItems = isPatient ? patientNav : doctorNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    // Allows /history/abc or /dashboard/stats
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30 pt-16">
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActiveRoute(item.path)
                    ? 'bg-medical-lightBlue text-medical-blue font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-40 md:left-64">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-medical-blue to-medical-accent rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RxSafe</h1>
                <p className="text-xs text-gray-500">Prescription Safety System</p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-medical-lightBlue rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-medical-blue" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-20 px-6 pb-10">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
