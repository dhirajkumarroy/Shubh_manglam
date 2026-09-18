import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  X,
  Building,
  User,
  Calendar,
} from 'lucide-react';
import { transactionService, AdminQuoteItem } from '../services/transaction.service';

export const QuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<AdminQuoteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [selectedQuote, setSelectedQuote] = useState<AdminQuoteItem | null>(null);

  const fetchQuotes = async (page = 1) => {
    try {
      setLoading(true);
      const res = await transactionService.getQuotes({
        page,
        limit: 15,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setQuotes(res.quotes);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuotes(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Quote Sent
          </span>
        );
      case 'REVISION_REQUESTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            In Negotiation
          </span>
        );
      case 'REVISED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            Revised (v2+)
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            ✓ Accepted
          </span>
        );
      case 'REQUESTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Request Pending
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
            Declined
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
            Marketplace Quotations & Proposals
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Audit customer quote requests, multi-version negotiation history, and acceptance transactions.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-primary border border-amber-200">
            Total Logged: {pagination.total} Deals
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E0D8] shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by quote #, client, or vendor..."
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
            <option value="REQUESTED">New Requests</option>
            <option value="SENT">Sent Quotes</option>
            <option value="REVISION_REQUESTED">In Negotiation</option>
            <option value="REVISED">Revised Proposals</option>
            <option value="ACCEPTED">Accepted Deals</option>
            <option value="REJECTED">Declined</option>
          </select>

          <button
            onClick={() => fetchQuotes(1)}
            className="px-4 py-2 bg-primary hover:bg-primaryDark text-white text-sm font-bold rounded-xl transition shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#78716C]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-sm">Loading quotation database...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-16 text-center text-[#78716C]">
            <FileText className="w-12 h-12 text-[#A8A29E] mx-auto mb-3" />
            <p className="text-base font-bold text-[#1C1917]">No Quotations Found</p>
            <p className="text-xs text-[#78716C] mt-1">No marketplace transactions match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1C1917]">
              <thead className="bg-[#FAF8F5] border-b border-[#E7E0D8] text-xs uppercase font-bold text-[#57534E]">
                <tr>
                  <th className="px-6 py-4">Quote Number</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Event / Occasion</th>
                  <th className="px-6 py-4">Agreed Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D8]">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[#FAF8F5] transition">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-[#1C1917]">
                      {q.quoteNumber}
                      {q.currentVersion > 1 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-extrabold">
                          v{q.currentVersion}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1C1917]">{q.customer?.name || 'Customer'}</p>
                      <p className="text-xs text-[#78716C]">{q.customer?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1C1917]">{q.vendor?.businessName || 'Vendor'}</p>
                      <p className="text-xs text-[#78716C]">{q.vendor?.city}</p>
                    </td>
                    <td className="px-6 py-4">
                      {q.event ? (
                        <div>
                          <p className="font-semibold text-xs text-[#1C1917]">{q.event.title}</p>
                          <p className="text-[11px] text-[#78716C]">
                            {new Date(q.event.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-[#78716C] italic">Custom Inquiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-primary text-base">
                        ₹{Number(q.total).toLocaleString('en-IN')}
                      </p>
                      {Number(q.discount) > 0 && (
                        <p className="text-[11px] text-emerald-600 font-semibold">
                          -₹{Number(q.discount).toLocaleString('en-IN')} disc
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(q.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={async () => {
                          const detailed = await transactionService.getQuoteDetails(q.id);
                          setSelectedQuote(detailed);
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
                onClick={() => fetchQuotes(pagination.page - 1)}
                className="px-3 py-1.5 bg-white border border-[#E7E0D8] rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchQuotes(pagination.page + 1)}
                className="px-3 py-1.5 bg-white border border-[#E7E0D8] rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#E7E0D8]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E7E0D8] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <span className="text-xs font-mono font-bold text-primary">
                  QUOTE #{selectedQuote.quoteNumber}
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-0.5">
                  Deal Inspection & Audit Log
                </h2>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#E7E0D8] flex items-center justify-center text-[#78716C] hover:text-[#1C1917]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Summary Header Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E7E0D8]">
                  <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Client</p>
                  <p className="font-extrabold text-base text-[#1C1917] mt-1">
                    {selectedQuote.customer?.name}
                  </p>
                  <p className="text-xs text-[#57534E]">{selectedQuote.customer?.email}</p>
                  <p className="text-xs text-[#57534E]">{selectedQuote.customer?.phone}</p>
                </div>
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E7E0D8]">
                  <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Provider</p>
                  <p className="font-extrabold text-base text-[#1C1917] mt-1">
                    {selectedQuote.vendor?.businessName}
                  </p>
                  <p className="text-xs text-[#57534E]">{selectedQuote.vendor?.city}</p>
                  <p className="text-xs text-primary font-semibold mt-1">
                    Status: {selectedQuote.status}
                  </p>
                </div>
              </div>

              {/* Version History Log */}
              {selectedQuote.versions && selectedQuote.versions.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider mb-3">
                    Multi-Version Negotiation Log ({selectedQuote.versions.length} Iterations)
                  </h3>
                  <div className="space-y-2">
                    {selectedQuote.versions.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 bg-white border border-[#E7E0D8] rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <span className="font-black px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                            Version {v.versionNumber}
                          </span>
                          {v.revisionNotes && (
                            <p className="text-[#57534E] italic mt-1">
                              Client request: "{v.revisionNotes}"
                            </p>
                          )}
                          <p className="text-[11px] text-[#78716C]">
                            {new Date(v.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-sm text-[#1C1917]">
                            ₹{Number(v.total).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-[#78716C]">Subtotal: ₹{Number(v.subtotal).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quoted Items */}
              <div>
                <h3 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider mb-3">
                  Quoted Line Items
                </h3>
                <div className="border border-[#E7E0D8] rounded-2xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#E7E0D8] font-bold text-[#57534E]">
                      <tr>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E0D8]">
                      {selectedQuote.items?.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="p-3 font-semibold text-[#1C1917]">
                            {it.description}
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

              {/* Totals Breakdown */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E7E0D8] space-y-2 text-sm">
                <div className="flex justify-between text-[#57534E]">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{Number(selectedQuote.subtotal).toLocaleString('en-IN')}</span>
                </div>
                {Number(selectedQuote.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{Number(selectedQuote.discount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {Number(selectedQuote.tax) > 0 && (
                  <div className="flex justify-between text-[#57534E]">
                    <span>Tax & GST</span>
                    <span className="font-semibold">+₹{Number(selectedQuote.tax).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#E7E0D8] flex justify-between text-base font-extrabold text-[#1C1917]">
                  <span>Total Amount</span>
                  <span className="text-primary text-xl">₹{Number(selectedQuote.total).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E7E0D8] bg-[#FAF8F5] flex justify-end">
              <button
                onClick={() => setSelectedQuote(null)}
                className="px-6 py-2.5 bg-white border border-[#E7E0D8] rounded-xl text-sm font-bold text-[#1C1917] hover:bg-[#F5EFE6] transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesPage;
