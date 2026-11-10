import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Appointment, AppointmentStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Calendar,
  CheckCircle2,
  Clock,
  PlayCircle,
  XCircle,
  FileText,
  UserCheck,
  Sparkles,
  Bot
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (err) {
      console.error('Failed to load appointments', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (apptId: string, newStatus: AppointmentStatus, notes?: string) => {
    setIsUpdating(true);
    try {
      await api.patch(`/appointments/${apptId}/status`, {
        status: newStatus,
        notes: notes || undefined
      });
      fetchAppointments();
      setIsNotesModalOpen(false);
      setSelectedAppt(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAiCopilot = async () => {
    if (!selectedAppt) return;
    setIsAiGenerating(true);
    try {
      const res = await api.post('/ai/copilot', {
        symptoms: selectedAppt.reason || 'Clinical checkup visit',
        patientAge: 45,
        gender: 'Adult'
      });
      const generated = res.data.data.assessment;
      setClinicalNotes((prev) => (prev ? `${prev}\n\n[AI Clinical Copilot]:\n${generated}` : generated));
    } catch (err: any) {
      alert(err.response?.data?.message || 'AI Copilot generation failed');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const todayCount = appointments.length;
  const completedCount = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length;
  const inProgressCount = appointments.filter((a) => a.status === AppointmentStatus.IN_CONSULTATION).length;

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{todayCount}</div>
            <div className="text-xs text-slate-500 font-medium">Total Assigned Patients</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{inProgressCount}</div>
            <div className="text-xs text-slate-500 font-medium">In Consultation</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{completedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Completed Consultations</div>
          </div>
        </div>
      </div>

      {/* Today's Clinical Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Clinical Consultations Queue</h2>
            <p className="text-xs text-slate-500">Manage patient arrivals, consultations, and AI-assisted diagnoses</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Patient Reference</th>
                <th className="py-3 px-4">Reason for Visit</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Clinical Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    No patient appointments scheduled for today.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{appt.appointmentDate}</div>
                      <div className="text-xs text-slate-400 font-normal">
                        {appt.startTime} - {appt.endTime}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      <div>Patient #{appt.patientId.substring(0, 8)}...</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{appt.reason || 'General checkup'}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={appt.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {appt.status === AppointmentStatus.CHECKED_IN && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.IN_CONSULTATION)}
                        >
                          Start Visit
                        </Button>
                      )}
                      {appt.status === AppointmentStatus.IN_CONSULTATION && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedAppt(appt);
                            setIsNotesModalOpen(true);
                          }}
                        >
                          Complete & Prescribe
                        </Button>
                      )}
                      {appt.status !== AppointmentStatus.CANCELLED && appt.status !== AppointmentStatus.COMPLETED && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.CANCELLED, 'Cancelled by doctor')}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Visit & Clinical Notes Modal with AI Copilot */}
      <Modal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        title="Complete Consultation & Record Diagnosis"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-brand-50 border border-brand-200">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <div>
                <div className="text-xs font-bold text-brand-900">AI Clinical Diagnostic Copilot</div>
                <div className="text-[11px] text-brand-700">Powered by Ollama (alpine/ollama:latest)</div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              isLoading={isAiGenerating}
              onClick={handleAiCopilot}
              className="bg-white border-brand-300 text-brand-800"
            >
              <Bot className="w-4 h-4 mr-1.5" />
              Generate Clinical Assessment
            </Button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Clinical Assessment & Prescription Notes
            </label>
            <textarea
              rows={6}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Patient presents mild arrhythmia. Prescribed beta-blockers 25mg daily. Scheduled follow-up in 4 weeks."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsNotesModalOpen(false)}>
              Cancel
            </Button>
            <Button
              isLoading={isUpdating}
              onClick={() => {
                if (selectedAppt) {
                  handleUpdateStatus(selectedAppt.id, AppointmentStatus.COMPLETED, clinicalNotes);
                }
              }}
            >
              Finalize Visit & Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
