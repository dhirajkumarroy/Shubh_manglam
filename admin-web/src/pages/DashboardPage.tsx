import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Store, 
  Tag, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Shield,
  UserCheck,
  Calendar,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ClipboardList,
  XCircle,
} from 'lucide-react';
import { adminVendorService } from '../services/vendor.service';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [inquiryData, setInquiryData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsData, inqData] = await Promise.all([
        adminVendorService.getDashboardStats(),
        adminVendorService.getInquiryAnalytics().catch(() => null),
      ]);
      setStats(statsData);
      setInquiryData(inqData);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalUsers = stats?.totalUsers || 0;
  const totalCustomers = stats?.totalCustomers || 0;
  const totalProviders = stats?.totalProviders || 0;
  const totalAdmins = stats?.totalAdmins || 0;
  const totalActiveUsers = stats?.totalActiveUsers || 0;
  const totalVerifiedUsers = stats?.totalVerifiedUsers || 0;
  const totalBlockedUsers = stats?.totalBlockedUsers || 0;

  // Percentage calculations
  const customerPct = totalUsers > 0 ? Math.round((totalCustomers / totalUsers) * 100) : 0;
  const providerPct = totalUsers > 0 ? Math.round((totalProviders / totalUsers) * 100) : 0;
  const adminPct = totalUsers > 0 ? Math.round((totalAdmins / totalUsers) * 100) : 0;
  const verifiedPct = totalUsers > 0 ? Math.round((totalVerifiedUsers / totalUsers) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-secondary via-secondary-light to-primary rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Central Marketplace Console</span>
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Live Analytics</span>
          </div>
          <h2 className="text-2xl font-black mt-1">Shubh Ausar — शुभ अवसर Executive Overview</h2>
          <p className="text-rose-100 text-sm mt-1 leading-relaxed">
            Local celebration & event-services marketplace orchestration. Monitoring live database entities across Vendors, Categories, Events, and User Accounts.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="self-start md:self-auto inline-flex items-center space-x-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition backdrop-blur-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Total Vendors Card */}
        <div 
          onClick={() => navigate('/providers')}
          className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm hover:border-secondary transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase tracking-wider">Service Providers</span>
            <Store className="w-4 h-4 text-secondary group-hover:scale-110 transition-transform" />
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

        {/* Pending Actions Card */}
        <div 
          onClick={() => navigate('/providers')}
          className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm hover:border-primary transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Actions</span>
            <Clock className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
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

        {/* Registered Users Card (Clickable to /users) */}
        <div 
          onClick={() => navigate('/users')}
          className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm hover:border-primary transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-2">
            {loading ? '...' : totalUsers}
          </p>
          <div className="flex items-center text-xs text-[#78716C] mt-2 space-x-1.5">
            <span className="text-blue-700 font-bold">{totalCustomers} Customers</span>
            <span>•</span>
            <span className="text-amber-700 font-bold">{totalProviders} Providers</span>
          </div>
        </div>

        {/* Event Categories Card */}
        <div 
          onClick={() => navigate('/categories')}
          className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm hover:border-emerald-500 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase tracking-wider">Marketplace Categories</span>
            <Tag className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
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

      {/* Deep-Dive User Analytics Section */}
      <div className="bg-white rounded-2xl p-6 border border-[#E7E0D8] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#E7E0D8] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-black text-lg text-[#1C1917]">Userbase & Account Demographics</h3>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Live role segmentation, verification compliance, and active governance across all registered users.
            </p>
          </div>
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-[#FEF3C7] text-primary hover:bg-amber-200 text-xs font-bold transition border border-amber-300"
          >
            <span>Open User Directory</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Analytics Breakdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Customers */}
          <div 
            onClick={() => navigate('/users')}
            className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 cursor-pointer hover:bg-blue-50 transition"
          >
            <div className="flex items-center justify-between text-blue-800">
              <span className="text-xs font-bold uppercase tracking-wider">Customers</span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-950 mt-2">{totalCustomers}</p>
            <div className="flex items-center justify-between text-xs text-blue-700 mt-2 font-semibold">
              <span>{customerPct}% of total users</span>
              <span>Event Planners</span>
            </div>
          </div>

          {/* Service Providers */}
          <div 
            onClick={() => navigate('/users')}
            className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 cursor-pointer hover:bg-amber-50 transition"
          >
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-bold uppercase tracking-wider">Service Providers</span>
              <Store className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-2xl font-black text-amber-950 mt-2">{totalProviders}</p>
            <div className="flex items-center justify-between text-xs text-amber-700 mt-2 font-semibold">
              <span>{providerPct}% of total users</span>
              <span>Live Businesses</span>
            </div>
          </div>

          {/* Administrators */}
          <div 
            onClick={() => navigate('/users')}
            className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 cursor-pointer hover:bg-purple-50 transition"
          >
            <div className="flex items-center justify-between text-purple-800">
              <span className="text-xs font-bold uppercase tracking-wider">System Administrators</span>
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-950 mt-2">{totalAdmins}</p>
            <div className="flex items-center justify-between text-xs text-purple-700 mt-2 font-semibold">
              <span>{adminPct}% of total users</span>
              <span>Full Access</span>
            </div>
          </div>

          {/* Verification & Compliance */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Account Standing</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-950 mt-2">{totalActiveUsers} Active</p>
            <div className="flex items-center justify-between text-xs text-emerald-700 mt-2 font-semibold">
              <span>{totalVerifiedUsers} Verified ({verifiedPct}%)</span>
              <span className="text-rose-700 font-bold">{totalBlockedUsers} Blocked</span>
            </div>
          </div>
        </div>

        {/* Visual Distribution Ratio Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
            <span>Account Role Distribution</span>
            <span className="text-[#78716C]">{totalUsers} Total Accounts In System</span>
          </div>
          <div className="h-3 w-full bg-[#FAF8F5] rounded-full overflow-hidden flex border border-[#E7E0D8]">
            <div 
              style={{ width: `${customerPct || 33}%` }} 
              className="bg-blue-500 h-full transition-all duration-500" 
              title={`Customers: ${totalCustomers} (${customerPct}%)`} 
            />
            <div 
              style={{ width: `${providerPct || 33}%` }} 
              className="bg-amber-500 h-full transition-all duration-500" 
              title={`Providers: ${totalProviders} (${providerPct}%)`} 
            />
            <div 
              style={{ width: `${adminPct || 34}%` }} 
              className="bg-purple-600 h-full transition-all duration-500" 
              title={`Admins: ${totalAdmins} (${adminPct}%)`} 
            />
          </div>
          <div className="flex items-center space-x-5 text-xs text-[#78716C] pt-1 font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              <span>Customers: <strong className="text-[#1C1917]">{totalCustomers}</strong> ({customerPct}%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Providers: <strong className="text-[#1C1917]">{totalProviders}</strong> ({providerPct}%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
              <span>Admins: <strong className="text-[#1C1917]">{totalAdmins}</strong> ({adminPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Celebration Inquiries & Provider Acceptance Analytics Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Inquiry Lifecycle</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Active Workflow</span>
            </div>
            <h3 className="text-lg font-black text-[#1C1917] mt-0.5">Celebration Inquiries & Provider Performance</h3>
            <p className="text-xs text-[#78716C]">
              Real-time monitoring of customer requests across Halwai, Beautician, Decorator & DJ services, tracking provider acceptance and decline rates.
            </p>
          </div>
        </div>

        {/* Inquiry Summary KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#E7E0D8] shadow-sm">
            <div className="flex items-center justify-between text-[#78716C]">
              <span className="text-xs font-bold uppercase tracking-wider">Total Inquiries</span>
              <ClipboardList className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-2xl font-black text-[#1C1917] mt-2">
              {loading ? '...' : inquiryData?.summary?.totalInquiries ?? 0}
            </p>
            <p className="text-xs text-[#78716C] mt-1">Platform customer leads</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Accepted Requests</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-800 mt-2">
              {loading ? '...' : inquiryData?.summary?.acceptedCount ?? 0}
            </p>
            <div className="flex items-center space-x-1 text-xs text-emerald-700 mt-1 font-bold">
              <span>{inquiryData?.summary?.acceptanceRate ?? 0}% Acceptance Rate</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm bg-rose-50/20">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-xs font-bold uppercase tracking-wider">Declined / Rejected</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-800 mt-2">
              {loading ? '...' : inquiryData?.summary?.rejectedCount ?? 0}
            </p>
            <p className="text-xs text-rose-600 mt-1">Unavailable on date</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm bg-amber-50/20">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Decisions</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-800 mt-2">
              {loading ? '...' : inquiryData?.summary?.pendingCount ?? 0}
            </p>
            <p className="text-xs text-amber-700 mt-1 font-semibold">Awaiting provider action</p>
          </div>
        </div>

        {/* Per-Provider Request Acceptance Breakdown Table */}
        <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E7E0D8] flex items-center justify-between bg-[#FAF8F5]">
            <div>
              <h4 className="font-extrabold text-sm text-[#1C1917]">Provider Response & Fulfillment Analytics</h4>
              <p className="text-xs text-[#78716C]">Breakdown of inquiries received, accepted, and rejected by each verified service partner.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7E0D8] bg-[#FAF8F5]/60 text-[#78716C] text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-5">Provider Business</th>
                  <th className="py-3 px-4">Celebration Category</th>
                  <th className="py-3 px-4 text-center">Total Inquiries</th>
                  <th className="py-3 px-4 text-center">Accepted</th>
                  <th className="py-3 px-4 text-center">Declined</th>
                  <th className="py-3 px-4 text-center">Pending</th>
                  <th className="py-3 px-4">Acceptance Rate</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D8] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#78716C]">
                      Loading provider performance...
                    </td>
                  </tr>
                ) : !inquiryData?.providers || inquiryData.providers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#78716C]">
                      No provider inquiries registered yet.
                    </td>
                  </tr>
                ) : (
                  inquiryData.providers.map((p: any) => {
                    const isHighAcceptance = p.acceptanceRate >= 70;
                    return (
                      <tr key={p.vendorId} className="hover:bg-[#FAF8F5]/50 transition">
                        <td className="py-3 px-5">
                          <div className="font-extrabold text-[#1C1917]">{p.businessName}</div>
                          <div className="text-[11px] text-[#78716C]">📍 {p.city} • 📞 {p.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {p.categories?.map((cat: string) => (
                              <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-[#1C1917]">
                          {p.totalRequests}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800">
                            {p.acceptedCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-rose-100 text-rose-800">
                            {p.rejectedCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-800">
                            {p.pendingCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 min-w-[140px]">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-stone-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHighAcceptance ? 'bg-emerald-500' : p.acceptanceRate > 0 ? 'bg-amber-500' : 'bg-stone-400'
                                }`}
                                style={{ width: `${p.acceptanceRate}%` }}
                              />
                            </div>
                            <span className="font-bold text-xs text-[#1C1917]">{p.acceptanceRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            p.acceptedCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            p.pendingCount > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-stone-50 text-stone-600 border border-stone-200'
                          }`}>
                            {p.acceptedCount > 0 ? 'Active Partner' : p.pendingCount > 0 ? 'Pending Lead' : 'Ready'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent User Registrations Table */}
      <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E7E0D8] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <h3 className="font-extrabold text-base text-[#1C1917]">Recent Account Registrations</h3>
            <p className="text-xs text-[#78716C]">Newly registered users across customer, provider, and administrative roles.</p>
          </div>
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center space-x-1 text-xs font-bold text-primary hover:underline"
          >
            <span>View All Users</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E7E0D8] bg-[#FAF8F5]/60 text-[#78716C] text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E0D8] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#78716C]">
                    Loading user registry...
                  </td>
                </tr>
              ) : !stats?.recentUsers || stats.recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#78716C]">
                    No registered users found.
                  </td>
                </tr>
              ) : (
                stats.recentUsers.map((user: any) => {
                  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
                  const isBlocked = user.isBlocked || user.status === 'SUSPENDED';

                  return (
                    <tr key={user.id} className="hover:bg-[#FAF8F5]/50 transition">
                      <td className="py-3 px-5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white ${
                            user.role === 'ADMIN' ? 'bg-purple-600' : user.role === 'VENDOR' ? 'bg-secondary' : 'bg-primary'
                          }`}>
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              initial
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#1C1917]">{user.name}</p>
                            {user.vendorProfile ? (
                              <p className="text-[11px] text-amber-700 font-medium">{user.vendorProfile.businessName}</p>
                            ) : (
                              <p className="text-[11px] text-[#78716C] font-mono">ID: {user.id.slice(0, 8)}...</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Administrator
                          </span>
                        ) : user.role === 'VENDOR' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            Provider
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Customer
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#78716C]">
                        <p className="font-medium text-[#1C1917]">{user.email}</p>
                        <p className="text-[11px]">{user.phone || 'No phone'}</p>
                      </td>

                      <td className="py-3 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#78716C] font-medium">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => navigate('/users')}
                          className="px-2.5 py-1 text-xs font-bold text-primary hover:bg-amber-50 rounded-lg border border-amber-200 transition"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                <h3 className="font-extrabold text-sm text-[#1C1917]">Manage Providers</h3>
                <p className="text-xs text-[#78716C]">
                  Inspect submitted documents & approve vendor profiles.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-secondary" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/users')}
          className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50/70 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1C1917]">User Directory</h3>
                <p className="text-xs text-[#78716C]">
                  Manage all accounts, status, security & governance.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-blue-600" />
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
                  Dynamically adjust celebration categories.
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
