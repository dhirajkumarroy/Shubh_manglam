import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  FileText,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  adminVendorService,
  DocumentRequirement
} from '../services/vendor.service';

const COMMON_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export const DocumentRequirementsPage: React.FC = () => {
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [requiredFilter, setRequiredFilter] = useState<'ALL' | 'REQUIRED' | 'OPTIONAL'>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DocumentRequirement | null>(null);

  // Form Fields
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('IDENTITY_PROOF');
  const [isRequired, setIsRequired] = useState<boolean>(true);
  const [acceptedFileTypes, setAcceptedFileTypes] = useState<string[]>(COMMON_FILE_TYPES);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Delete modal state
  const [deletingItem, setDeletingItem] = useState<DocumentRequirement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await adminVendorService.listDocumentRequirements();
      setRequirements(list || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch document requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setCode('');
    setName('');
    setDescription('');
    setDocumentType('IDENTITY_PROOF');
    setIsRequired(true);
    setAcceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png']);
    setMaxFileSizeMb(10);
    setSortOrder(requirements.length + 1);
    setIsActive(true);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item: DocumentRequirement) => {
    setEditingItem(item);
    setCode(item.code);
    setName(item.name);
    setDescription(item.description || '');
    setDocumentType(item.documentType);
    setIsRequired(item.isRequired);
    setAcceptedFileTypes(item.acceptedFileTypes || COMMON_FILE_TYPES);
    setMaxFileSizeMb(item.maxFileSizeMb);
    setSortOrder(item.sortOrder);
    setIsActive(item.isActive);
    setFormError('');
    setShowModal(true);
  };

  const handleToggleFileType = (type: string) => {
    setAcceptedFileTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!code.trim() || !name.trim() || !documentType.trim()) {
      setFormError('Code, display name, and document type are required.');
      return;
    }

    if (acceptedFileTypes.length === 0) {
      setFormError('Please select at least one accepted file format.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase().replace(/\s+/g, '_'),
        name: name.trim(),
        description: description.trim() || undefined,
        documentType: documentType.trim().toUpperCase(),
        isRequired,
        acceptedFileTypes,
        maxFileSizeMb: Number(maxFileSizeMb) || 10,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      };

      if (editingItem) {
        await adminVendorService.updateDocumentRequirement(editingItem.id, payload);
      } else {
        await adminVendorService.createDocumentRequirement(payload);
      }

      setShowModal(false);
      await fetchRequirements();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save document requirement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: DocumentRequirement) => {
    try {
      await adminVendorService.updateDocumentRequirement(item.id, {
        isActive: !item.isActive,
      });
      await fetchRequirements();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    try {
      await adminVendorService.deleteDocumentRequirement(deletingItem.id);
      setDeletingItem(null);
      await fetchRequirements();
    } catch (err: any) {
      alert(err.message || 'Failed to delete requirement');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredRequirements = requirements.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && item.isActive) ||
      (statusFilter === 'INACTIVE' && !item.isActive);

    const matchesRequired =
      requiredFilter === 'ALL' ||
      (requiredFilter === 'REQUIRED' && item.isRequired) ||
      (requiredFilter === 'OPTIONAL' && !item.isRequired);

    return matchesSearch && matchesStatus && matchesRequired;
  });

  const totalCount = requirements.length;
  const requiredCount = requirements.filter((r) => r.isRequired).length;
  const activeCount = requirements.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">
                Partner Onboarding Verification Rules
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Dynamically define required documents, file constraints, and verification criteria for Partners.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchRequirements}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#E7E0D8] bg-white text-[#57534E] hover:bg-[#F5EFE6] transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-[#801216] shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Verification Rule</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E7E0D8] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#78716C] font-semibold">Total Configured Rules</p>
            <p className="text-2xl font-black text-[#1C1917] mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-primary">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E7E0D8] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#78716C] font-semibold">Mandatory Requirements</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{requiredCount}</p>
          </div>
          <div className="p-3 bg-amber-100/70 rounded-xl text-amber-800">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E7E0D8] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-[#78716C] font-semibold">Currently Active for Onboarding</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E0D8] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
          <input
            type="text"
            placeholder="Search by rule name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E7E0D8] bg-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Mandatory Filter */}
          <div className="flex items-center space-x-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E7E0D8] text-xs">
            <button
              onClick={() => setRequiredFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                requiredFilter === 'ALL' ? 'bg-white text-primary shadow-xs' : 'text-[#78716C]'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setRequiredFilter('REQUIRED')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                requiredFilter === 'REQUIRED' ? 'bg-white text-amber-900 shadow-xs' : 'text-[#78716C]'
              }`}
            >
              Mandatory
            </button>
            <button
              onClick={() => setRequiredFilter('OPTIONAL')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                requiredFilter === 'OPTIONAL' ? 'bg-white text-[#1C1917] shadow-xs' : 'text-[#78716C]'
              }`}
            >
              Optional
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E7E0D8] text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'ALL' ? 'bg-white text-primary shadow-xs' : 'text-[#78716C]'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-[#78716C]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                statusFilter === 'INACTIVE' ? 'bg-white text-rose-700 shadow-xs' : 'text-[#78716C]'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchRequirements} className="underline font-bold">
            Retry
          </button>
        </div>
      )}

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#78716C] text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            Loading onboarding verification rules...
          </div>
        ) : filteredRequirements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileCheck className="w-10 h-10 text-[#D6D3D1] mx-auto" />
            <p className="text-sm font-bold text-[#1C1917]">No Document Requirements Found</p>
            <p className="text-xs text-[#78716C]">
              {search
                ? 'Try adjusting your search filters.'
                : 'Click "Add Verification Rule" above to create your first onboarding requirement.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7E0D8] bg-[#FAF8F5] text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Requirement Name & Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Accepted Formats</th>
                  <th className="py-3 px-4">Max Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D8] text-xs">
                {filteredRequirements.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F5] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#78716C]">
                      #{item.sortOrder}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-[#1C1917]">{item.name}</p>
                        <p className="font-mono text-[10px] text-primary mt-0.5">{item.code}</p>
                        {item.description && (
                          <p className="text-[11px] text-[#78716C] mt-1 max-w-sm line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF8F5] text-[#57534E] border border-[#E7E0D8]">
                        {item.documentType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.isRequired ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          MANDATORY
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                          OPTIONAL
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.acceptedFileTypes.map((type) => {
                          const label = type.replace('application/', '').replace('image/', '').toUpperCase();
                          return (
                            <span
                              key={type}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-stone-100 text-stone-700 border border-stone-200"
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#57534E]">
                      {item.maxFileSizeMb} MB
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="inline-flex items-center space-x-1.5 focus:outline-none"
                        title={item.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {item.isActive ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold">
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[#A8A29E] font-semibold">
                            <ToggleLeft className="w-5 h-5 text-[#A8A29E]" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-[#57534E] hover:bg-[#F5EFE6] hover:text-[#1C1917] transition"
                          title="Edit rule"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                          title="Delete rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E7E0D8] space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#E7E0D8] pb-3">
              <h3 className="font-bold text-base text-[#1C1917]">
                {editingItem ? 'Edit Verification Requirement' : 'Add New Verification Requirement'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-[#78716C] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    Rule Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AADHAAR_CARD"
                    disabled={!!editingItem}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7E0D8] font-mono focus:outline-none focus:border-primary disabled:bg-stone-100"
                  />
                  <p className="text-[10px] text-[#A8A29E] mt-1">Unique machine identifier</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    Document Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value.toUpperCase())}
                    placeholder="IDENTITY_PROOF"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7E0D8] font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">
                  Display Title (shown to Partner) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aadhaar Card of Proprietor / Owner"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7E0D8] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1">
                  Instructions & Guidelines for Partner
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Upload clear front & back copy. Must be legible and government-issued."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7E0D8] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={maxFileSizeMb}
                    onChange={(e) => setMaxFileSizeMb(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7E0D8] focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7E0D8] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Accepted Formats */}
              <div>
                <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                  Allowed File Formats
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_FILE_TYPES.map((type) => {
                    const isChecked = acceptedFileTypes.includes(type);
                    const label = type.replace('application/', '').replace('image/', '').toUpperCase();
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => handleToggleFileType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          isChecked
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-[#78716C] border-[#E7E0D8]'
                        }`}
                      >
                        {label} {isChecked ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="pt-2 space-y-2 border-t border-[#E7E0D8]">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-[#D6D3D1]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1C1917]">Mandatory Requirement</p>
                    <p className="text-[10px] text-[#78716C]">
                      Partner cannot be fully verified without submitting this document
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-[#D6D3D1]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1C1917]">Active Requirement</p>
                    <p className="text-[10px] text-[#78716C]">
                      Display this rule to Partners in their onboarding checklist
                    </p>
                  </div>
                </label>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-[#E7E0D8] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#78716C] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-[#801216] transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Requirement' : 'Create Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E7E0D8] space-y-4">
            <h3 className="text-base font-black text-rose-700">Delete Verification Rule</h3>
            <p className="text-xs text-[#78716C]">
              Are you sure you want to delete <strong>{deletingItem.name}</strong> ({deletingItem.code})?
              Partners will no longer be prompted for this requirement.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#78716C] hover:bg-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRequirementsPage;
