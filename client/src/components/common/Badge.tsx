import React from 'react';
import { AppointmentStatus, InvoiceStatus, UserRole } from '../../types';

interface BadgeProps {
  status: AppointmentStatus | InvoiceStatus | UserRole | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  const getColorClasses = () => {
    switch (status) {
      // Appointment & Invoice Statuses
      case AppointmentStatus.CONFIRMED:
      case InvoiceStatus.PAID:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case AppointmentStatus.PENDING:
      case InvoiceStatus.PENDING:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case AppointmentStatus.CHECKED_IN:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case AppointmentStatus.IN_CONSULTATION:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case AppointmentStatus.COMPLETED:
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case AppointmentStatus.CANCELLED:
      case InvoiceStatus.CANCELLED:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case InvoiceStatus.REFUNDED:
        return 'bg-gray-100 text-gray-700 border-gray-300';

      // Roles
      case UserRole.SUPER_ADMIN:
      case UserRole.HOSPITAL_ADMIN:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case UserRole.DOCTOR:
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case UserRole.RECEPTIONIST:
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case UserRole.PATIENT:
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case UserRole.ACCOUNTANT:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${getColorClasses()}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {status.replace('_', ' ')}
    </span>
  );
};
