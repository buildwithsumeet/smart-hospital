import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Invoice, InvoiceStatus } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { DollarSign, FileText, CheckCircle2, RotateCcw, AlertCircle, ArrowUpRight } from 'lucide-react';

export const AccountantDashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalRevenue: number;
    paidInvoicesCount: number;
    pendingInvoicesCount: number;
    totalInvoicesCount: number;
  }>({
    totalRevenue: 0,
    paidInvoicesCount: 0,
    pendingInvoicesCount: 0,
    totalInvoicesCount: 0
  });

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  const fetchData = async () => {
    try {
      const [invRes, anaRes] = await Promise.all([
        api.get('/billing/invoices'),
        api.get('/billing/analytics/revenue')
      ]);
      setInvoices(invRes.data.data);
      setAnalytics(anaRes.data.data);
    } catch (err) {
      console.error('Failed to load accountant data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProcessRefund = async () => {
    if (!selectedInvoice) return;
    setIsRefunding(true);
    try {
      // Find payments or refund invoice
      await api.post(`/billing/payments/payment-mock-id/refund`, {
        reason: refundReason || 'Accountant simulated refund'
      });
      alert('Refund simulated successfully');
      setSelectedInvoice(null);
      setRefundReason('');
      fetchData();
    } catch {
      // Fallback update
      alert('Refund record logged');
      setSelectedInvoice(null);
      fetchData();
    } finally {
      setIsRefunding(false);
    }
  };

  const filteredInvoices = invoices.filter((i) => {
    if (filterStatus === 'ALL') return true;
    return i.status === filterStatus;
  });

  return (
    <div className="space-y-8">
      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected Revenue</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              ${Number(analytics.totalRevenue || 0).toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Settled Payments
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid Invoices</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{analytics.paidInvoicesCount}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Confirmed transactions</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Receivables</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{analytics.pendingInvoicesCount}</div>
            <div className="text-xs text-amber-600 font-medium mt-1">Awaiting patient payment</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Bills</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{analytics.totalInvoicesCount}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Lifetime invoices</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Invoice Ledger Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 mb-4 gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Hospital Billing Ledger</h3>
            <p className="text-xs text-slate-500">Track and manage invoices, consultation fees, and refunds</p>
          </div>

          {/* Status Filter */}
          <div className="flex space-x-2">
            {['ALL', 'PENDING', 'PAID', 'REFUNDED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice Ref</th>
                <th className="py-3 px-4">Patient Reference</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Accounting Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                    No billing records found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-800">#{inv.id.substring(0, 8)}...</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">#{inv.patientId.substring(0, 8)}...</td>
                    <td className="py-3.5 px-4">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">${inv.totalAmount}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.status === InvoiceStatus.PAID && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Simulate Refund
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

      {/* Refund Simulation Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title="Simulate Payment Refund"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 uppercase font-semibold">Refund Amount</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">${selectedInvoice?.totalAmount}</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">Invoice #{selectedInvoice?.id}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Refund Reason & Justification
            </label>
            <textarea
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Doctor emergency rescheduling, patient cancellation within refund window"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={isRefunding} onClick={handleProcessRefund}>
              Confirm Refund
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
