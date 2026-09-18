import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  User,
  Shield,
} from 'lucide-react';
import { transactionService, AdminBookingItem } from '../services/transaction.service';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingItem | null>(null);

  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      const res = await transactionService.getBookings({
        page,
        limit: 15,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setBookings(res.bookings);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            ● Confirmed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            ● In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            ✓ Completed
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
            ✕ Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">
            Celebration Bookings & Historical Snapshots
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Permanent audit record of confirmed celebration services, locked financial agreements, and fulfillment status.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Total Bookings: {pagination.total} Confirmed
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E0D8] shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by booking #, client, or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#78716C]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={() => fetchBookings(1)}
            className="px-4 py-2 bg-primary hover:bg-primaryDark text-white text-sm font-bold rounded-xl transition shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#78716C]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-sm">Loading bookings ledger...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center text-[#78716C]">
            <Calendar className="w-12 h-12 text-[#A8A29E] mx-auto mb-3" />
            <p className="text-base font-bold text-[#1C1917]">No Bookings Found</p>
            <p className="text-xs text-[#78716C] mt-1">Confirmed marketplace bookings will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1C1917]">
              <thead className="bg-[#FAF8F5] border-b border-[#E7E0D8] text-xs uppercase font-bold text-[#57534E]">
                <tr>
                  <th className="px-6 py-4">Booking Number</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Service Provider</th>
                  <th className="px-6 py-4">Event Date</th>
                  <th className="px-6 py-4">Locked Value</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D8]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FAF8F5] transition">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-[#1C1917]">
                      {b.bookingNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1C1917]">{b.customer?.name}</p>
                      <p className="text-xs text-[#78716C]">{b.customer?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1C1917]">{b.vendor?.businessName}</p>
                      <p className="text-xs text-[#78716C]">{b.vendor?.city}</p>
                    </td>
                    <td className="px-6 py-4">
                      {b.event ? (
                        <div>
                          <p className="font-semibold text-xs text-[#1C1917]">{b.event.title}</p>
                          <p className="text-[11px] text-[#78716C]">
                            {new Date(b.event.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#78716C]">
                          {b.confirmedAt ? new Date(b.confirmedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-base text-primary">
                      ₹{Number(b.total).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                        PENDING
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          const details = await transactionService.getBookingDetails(b.id);
                          setSelectedBooking(details);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-[#FEF3C7] hover:bg-amber-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#E7E0D8] bg-[#FAF8F5] flex items-center justify-between">
            <span className="text-xs text-[#78716C]">
              Showing page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchBookings(pagination.page - 1)}
                className="px-3 py-1.5 bg-white border border-[#E7E0D8] rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchBookings(pagination.page + 1)}
                className="px-3 py-1.5 bg-white border border-[#E7E0D8] rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#E7E0D8]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E7E0D8] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <span className="text-xs font-mono font-bold text-primary">
                  BOOKING #{selectedBooking.bookingNumber}
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-0.5">
                  Historical Snapshot & Locked Agreement
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#E7E0D8] flex items-center justify-center text-[#78716C] hover:text-[#1C1917]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E7E0D8]">
                  <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Client</p>
                  <p className="font-extrabold text-base text-[#1C1917] mt-1">
                    {selectedBooking.customer?.name}
                  </p>
                  <p className="text-xs text-[#57534E]">{selectedBooking.customer?.email}</p>
                  <p className="text-xs text-[#57534E]">{selectedBooking.customer?.phone}</p>
                </div>
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E7E0D8]">
                  <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Provider</p>
                  <p className="font-extrabold text-base text-[#1C1917] mt-1">
                    {selectedBooking.vendor?.businessName}
                  </p>
                  <p className="text-xs text-[#57534E]">{selectedBooking.vendor?.city}</p>
                  <p className="text-xs font-bold text-emerald-700 mt-1">
                    Status: {selectedBooking.status}
                  </p>
                </div>
              </div>

              {/* Immutable Snapshot Notice */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start space-x-3">
                <Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-emerald-800">
                  <p className="font-bold">Historical Price Immutability Active</p>
                  <p className="mt-0.5">
                    These items and financial figures were locked at quote acceptance. Any subsequent vendor catalog updates do not alter this historical record.
                  </p>
                </div>
              </div>

              {/* Snapshotted Items Table */}
              <div>
                <h3 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider mb-3">
                  Snapshotted Items ({selectedBooking.items?.length || 0})
                </h3>
                <div className="border border-[#E7E0D8] rounded-2xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#E7E0D8] font-bold text-[#57534E]">
                      <tr>
                        <th className="p-3">Service Name</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Agreed Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E0D8]">
                      {selectedBooking.items?.map((it) => (
                        <tr key={it.id}>
                          <td className="p-3 font-semibold text-[#1C1917]">
                            {it.name}
                            {it.notes && (
                              <p className="text-[11px] text-[#78716C] font-normal">{it.notes}</p>
                            )}
                          </td>
                          <td className="p-3 text-center">{it.quantity}</td>
                          <td className="p-3 text-right">
                            ₹{Number(it.unitPrice).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right font-bold text-[#1C1917]">
                            ₹{Number(it.totalPrice).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E7E0D8] space-y-2 text-sm">
                <div className="flex justify-between text-[#57534E]">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{Number(selectedBooking.subtotal).toLocaleString('en-IN')}</span>
                </div>
                {Number(selectedBooking.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Agreed Discount</span>
                    <span className="font-semibold">-₹{Number(selectedBooking.discount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {Number(selectedBooking.tax) > 0 && (
                  <div className="flex justify-between text-[#57534E]">
                    <span>Tax</span>
                    <span className="font-semibold">+₹{Number(selectedBooking.tax).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#E7E0D8] flex justify-between text-base font-extrabold text-[#1C1917]">
                  <span>Total Locked Amount</span>
                  <span className="text-primary text-xl">₹{Number(selectedBooking.total).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E7E0D8] bg-[#FAF8F5] flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-6 py-2.5 bg-white border border-[#E7E0D8] rounded-xl text-sm font-bold text-[#1C1917] hover:bg-[#F5EFE6] transition"
              >
                Close Snapshot View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
