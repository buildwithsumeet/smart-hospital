import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ReceptionistDashboard } from './pages/receptionist/ReceptionistDashboard';
import { AccountantDashboard } from './pages/accountant/AccountantDashboard';
import { UserRole } from './types';

const RoleBasedHome: React.FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case UserRole.PATIENT:
      return <PatientDashboard />;
    case UserRole.DOCTOR:
      return <DoctorDashboard />;
    case UserRole.RECEPTIONIST:
      return <ReceptionistDashboard />;
    case UserRole.ACCOUNTANT:
      return <AccountantDashboard />;
    case UserRole.SUPER_ADMIN:
    case UserRole.HOSPITAL_ADMIN:
    default:
      return <AdminDashboard />;
  }
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<RoleBasedHome />} />

            {/* Patient Routes */}
            <Route path="book-appointment" element={<PatientDashboard />} />
            <Route path="my-appointments" element={<PatientDashboard />} />
            <Route path="invoices" element={<PatientDashboard />} />
            <Route path="profile" element={<PatientDashboard />} />

            {/* Doctor Routes */}
            <Route path="doctor-patients" element={<DoctorDashboard />} />
            <Route path="availability" element={<DoctorDashboard />} />

            {/* Receptionist Routes */}
            <Route path="register-patient" element={<ReceptionistDashboard />} />
            <Route path="schedule-appointment" element={<ReceptionistDashboard />} />
            <Route path="doctor-availability" element={<ReceptionistDashboard />} />

            {/* Accountant Routes */}
            <Route path="invoices-ledger" element={<AccountantDashboard />} />
            <Route path="payments" element={<AccountantDashboard />} />

            {/* Admin Routes */}
            <Route path="admin-doctors" element={<AdminDashboard />} />
            <Route path="admin-patients" element={<AdminDashboard />} />
            <Route path="admin-appointments" element={<AdminDashboard />} />
            <Route path="admin-financials" element={<AdminDashboard />} />
            <Route path="admin-system" element={<AdminDashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
