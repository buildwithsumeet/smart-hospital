import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import { UserRole } from '../../types';
import { Activity, Bell, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roles = [
    { label: 'Patient', role: UserRole.PATIENT },
    { label: 'Doctor', role: UserRole.DOCTOR },
    { label: 'Hospital Admin', role: UserRole.HOSPITAL_ADMIN },
    { label: 'Receptionist', role: UserRole.RECEPTIONIST },
    { label: 'Accountant', role: UserRole.ACCOUNTANT },
    { label: 'Super Admin', role: UserRole.SUPER_ADMIN },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-800 tracking-tight text-lg">SmartHospital</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-100">
            Microservices
          </span>
        </div>
      </div>

      {/* User Controls & Role Switcher */}
      <div className="flex items-center space-x-4">
        {/* Quick Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center space-x-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <span>Role Switcher:</span>
            <span className="font-semibold text-brand-700">{user?.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Switch Role (Instant Login)
              </div>
              {roles.map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    switchDemoRole(item.role);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.role === item.role ? 'font-semibold text-brand-600 bg-brand-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{item.label}</span>
                  {user?.role === item.role && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full"></span>
        </button>

        {/* User Info */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-700 text-xs">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-slate-500 leading-tight">{user?.email}</div>
          </div>
          <Badge status={user?.role || ''} />
        </div>

        {/* Sign Out */}
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
