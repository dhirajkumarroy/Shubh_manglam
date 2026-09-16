import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Calendar, 
  Tag, 
  CreditCard, 
  Star, 
  Settings, 
  Bell 
} from 'lucide-react';

const NAVIGATION_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Service Providers', path: '/providers', icon: Store },
  { name: 'Customers', path: '/users', icon: Users },
  { name: 'Event Bookings', path: '/bookings', icon: Calendar },
  { name: 'Categories & Services', path: '/services', icon: Tag },
  { name: 'Payments & Payouts', path: '/payments', icon: CreditCard },
  { name: 'Reviews & Quality', path: '/reviews', icon: Star },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E7E0D8] flex flex-col fixed inset-y-0">
        {/* Brand */}
        <div className="p-6 border-b border-[#E7E0D8]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-lg shadow-sm">
              SM
            </div>
            <div>
              <h1 className="font-extrabold text-base text-[#1C1917] tracking-tight">Shubh Mangalam</h1>
              <p className="text-xs text-primary font-medium">Admin Central Console</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                  isActive
                    ? 'bg-[#FEF3C7] text-primary border border-amber-200'
                    : 'text-[#57534E] hover:bg-[#F5EFE6] hover:text-[#1C1917]'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#E7E0D8] bg-[#FAF8F5]">
          <div className="text-xs text-[#78716C]">
            <p className="font-semibold text-[#1C1917]">Shubh Mangalam Platform</p>
            <p>Phase 0: Multi-App Foundation</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[#E7E0D8] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              System Online
            </span>
            <span className="text-xs text-[#78716C]">Har Function, Ek App</span>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg text-[#78716C] hover:bg-[#F5EFE6] relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
            </button>
            <div className="flex items-center space-x-3 pl-4 border-l border-[#E7E0D8]">
              <div className="w-8 h-8 rounded-full bg-secondary text-white font-bold flex items-center justify-center text-xs">
                AD
              </div>
              <div>
                <p className="text-xs font-bold text-[#1C1917]">Administrator</p>
                <p className="text-[10px] text-[#78716C]">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
