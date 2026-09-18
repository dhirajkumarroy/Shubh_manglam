import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { eventTypeService, EventTypeItem } from '../services/eventType.service';
import { SmartExcelImportModal } from '../components/SmartExcelImportModal';

export const EventTypesPage: React.FC = () => {
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showExcelModal, setShowExcelModal] = useState<boolean>(false);

  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [icon, setIcon] = useState<string>('🎉');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventTypeService.listEventTypes();
      setEventTypes(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load event types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const handleOpenCreate = () => {
    setName('');
    setDescription('');
    setIcon('🎉');
    setSortOrder(eventTypes.length + 1);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      await eventTypeService.createEventType({
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
      });

      setShowModal(false);
      fetchEventTypes();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error creating event type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (et: EventTypeItem) => {
    try {
      await eventTypeService.updateEventType(et.id, { isActive: !et.isActive });
      setEventTypes((prev) =>
        prev.map((item) => (item.id === et.id ? { ...item, isActive: !item.isActive } : item))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string, etName: string) => {
    if (!window.confirm(`Are you sure you want to delete celebration type "${etName}"?`)) return;

    try {
      await eventTypeService.deleteEventType(id);
      setEventTypes((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete');
    }
  };

  const filtered = eventTypes.filter(
    (et) =>
      et.name.toLowerCase().includes(search.toLowerCase()) ||
      et.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Celebration & Event Types</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Manage celebration categories like Wedding, Birthday, Puja, and Corporate Events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExcelModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#881337] to-[#C2410C] hover:from-[#6B0D2B] hover:to-[#9A3412] text-white rounded-xl shadow-sm transition font-medium text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Smart Excel Import</span>
          </button>

          <button
            onClick={fetchEventTypes}
            className="p-2.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm shadow-rose-200 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Celebration Type</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search celebration types by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Total: <span className="text-gray-900 font-semibold">{filtered.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-rose-500 mb-3" />
            <p className="text-sm">Loading celebration types...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-base font-semibold text-gray-700">No celebration types found</p>
            <p className="text-sm text-gray-400 mt-1">Try another search or click "Add Celebration Type".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-6">Celebration Type</th>
                  <th className="py-3.5 px-6">Slug</th>
                  <th className="py-3.5 px-6 text-center">Order</th>
                  <th className="py-3.5 px-6 text-center">Categories</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filtered.map((et) => (
                  <tr key={et.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{et.icon || '🎉'}</span>
                        <div>
                          <div className="font-semibold text-gray-900">{et.name}</div>
                          {et.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">{et.description}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-gray-500 font-mono text-xs">{et.slug}</td>

                    <td className="py-4 px-6 text-center text-gray-600 font-medium">{et.sortOrder}</td>

                    <td className="py-4 px-6 text-center">
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold">
                        {et._count?.categories || 0} categories
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleActive(et)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          et.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {et.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(et.id, et.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Celebration Type</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baby Shower, Golden Jubilee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  placeholder="🎉, 💍, 👶, 🎂"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Celebration details and traditions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Create Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Excel Import Modal */}
      <SmartExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onSuccess={fetchEventTypes}
        defaultTab="celebrations"
      />
    </div>
  );
};

export default EventTypesPage;
