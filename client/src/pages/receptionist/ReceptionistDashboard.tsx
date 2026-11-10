import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Appointment, AppointmentStatus, Doctor } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { UserCheck, UserPlus, Calendar, Clock, Stethoscope, Search, CheckCircle } from 'lucide-react';

export const ReceptionistDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Register Form
  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '1990-01-01',
    gender: 'MALE' as const,
    bloodGroup: 'O+',
    allergies: 'None'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [apptRes, docRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/doctors')
      ]);
      setAppointments(apptRes.data.data);
      setDoctors(docRes.data.data);
    } catch (err) {
      console.error('Failed to load receptionist data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async (apptId: string) => {
    try {
      await api.patch(`/appointments/${apptId}/status`, {
        status: AppointmentStatus.CHECKED_IN,
        notes: 'Patient checked in at front desk'
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/patients', patientForm);
      alert('Patient registered successfully!');
      setIsRegisterModalOpen(false);
      setPatientForm({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        bloodGroup: 'O+',
        allergies: 'None'
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((a) =>
    a.patientId.toLowerCase().includes(search.toLowerCase()) ||
    a.appointmentDate.includes(search)
  );

  return (
    <div className="space-y-8">
      {/* Top Banner Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Front Desk & Reception Command Center</h2>
          <p className="text-xs text-slate-500">Manage walk-ins, patient arrivals, and doctor schedules</p>
        </div>
        <Button onClick={() => setIsRegisterModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Register Walk-In Patient
        </Button>
      </div>

      {/* Check-In Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800">Patient Arrival & Check-In Desk</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Patient ID or Date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Patient Ref</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    No appointments in queue.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{appt.appointmentDate}</div>
                      <div className="text-xs text-slate-400 font-normal">
                        {appt.startTime} - {appt.endTime}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      #{appt.patientId.substring(0, 8)}...
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">Dr. Sarah Jenkins</td>
                    <td className="py-3.5 px-4">
                      <Badge status={appt.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {appt.status === AppointmentStatus.PENDING && (
                        <Button size="sm" onClick={() => handleCheckIn(appt.id)}>
                          <UserCheck className="w-4 h-4 mr-1.5" />
                          Check In Patient
                        </Button>
                      )}
                      {appt.status === AppointmentStatus.CHECKED_IN && (
                        <span className="text-xs font-semibold text-emerald-600">
                          Checked-In (Waiting)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walk-In Patient Registration Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Walk-In Patient"
        maxWidth="lg"
      >
        <form onSubmit={handleRegisterPatient} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={patientForm.firstName}
                onChange={(e) => setPatientForm({ ...patientForm, firstName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={patientForm.lastName}
                onChange={(e) => setPatientForm({ ...patientForm, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={patientForm.email}
                onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={patientForm.phoneNumber}
                onChange={(e) => setPatientForm({ ...patientForm, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                required
                value={patientForm.dateOfBirth}
                onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={patientForm.gender}
                onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Blood Group
              </label>
              <input
                type="text"
                value={patientForm.bloodGroup}
                onChange={(e) => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Register Patient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
