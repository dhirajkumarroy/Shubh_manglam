import React from 'react';
import { 
  Users, 
  Store, 
  Calendar, 
  IndianRupee, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-secondary via-secondary-light to-primary rounded-2xl p-6 text-white shadow-sm">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Executive Console</span>
          <h2 className="text-2xl font-black mt-1">Welcome to Shubh Mangalam Admin</h2>
          <p className="text-rose-100 text-sm mt-1 leading-relaxed">
            Local celebration & event-services marketplace orchestration. Monitoring operations across Weddings, Birthdays, Teej, Pujas, Catering, Decorations, and Sound systems.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase">Total Bookings</span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-2">0</p>
          <div className="flex items-center text-xs text-[#78716C] mt-2">
            <span className="text-emerald-600 font-semibold flex items-center">
              Active <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
            <span className="ml-1">Across all celebrations</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase">Service Providers</span>
            <Store className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-2">0</p>
          <div className="flex items-center text-xs text-[#78716C] mt-2">
            <span className="text-amber-600 font-semibold">Pending Review: 0</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase">Registered Customers</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-2">0</p>
          <div className="flex items-center text-xs text-[#78716C] mt-2">
            <span>Customer base ready</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-xs font-bold uppercase">Gross Marketplace Volume</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-2">₹0</p>
          <div className="flex items-center text-xs text-[#78716C] mt-2">
            <span className="text-emerald-600 font-semibold">Escrow secure</span>
          </div>
        </div>
      </div>

      {/* Target Roadmap Preview */}
      <div className="bg-white rounded-xl p-6 border border-[#E7E0D8] shadow-sm">
        <h3 className="text-base font-bold text-[#1C1917] mb-3">Multi-Application Architecture Foundation</h3>
        <p className="text-xs text-[#78716C] mb-4">
          All client applications connect to the unified backend API layer:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-amber-200 bg-[#FEF3C7]/40">
            <div className="flex items-center space-x-2 text-primary font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Customer Mobile App</span>
            </div>
            <p className="text-xs text-[#57534E] mt-1">
              Event planning, occasion browsing, provider discovery, booking and payments.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
            <div className="flex items-center space-x-2 text-secondary font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Provider Mobile App</span>
            </div>
            <p className="text-xs text-[#57534E] mt-1">
              Vendor registration, catalog & package listing, lead response, and order dispatch.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Admin Web Portal</span>
            </div>
            <p className="text-xs text-[#57534E] mt-1">
              Full marketplace governance, vendor approval, dispute management, and analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
