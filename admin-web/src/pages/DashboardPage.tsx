import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Store, 
  Calendar, 
  Tag, 
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { adminVendorService } from '../services/vendor.service';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminVendorService.getDashboardStats();
        setStats(data);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-secondary via-secondary-light to-primary rounded-2xl p-6 text-white shadow-sm">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Central Marketplace Console</span>
          <h2 className="text-2xl font-black mt-1">Shubh Mangalam Executive Overview</h2>
          <p className="text-rose-100 text-sm mt-1 leading-relaxed">
            Local celebration & event-services marketplace orchestration. Monitoring live database entities across Vendors, Categories, Events, and User Accounts.
          </p>
        </div>
      </div>

      {/* KPI Cards — Database Driven */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Total Vendors Card */}
        <div 
          onClick={() => navigate('/providers')}
          className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm hover:border-secondary transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase">Service Providers</span>
            <Store className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-2">
            {loading ? '...' : stats?.totalVendors ?? 0}
          </p>
          <div className="flex items-center text-xs text-[#78716C] mt-2 space-x-2">
            <span className="text-emerald-700 font-bold flex items-center">
              {stats?.totalApprovedVendors ?? 0} Approved
            </span>
            <span>•</span>
            <span className="text-amber-700 font-bold">
              {stats?.totalUnderReviewVendors ?? 0} In Review
            </span>
          </div>
        </div>

        {/* Pending Approval Card */}
        <div 
          onClick={() => navigate('/providers')}
          className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm hover:border-primary transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase">Pending Actions</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-primary mt-2">
            {loading ? '...' : (stats?.totalPendingVendors ?? 0) + (stats?.totalUnderReviewVendors ?? 0)}
          </p>
          <div className="flex items-center text-xs text-[#78716C] mt-2">
            <span className="text-rose-700 font-semibold">
              {stats?.totalRejectedVendors ?? 0} Rejected • {stats?.totalSuspendedVendors ?? 0} Suspended
            </span>
          </div>
        </div>

        {/* Registered Users Card */}
        <div className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase">Registered Accounts</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-2">
            {loading ? '...' : stats?.totalUsers ?? 0}
          </p>
          <div className="flex items-center text-xs text-[#78716C] mt-2">
            <span className="text-emerald-600 font-semibold">Active in database</span>
          </div>
        </div>

        {/* Event Categories Card */}
        <div 
          onClick={() => navigate('/categories')}
          className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm hover:border-emerald-500 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase">Marketplace Categories</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-2">
            {loading ? '...' : stats?.totalCategories ?? 0}
          </p>
          <div className="flex items-center text-xs text-[#78716C] mt-2">
            <span className="text-emerald-600 font-semibold flex items-center">
              Across {stats?.totalEventTypes ?? 16} Event Types <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div 
          onClick={() => navigate('/providers')}
          className="p-5 rounded-2xl border border-secondary/20 bg-rose-50/40 hover:bg-rose-50/70 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1C1917]">Manage Service Providers</h3>
                <p className="text-xs text-[#78716C]">
                  Inspect submitted documents, evaluate profile details, approve or reject applications.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-secondary" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/categories')}
          className="p-5 rounded-2xl border border-amber-200 bg-[#FEF3C7]/40 hover:bg-[#FEF3C7]/70 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1C1917]">Configure Categories</h3>
                <p className="text-xs text-[#78716C]">
                  Dynamically create and adjust celebration categories without code changes.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
