import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Calendar,
  Users,
  UserCheck,
  CreditCard,
  BarChart3,
  Stethoscope,
  Clock,
  ShieldCheck,
  FileText,
  UserPlus
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const getLinks = () => {
    switch (role) {
      case UserRole.PATIENT:
        return [
          { to: '/dashboard', label: 'My Overview', icon: Calendar },
          { to: '/book-appointment', label: 'Book Appointment', icon: Clock },
          { to: '/my-appointments', label: 'My Appointments', icon: Calendar },
          { to: '/invoices', label: 'Invoices & Payments', icon: CreditCard },
          { to: '/profile', label: 'Medical Profile', icon: FileText },
        ];

      case UserRole.DOCTOR:
        return [
          { to: '/dashboard', label: "Today's Schedule", icon: Calendar },
          { to: '/doctor-patients', label: 'Assigned Patients', icon: Users },
          { to: '/availability', label: 'Availability & Slots', icon: Clock },
        ];

      case UserRole.RECEPTIONIST:
        return [
          { to: '/dashboard', label: 'Check-In Desk', icon: UserCheck },
          { to: '/register-patient', label: 'Register Patient', icon: UserPlus },
          { to: '/schedule-appointment', label: 'Book on Behalf', icon: Calendar },
          { to: '/doctor-availability', label: 'Doctor Roster', icon: Stethoscope },
        ];

      case UserRole.ACCOUNTANT:
        return [
          { to: '/dashboard', label: 'Billing Overview', icon: BarChart3 },
          { to: '/invoices-ledger', label: 'Invoices Ledger', icon: CreditCard },
          { to: '/payments', label: 'Payment Records', icon: FileText },
        ];

      case UserRole.SUPER_ADMIN:
      case UserRole.HOSPITAL_ADMIN:
      default:
        return [
          { to: '/dashboard', label: 'Hospital Overview', icon: BarChart3 },
          { to: '/admin-doctors', label: 'Doctors & Departments', icon: Stethoscope },
          { to: '/admin-patients', label: 'Patient Directory', icon: Users },
          { to: '/admin-appointments', label: 'All Appointments', icon: Calendar },
          { to: '/admin-financials', label: 'Financial Analytics', icon: CreditCard },
          { to: '/admin-system', label: 'System & RBAC', icon: ShieldCheck },
        ];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 uppercase tracking-wider text-[11px] font-bold text-slate-500">
        Navigation ({role})
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footnote */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Gateway: Online</span>
        </span>
        <span className="font-mono text-[10px]">v1.0.0</span>
      </div>
    </aside>
  );
};
