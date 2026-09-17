import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { adminVendorService, VendorListItem } from '../services/vendor.service';

const STATUS_FILTERS = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

export const VendorListPage: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Filter & Pagination state
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('ALL');

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminVendorService.listVendors({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: status !== 'ALL' ? status : undefined,
      });

      setVendors(data.vendors || []);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [page, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVendors();
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3 mr-1" /> Under Review
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-200 text-neutral-800 border border-neutral-400">
            <AlertTriangle className="w-3 h-3 mr-1" /> Suspended
          </span>
        );
      default:
        return <span>{s}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1C1917] tracking-tight">Service Providers & Vendors</h2>
          <p className="text-sm text-[#78716C] mt-1">
            Manage vendor onboarding applications, documentation compliance, and lifecycle approvals.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchVendors}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#57534E] bg-white border border-[#E7E0D8] hover:bg-[#F5EFE6] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E7E0D8] shadow-sm space-y-4">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatus(f.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                status === f.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-[#FAF8F5] text-[#57534E] border border-[#E7E0D8] hover:bg-[#F5EFE6]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by business name, owner, city, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-[#E7E0D8] bg-[#FAF8F5] focus:outline-none focus:border-primary focus:bg-white text-[#1C1917]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-secondary hover:bg-secondary-dark transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#78716C]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            <p className="text-xs font-semibold">Loading marketplace vendors from database...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs font-bold">{error}</p>
            <button
              onClick={fetchVendors}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs bg-red-50 hover:bg-red-100 font-bold text-red-700"
            >
              Try Again
            </button>
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-[#78716C]">
            <Store className="w-10 h-10 mx-auto text-[#A8A29E] mb-2" />
            <p className="text-sm font-bold text-[#1C1917]">No Vendors Found</p>
            <p className="text-xs text-[#78716C] mt-1">No vendors matched your status or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E7E0D8] text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                  <th className="py-3 px-4">Business & Owner</th>
                  <th className="py-3 px-4">City / State</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Categories</th>
                  <th className="py-3 px-4">Docs</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D8] text-xs">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-[#FFFDF9] transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-[#1C1917]">{v.businessName}</p>
                        <p className="text-[11px] text-[#78716C]">
                          Owner: {v.owner.name} • {v.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#1C1917]">{v.city}</p>
                      <p className="text-[11px] text-[#78716C]">{v.state}</p>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(v.status)}</td>
                    <td className="py-3.5 px-4">
                      {v.isVerified ? (
                        <span className="inline-flex items-center text-emerald-700 font-bold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified
                        </span>
                      ) : (
                        <span className="text-[#A8A29E] text-[11px] font-semibold">Unverified</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {v.categories.length === 0 ? (
                          <span className="text-[#A8A29E] text-[10px]">None</span>
                        ) : (
                          v.categories.map((c) => (
                            <span
                              key={c.id}
                              className="px-1.5 py-0.5 bg-[#FEF3C7] text-primary text-[10px] font-bold rounded"
                            >
                              {c.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-bold text-[#57534E]">
                        {v.approvedDocumentsCount}/{v.documentsCount} Approved
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/providers/${v.id}`)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-secondary bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E7E0D8] bg-[#FAF8F5] flex items-center justify-between text-xs text-[#78716C]">
          <span>
            Showing <strong className="text-[#1C1917]">{vendors.length}</strong> of{' '}
            <strong className="text-[#1C1917]">{total}</strong> total providers
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#E7E0D8] bg-white hover:bg-[#F5EFE6] disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-[#1C1917]">
              {page} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-[#E7E0D8] bg-white hover:bg-[#F5EFE6] disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorListPage;
