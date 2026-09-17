import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Building,
  Tag,
} from 'lucide-react';
import { adminCatalogService, AdminServiceItem } from '../services/catalog.service';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<AdminServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<AdminServiceItem | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const isActiveParam =
        statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined;
      const data = await adminCatalogService.listServices({
        search: search.trim() || undefined,
        isActive: isActiveParam,
        limit: 100,
      });
      setServices(data.services || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [statusFilter]);

  const handleToggleStatus = async (service: AdminServiceItem) => {
    const action = service.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} "${service.name}"?`)) {
      return;
    }

    try {
      await adminCatalogService.updateServiceStatus(service.id, !service.isActive);
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Failed to update service status.');
    }
  };

  const formatPrice = (svc: AdminServiceItem) => {
    if (svc.pricingType === 'CUSTOM_QUOTE') {
      return `₹${svc.minPrice?.toLocaleString() || 0} - ₹${svc.maxPrice?.toLocaleString() || 0}`;
    }
    return `₹${svc.basePrice?.toLocaleString() || 0}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="text-primary" size={26} />
            Service Catalog Governance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Moderate, search, and audit vendor celebration services across India.
          </p>
        </div>
        <button
          onClick={fetchServices}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchServices();
          }}
          className="relative w-full md:w-96"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by service name or business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold uppercase text-gray-500">Status:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Services Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-3.5">Service Details</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Vendor</th>
                <th className="px-6 py-3.5">Pricing</th>
                <th className="px-6 py-3.5">Platform Status</th>
                <th className="px-6 py-3.5 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                    Loading catalog services...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No services found matching filters.
                  </td>
                </tr>
              ) : (
                services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{svc.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{svc.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        <Tag size={12} />
                        {svc.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 flex items-center gap-1.5">
                        <Building size={14} className="text-gray-400" />
                        {svc.vendor?.businessName || 'Unknown Vendor'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        📍 {svc.vendor?.city || 'India'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{formatPrice(svc)}</div>
                      <div className="text-xs text-gray-500 uppercase font-semibold">
                        {svc.pricingType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {svc.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <XCircle size={12} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedService(svc)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(svc)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            svc.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {svc.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedService.name}</h3>
            <p className="text-xs text-gray-500 mb-4 font-mono">ID: {selectedService.id}</p>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="font-semibold block text-gray-900">Description:</span>
                <p className="mt-1 text-gray-600 text-xs">
                  {selectedService.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <span className="text-gray-500">Category:</span>
                  <p className="font-semibold text-gray-900">{selectedService.category?.name}</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <span className="text-gray-500">Vendor:</span>
                  <p className="font-semibold text-gray-900">{selectedService.vendor?.businessName}</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <span className="text-gray-500">Pricing Model:</span>
                  <p className="font-semibold text-gray-900">{selectedService.pricingType}</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <span className="text-gray-500">Price:</span>
                  <p className="font-semibold text-gray-900">{formatPrice(selectedService)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
