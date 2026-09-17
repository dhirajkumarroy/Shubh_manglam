import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Shield, 
  Store, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  Ban,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { adminUserService, UserItem } from '../services/user.service';
import { adminVendorService } from '../services/vendor.service';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isBlockedFilter, setIsBlockedFilter] = useState<string>('ALL');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [actionUser, setActionUser] = useState<{ user: UserItem; action: 'BLOCK' | 'UNBLOCK' } | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch Dashboard Stats for user metrics
  const fetchStats = async () => {
    try {
      const data = await adminVendorService.getDashboardStats();
      setStats(data);
    } catch {
      // ignore
    }
  };

  // Fetch Users
  const fetchUsers = useCallback(async (pageToFetch: number = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page: pageToFetch,
        limit: 10,
      };

      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (isBlockedFilter === 'BLOCKED') params.isBlocked = true;
      if (isBlockedFilter === 'ACTIVE') params.isBlocked = false;

      const res = await adminUserService.listUsers(params);
      setUsers(res.users || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, isBlockedFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage);
    }
  };

  // Handle Block / Unblock User
  const handleConfirmAction = async () => {
    if (!actionUser) return;
    try {
      setActionLoading(true);
      setActionError(null);
      if (actionUser.action === 'BLOCK') {
        await adminUserService.blockUser(actionUser.user.id);
      } else {
        await adminUserService.unblockUser(actionUser.user.id);
      }
      setActionUser(null);
      fetchUsers(pagination.page);
      fetchStats();
    } catch (err: any) {
      setActionError(err.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3 mr-1" />
            Administrator
          </span>
        );
      case 'VENDOR':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Store className="w-3 h-3 mr-1" />
            Provider
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Users className="w-3 h-3 mr-1" />
            Customer
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">User Directory & Analytics</h1>
            <span className="bg-[#FEF3C7] text-primary text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              {stats?.totalUsers ?? pagination.total} Total Registered
            </span>
          </div>
          <p className="text-sm text-[#78716C] mt-1">
            Real-time accounts registry, customer profiles, vendor credentials, and governance control.
          </p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchUsers(pagination.page);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl text-xs font-bold text-[#1C1917] shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Real-time Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="bg-white p-4 rounded-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-[11px] font-bold uppercase tracking-wider">All Accounts</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-1">
            {stats?.totalUsers ?? pagination.total}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            100% in database
          </p>
        </div>

        {/* Total Customers */}
        <div 
          onClick={() => setRoleFilter('CUSTOMER')}
          className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition ${
            roleFilter === 'CUSTOMER' ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500' : 'border-[#E7E0D8] hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Customers</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-900 mt-1">
            {stats?.totalCustomers ?? users.filter(u => u.role === 'CUSTOMER').length}
          </p>
          <p className="text-[11px] text-[#78716C] font-semibold mt-1">
            Event planners & buyers
          </p>
        </div>

        {/* Total Providers */}
        <div 
          onClick={() => setRoleFilter('VENDOR')}
          className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition ${
            roleFilter === 'VENDOR' ? 'border-amber-500 bg-amber-50/20 ring-1 ring-amber-500' : 'border-[#E7E0D8] hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Providers</span>
            <Store className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-2xl font-black text-secondary mt-1">
            {stats?.totalProviders ?? users.filter(u => u.role === 'VENDOR').length}
          </p>
          <p className="text-[11px] text-[#78716C] font-semibold mt-1">
            Celebration vendors
          </p>
        </div>

        {/* Total Admins */}
        <div 
          onClick={() => setRoleFilter('ADMIN')}
          className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition ${
            roleFilter === 'ADMIN' ? 'border-purple-500 bg-purple-50/20 ring-1 ring-purple-500' : 'border-[#E7E0D8] hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Admins</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-900 mt-1">
            {stats?.totalAdmins ?? users.filter(u => u.role === 'ADMIN').length}
          </p>
          <p className="text-[11px] text-[#78716C] font-semibold mt-1">
            System controllers
          </p>
        </div>

        {/* Account Health */}
        <div className="bg-white p-4 rounded-xl border border-[#E7E0D8] shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Status & Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-1">
            {stats?.totalActiveUsers ?? 0} <span className="text-xs font-normal text-[#78716C]">active</span>
          </p>
          <p className="text-[11px] text-[#78716C] font-semibold mt-1">
            <span className="text-emerald-700 font-bold">{stats?.totalVerifiedUsers ?? 0} verified</span>
            {' • '}
            <span className="text-red-600 font-bold">{stats?.totalBlockedUsers ?? 0} blocked</span>
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E0D8] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C]" />
            <input
              type="text"
              placeholder="Search by name, email, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl focus:outline-none focus:border-primary focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center space-x-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E7E0D8] overflow-x-auto">
            {[
              { label: 'All Roles', value: 'ALL' },
              { label: 'Customers', value: 'CUSTOMER' },
              { label: 'Providers', value: 'VENDOR' },
              { label: 'Admins', value: 'ADMIN' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setRoleFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  roleFilter === tab.value
                    ? 'bg-white text-primary shadow-sm border border-amber-200'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Account Status Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={isBlockedFilter}
              onChange={(e) => setIsBlockedFilter(e.target.value)}
              className="py-2.5 px-3 text-xs font-semibold bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl focus:outline-none focus:border-primary text-[#1C1917]"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active (Not Blocked)</option>
              <option value="BLOCKED">Blocked Accounts</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(search || roleFilter !== 'ALL' || isBlockedFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('ALL');
                setIsBlockedFilter('ALL');
              }}
              className="px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E7E0D8] bg-[#FAF8F5]/80 text-[#78716C] text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5 font-bold">User Account</th>
                <th className="py-3.5 px-4 font-bold">Contact Details</th>
                <th className="py-3.5 px-4 font-bold">Role</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Verification</th>
                <th className="py-3.5 px-4 font-bold">Registered</th>
                <th className="py-3.5 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E0D8] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#78716C]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <p className="font-semibold text-xs">Loading accounts registry...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#78716C]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-neutral-300" />
                      <p className="font-bold text-sm text-[#1C1917]">No users matched your criteria</p>
                      <p className="text-xs text-[#78716C]">Try modifying your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
                  const isBlocked = user.isBlocked || user.status === 'SUSPENDED';

                  return (
                    <tr key={user.id} className="hover:bg-[#FAF8F5]/60 transition">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white ${
                            user.role === 'ADMIN' ? 'bg-purple-600' : user.role === 'VENDOR' ? 'bg-secondary' : 'bg-primary'
                          }`}>
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              initial
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#1C1917] leading-tight">{user.name}</p>
                            {user.vendorProfile ? (
                              <p className="text-xs text-amber-700 font-semibold mt-0.5 flex items-center">
                                <Store className="w-3 h-3 mr-1" />
                                {user.vendorProfile.businessName}
                              </p>
                            ) : (
                              <p className="text-xs text-[#78716C] font-mono mt-0.5">ID: {user.id.slice(0, 8)}...</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs text-[#1C1917] flex items-center font-medium">
                            <Mail className="w-3 h-3 mr-1 text-[#78716C]" />
                            {user.email}
                          </p>
                          <p className="text-xs text-[#78716C] flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-[#78716C]" />
                            {user.phone || 'No phone'}
                          </p>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Email Verification */}
                      <td className="py-3.5 px-4">
                        {user.emailVerified ? (
                          <span className="inline-flex items-center text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-semibold text-[#78716C]">
                            <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-xs text-[#78716C] font-medium whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-[#78716C]" />
                          {new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5] rounded-lg border border-[#E7E0D8] transition"
                            title="View User Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {user.role !== 'ADMIN' && (
                            isBlocked ? (
                              <button
                                onClick={() => setActionUser({ user, action: 'UNBLOCK' })}
                                className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center space-x-1"
                                title="Unblock Account"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Unblock</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setActionUser({ user, action: 'BLOCK' })}
                                className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition flex items-center space-x-1"
                                title="Block Account"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Block</span>
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-[#E7E0D8] flex flex-col md:flex-row items-center justify-between gap-3 bg-[#FAF8F5]/50">
          <p className="text-xs text-[#78716C] font-medium">
            Showing <span className="font-bold text-[#1C1917]">{users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-[#1C1917]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-bold text-[#1C1917]">{pagination.total}</span> users
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg border border-[#E7E0D8] bg-white text-[#57534E] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold px-3 py-1 bg-white border border-[#E7E0D8] rounded-lg">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-[#E7E0D8] bg-white text-[#57534E] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E7E0D8] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E7E0D8] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base text-white ${
                  selectedUser.role === 'ADMIN' ? 'bg-purple-600' : selectedUser.role === 'VENDOR' ? 'bg-secondary' : 'bg-primary'
                }`}>
                  {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1C1917]">{selectedUser.name}</h3>
                  <p className="text-xs text-[#78716C]">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-[#78716C] hover:text-[#1C1917] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E7E0D8]">
                  <span className="text-[#78716C] font-medium">Account Role</span>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E7E0D8]">
                  <span className="text-[#78716C] font-medium">Account Status</span>
                  <p className="mt-1 font-bold text-[#1C1917]">
                    {selectedUser.isBlocked ? (
                      <span className="text-rose-600">Blocked / Suspended</span>
                    ) : (
                      <span className="text-emerald-600">Active</span>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E7E0D8]">
                  <span className="text-[#78716C] font-medium">Phone Number</span>
                  <p className="mt-1 font-bold text-[#1C1917]">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E7E0D8]">
                  <span className="text-[#78716C] font-medium">Email Verification</span>
                  <p className="mt-1 font-bold text-[#1C1917]">
                    {selectedUser.emailVerified ? 'Verified' : 'Unverified'}
                  </p>
                </div>
              </div>

              {selectedUser.vendorProfile && (
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center">
                      <Store className="w-4 h-4 mr-1.5 text-secondary" />
                      Associated Provider Profile
                    </span>
                    <span className="text-xs px-2 py-0.5 font-bold rounded-full bg-amber-200 text-amber-900">
                      {selectedUser.vendorProfile.status}
                    </span>
                  </div>
                  <p className="font-extrabold text-sm text-[#1C1917]">
                    {selectedUser.vendorProfile.businessName}
                  </p>
                  <p className="text-xs text-[#78716C]">
                    Verified Status: {selectedUser.vendorProfile.isVerified ? 'KYC Verified' : 'Pending Verification'}
                  </p>
                </div>
              )}

              <div className="space-y-1 text-xs text-[#78716C] pt-2 border-t border-[#E7E0D8]">
                <p>System User ID: <span className="font-mono text-[#1C1917]">{selectedUser.id}</span></p>
                <p>Registered Date: <span className="font-semibold text-[#1C1917]">{new Date(selectedUser.createdAt).toLocaleString('en-IN')}</span></p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E7E0D8] flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-white hover:bg-[#F5EFE6] border border-[#E7E0D8] rounded-xl text-xs font-bold text-[#1C1917] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block / Unblock Confirmation Modal */}
      {actionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E7E0D8] shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                actionUser.action === 'BLOCK' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {actionUser.action === 'BLOCK' ? <Ban className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-[#1C1917]">
                  {actionUser.action === 'BLOCK' ? 'Block User Account' : 'Unblock User Account'}
                </h3>
                <p className="text-xs text-[#78716C]">{actionUser.user.name} ({actionUser.user.email})</p>
              </div>
            </div>

            <p className="text-xs text-[#57534E] leading-relaxed">
              {actionUser.action === 'BLOCK'
                ? 'Are you sure you want to block this user? They will be immediately logged out and prevented from accessing the customer marketplace or provider portal.'
                : 'Are you sure you want to unblock this user? Their account will be restored to active standing and they will be able to log in normally.'}
            </p>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setActionUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F5EFE6] border border-[#E7E0D8] rounded-xl text-xs font-bold text-[#57534E] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center space-x-1.5 ${
                  actionUser.action === 'BLOCK'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{actionUser.action === 'BLOCK' ? 'Confirm Block' : 'Confirm Unblock'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
