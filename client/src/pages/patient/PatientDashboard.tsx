import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Doctor, Appointment, Invoice, TimeSlot, PaymentMethod } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  CreditCard,
  Stethoscope,
  Search,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Bot,
  ArrowRight
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // AI Triage State (Ollama Integration)
  const [aiSymptoms, setAiSymptoms] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    recommendedDepartment: string;
    urgency: string;
    summary: string;
    suggestedQuestions: string[];
  } | null>(null);

  // Search & Booking State
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingReason, setBookingReason] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingAlert, setBookingAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);
  const [isPaying, setIsPaying] = useState(false);

  // Load Initial Data
  const fetchData = async () => {
    try {
      const [docRes, apptRes, invRes, deptRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/appointments'),
        api.get('/billing/invoices'),
        api.get('/doctors/departments')
      ]);
      setDoctors(docRes.data.data);
      setAppointments(apptRes.data.data);
      setInvoices(invRes.data.data);
      setDepartments(deptRes.data.data);
    } catch (err) {
      console.error('Failed to load patient dashboard data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch slots whenever selected doctor or date changes
  useEffect(() => {
    if (selectedDoctor && bookingDate) {
      api
        .get(`/doctors/${selectedDoctor.id}/slots?date=${bookingDate}`)
        .then((res) => {
          setAvailableSlots(res.data.data);
          setSelectedSlot(null);
        })
        .catch(() => setAvailableSlots([]));
    }
  }, [selectedDoctor, bookingDate]);

  const handleAiTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSymptoms.trim()) return;
    setIsAiAnalyzing(true);
    try {
      const res = await api.post('/ai/triage', { symptoms: aiSymptoms });
      setAiResult(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'AI Triage analysis failed');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleApplyAiRecommendation = (deptName: string) => {
    const foundDept = departments.find(
      (d) => d.name.toLowerCase() === deptName.toLowerCase()
    );
    if (foundDept) {
      setSelectedDept(foundDept.id);
    } else {
      setSearch(deptName);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    setIsSubmitting(true);
    setBookingAlert(null);
    try {
      await api.post('/appointments', {
        patientId: 'patient-id', // Enriched automatically by API Gateway
        doctorId: selectedDoctor.id,
        appointmentDate: bookingDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        consultationFee: selectedDoctor.consultationFee,
        reason: bookingReason
      });

      setBookingAlert({ type: 'success', message: 'Appointment booked successfully!' });
      setIsBookingModalOpen(false);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      setBookingReason('');
      fetchData();
    } catch (err: any) {
      setBookingAlert({
        type: 'error',
        message: err.response?.data?.message || 'Slot booking conflict. Please pick another time slot.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.post(`/appointments/${apptId}/cancel`, { reason: 'Patient requested online cancellation' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handlePayInvoice = async () => {
    if (!selectedInvoice) return;
    setIsPaying(true);
    try {
      await api.post(`/billing/invoices/${selectedInvoice.id}/pay`, {
        amount: Number(selectedInvoice.totalAmount),
        paymentMethod
      });
      setSelectedInvoice(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setIsPaying(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.firstName.toLowerCase().includes(search.toLowerCase()) ||
      doc.lastName.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept ? doc.departmentId === selectedDept : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner Alert */}
      {bookingAlert && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between ${
            bookingAlert.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {bookingAlert.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{bookingAlert.message}</span>
          </div>
          <button onClick={() => setBookingAlert(null)} className="text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* AI Clinical Assistant Widget (Powered by alpine/ollama:latest) */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center space-x-2 mb-2">
          <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-brand-300">
            AI Clinical Assistant (Ollama Engine)
          </span>
        </div>
        <h2 className="text-xl font-bold mb-2">Describe Your Symptoms for Smart Specialist Triage</h2>
        <p className="text-sm text-slate-300 max-w-2xl mb-4">
          Powered by local Ollama AI inference. Receive an instant preliminary assessment, urgency rating, and direct routing to the best department.
        </p>

        <form onSubmit={handleAiTriage} className="flex flex-col sm:flex-row gap-3 max-w-3xl">
          <input
            type="text"
            value={aiSymptoms}
            onChange={(e) => setAiSymptoms(e.target.value)}
            placeholder="e.g. Persistent chest pressure with shortness of breath..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <Button
            type="submit"
            isLoading={isAiAnalyzing}
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-6"
          >
            <Bot className="w-4 h-4 mr-2" />
            Analyze with AI
          </Button>
        </form>

        {/* AI Result Card */}
        {aiResult && (
          <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 max-w-3xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-300 font-semibold uppercase">Recommended Department:</span>
                <span className="text-sm font-bold text-brand-300 px-3 py-1 rounded-full bg-brand-500/30">
                  {aiResult.recommendedDepartment}
                </span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  aiResult.urgency === 'EMERGENCY'
                    ? 'bg-rose-500/80 text-white'
                    : aiResult.urgency === 'URGENT'
                    ? 'bg-amber-500/80 text-white'
                    : 'bg-emerald-500/80 text-white'
                }`}
              >
                {aiResult.urgency}
              </span>
            </div>
            <p className="text-sm text-slate-200 mb-3">{aiResult.summary}</p>
            {aiResult.suggestedQuestions?.length > 0 && (
              <div className="text-xs text-slate-300 mb-4">
                <span className="font-semibold text-slate-100">Key Questions to Ask:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {aiResult.suggestedQuestions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              size="sm"
              className="bg-brand-400 hover:bg-brand-300 text-slate-900 font-bold"
              onClick={() => handleApplyAiRecommendation(aiResult.recommendedDepartment)}
            >
              Filter Doctors for {aiResult.recommendedDepartment}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Hero Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{appointments.length}</div>
            <div className="text-xs text-slate-500 font-medium">Total Appointments</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Confirmed / Completed</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {invoices.filter((i) => i.status === 'PENDING').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Pending Invoices</div>
          </div>
        </div>
      </div>

      {/* Section 1: Book New Appointment */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-100 mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Book a Medical Consultation</h2>
            <p className="text-xs text-slate-500">Search specialists, check schedules, and reserve your time slot</p>
          </div>

          {/* Search & Department Filters */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search doctor or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 w-56 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-sm">
                    {doc.firstName.charAt(0)}
                    {doc.lastName.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                    ${doc.consultationFee}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 text-base">
                  Dr. {doc.firstName} {doc.lastName}
                </h3>
                <p className="text-xs text-brand-600 font-medium mb-1">{doc.specialization}</p>
                <p className="text-xs text-slate-400 mb-3">{doc.qualification}</p>
                <p className="text-xs text-slate-600 line-clamp-2">{doc.bio}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">{doc.experienceYears} yrs exp</span>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setIsBookingModalOpen(true);
                  }}
                >
                  Book Slot
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: My Upcoming Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">My Appointments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Consultation Fee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    No scheduled appointments found. Book your first consultation above!
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
                    <td className="py-3.5 px-4 font-medium text-slate-700">Dr. Sarah Jenkins</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">${appt.consultationFee}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={appt.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelAppointment(appt.id)}
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

      {/* Section 3: Invoices & Online Payment */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Billing & Invoices</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">{inv.id.substring(0, 8)}...</td>
                    <td className="py-3.5 px-4">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">${inv.totalAmount}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.status === 'PENDING' && (
                        <Button size="sm" onClick={() => setSelectedInvoice(inv)}>
                          Pay Now
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

      {/* Booking Slot Selection Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title={`Book Appointment - Dr. ${selectedDoctor?.firstName} ${selectedDoctor?.lastName}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Appointment Date
            </label>
            <input
              type="date"
              value={bookingDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Available 30-Minute Time Slots
            </label>
            {availableSlots.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No active schedule or slots available for this doctor on selected date. Please pick a weekday.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border text-center transition-all ${
                      selectedSlot?.startTime === slot.startTime
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-400'
                    }`}
                  >
                    {slot.startTime} - {slot.endTime}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Visit (Optional)
            </label>
            <textarea
              rows={2}
              value={bookingReason}
              onChange={(e) => setBookingReason(e.target.value)}
              placeholder="e.g. Regular cardiac checkup, chest tightness..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-sm font-semibold text-slate-800">
              Fee: ${selectedDoctor?.consultationFee}
            </span>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsBookingModalOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!selectedSlot}
                isLoading={isSubmitting}
                onClick={handleBookAppointment}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Mock Payment Gateway Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title="Simulated Payment Gateway"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 uppercase font-semibold">Total Amount Due</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              ${selectedInvoice?.totalAmount}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">Invoice #{selectedInvoice?.id}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              <option value={PaymentMethod.CREDIT_CARD}>Credit Card (Simulated)</option>
              <option value={PaymentMethod.DEBIT_CARD}>Debit Card (Simulated)</option>
              <option value={PaymentMethod.UPI}>UPI / Instant Bank Transfer</option>
              <option value={PaymentMethod.INSURANCE}>Health Insurance Claim</option>
              <option value={PaymentMethod.CASH}>Cash at Reception</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
              Cancel
            </Button>
            <Button isLoading={isPaying} onClick={handlePayInvoice}>
              Authorize & Pay ${selectedInvoice?.totalAmount}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
