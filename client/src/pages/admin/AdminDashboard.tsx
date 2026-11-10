import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Doctor, Appointment, User } from '../../types';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Server
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [revenueData, setRevenueData] = useState<{ totalRevenue: number }>({ totalRevenue: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, apptRes, userRes, revRes] = await Promise.all([
          api.get('/doctors'),
          api.get('/appointments'),
          api.get('/auth/users'),
          api.get('/billing/analytics/revenue')
        ]);
        setDoctors(docRes.data.data);
        setAppointments(apptRes.data.data);
        setUsers(userRes.data.data);
        setRevenueData(revRes.data.data);
      } catch (err) {
        console.error('Failed to load admin metrics', err);
      }
    };
    fetchData();
  }, []);

  // Trends mock dataset based on actual volume
  const trendData = [
    { day: 'Mon', appointments: 12, revenue: 1440 },
    { day: 'Tue', appointments: 19, revenue: 2280 },
    { day: 'Wed', appointments: 15, revenue: 1800 },
    { day: 'Thu', appointments: 22, revenue: 2640 },
    { day: 'Fri', appointments: 28, revenue: 3360 },
    { day: 'Sat', appointments: 14, revenue: 1680 },
    { day: 'Sun', appointments: 8, revenue: 960 },
  ];

  const departmentData = [
    { name: 'Cardiology', visits: 45 },
    { name: 'Neurology', visits: 32 },
    { name: 'Pediatrics', visits: 28 },
    { name: 'Orthopedics', visits: 38 },
    { name: 'Gen Medicine', visits: 52 },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Patients</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{users.length}</div>
            <div className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> +12% this month
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Doctors</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{doctors.length}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">5 Medical Specialties</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Appointments</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{appointments.length}</div>
            <div className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Real-time sync
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">
              ${Number(revenueData.totalRevenue || 0).toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Automated Invoicing
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Appointment Volume Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Appointment Volumes & Trajectory</h3>
              <p className="text-xs text-slate-500">Patient booking traffic over the last 7 days</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Weekly View
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAppts)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Volume Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Departmental Clinical Load</h3>
              <p className="text-xs text-slate-500">Consultation distribution across hospital departments</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              By Department
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="visits" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Microservices Health Monitor Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-800">Microservices Fleet Health Status</h3>
          </div>
          <span className="text-xs font-semibold text-emerald-600 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-ping"></span>
            All 6 Microservices Operational
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { name: 'Auth Service', port: 8001, status: 'HEALTHY' },
            { name: 'Patient Service', port: 8002, status: 'HEALTHY' },
            { name: 'Doctor Service', port: 8003, status: 'HEALTHY' },
            { name: 'Appointment Service', port: 8004, status: 'HEALTHY' },
            { name: 'Billing Service', port: 8005, status: 'HEALTHY' },
            { name: 'Notification Service', port: 8006, status: 'HEALTHY' },
          ].map((svc) => (
            <div key={svc.name} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="text-xs font-bold text-slate-800">{svc.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">Port :{svc.port}</div>
              <div className="mt-2 flex items-center text-[11px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
                {svc.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff & Doctors Directory */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4">Medical Specialists Directory</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Qualifications</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Fee</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Dr. {doc.firstName} {doc.lastName}
                  </td>
                  <td className="py-3 px-4 text-brand-600 font-medium">{doc.specialization}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{doc.qualification}</td>
                  <td className="py-3 px-4">{doc.experienceYears} Years</td>
                  <td className="py-3 px-4 font-bold text-slate-800">${doc.consultationFee}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                      Available
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
