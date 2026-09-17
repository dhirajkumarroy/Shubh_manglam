import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Store, 
  User, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  ExternalLink 
} from 'lucide-react';
import { adminVendorService, VendorDetailsResponse } from '../services/vendor.service';

export const VendorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<VendorDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showDocRejectModal, setShowDocRejectModal] = useState<boolean>(false);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [docRejectionReason, setDocRejectionReason] = useState<string>('');

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await adminVendorService.getVendor(id);
      setVendor(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleApproveVendor = async () => {
    if (!id || !confirm('Are you sure you want to approve this vendor?')) return;
    try {
      setActionLoading(true);
      await adminVendorService.approveVendor(id);
      await fetchDetails();
      alert('Vendor approved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to approve vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectVendor = async () => {
    if (!id) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      alert('Please provide a rejection reason of at least 5 characters.');
      return;
    }
    try {
      setActionLoading(true);
      await adminVendorService.rejectVendor(id, rejectionReason.trim());
      setShowRejectModal(false);
      setRejectionReason('');
      await fetchDetails();
      alert('Vendor application rejected.');
    } catch (err: any) {
      alert(err.message || 'Failed to reject vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendVendor = async () => {
    if (!id || !confirm('Are you sure you want to suspend this vendor account?')) return;
    try {
      setActionLoading(true);
      await adminVendorService.suspendVendor(id, 'Suspended by admin review');
      await fetchDetails();
      alert('Vendor suspended.');
    } catch (err: any) {
      alert(err.message || 'Failed to suspend vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateVendor = async () => {
    if (!id || !confirm('Reactivate this vendor to APPROVED status?')) return;
    try {
      setActionLoading(true);
      await adminVendorService.reactivateVendor(id);
      await fetchDetails();
      alert('Vendor reactivated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveDocument = async (docId: string) => {
    if (!id) return;
    try {
      setActionLoading(true);
      await adminVendorService.reviewDocument(id, docId, 'APPROVED');
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to approve document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDocument = async () => {
    if (!id || !selectedDocId) return;
    if (!docRejectionReason.trim()) {
      alert('Please specify why this document is being rejected.');
      return;
    }
    try {
      setActionLoading(true);
      await adminVendorService.reviewDocument(id, selectedDocId, 'REJECTED', docRejectionReason.trim());
      setShowDocRejectModal(false);
      setSelectedDocId('');
      setDocRejectionReason('');
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to reject document');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-[#78716C]">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
        <p className="font-semibold text-sm">Loading vendor dossier...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-16 text-center text-red-600">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
        <p className="font-bold text-base">{error || 'Vendor not found'}</p>
        <button
          onClick={() => navigate('/providers')}
          className="mt-4 px-4 py-2 bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl text-xs font-bold text-[#1C1917]"
        >
          ← Return to Vendor List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/providers')}
          className="flex items-center space-x-2 text-xs font-bold text-[#57534E] hover:text-[#1C1917] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Providers</span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {vendor.status === 'UNDER_REVIEW' || vendor.status === 'PENDING' ? (
            <>
              <button
                onClick={handleApproveVendor}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Vendor</span>
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Application</span>
              </button>
            </>
          ) : vendor.status === 'APPROVED' ? (
            <button
              onClick={handleSuspendVendor}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-4 py-2 bg-neutral-800 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Suspend Account</span>
            </button>
          ) : vendor.status === 'SUSPENDED' ? (
            <button
              onClick={handleReactivateVendor}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Reactivate Vendor</span>
            </button>
          ) : vendor.status === 'REJECTED' ? (
            <button
              onClick={handleApproveVendor}
              disabled={actionLoading}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Re-evaluate & Approve</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Hero Dossier Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#E7E0D8] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary font-black text-xl flex items-center justify-center border border-secondary/20">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-black text-[#1C1917]">{vendor.businessName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-primary border border-amber-300">
                  {vendor.status}
                </span>
                {vendor.isVerified && (
                  <span className="inline-flex items-center text-xs font-bold text-emerald-700">
                    <ShieldCheck className="w-4 h-4 mr-1" /> Verified Partner
                  </span>
                )}
              </div>
              <p className="text-xs text-[#78716C] mt-1">
                Registered on {new Date(vendor.createdAt).toLocaleDateString()} • ID: {vendor.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Details & Owner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Business Profile */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E0D8] shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#1C1917] flex items-center space-x-2">
            <Store className="w-4 h-4 text-primary" />
            <span>Business Information</span>
          </h3>
          <div className="text-xs space-y-2 text-[#57534E]">
            <p>
              <strong className="text-[#1C1917]">Description:</strong>{' '}
              {vendor.description || 'No description provided'}
            </p>
            <p>
              <strong className="text-[#1C1917]">Business Phone:</strong> {vendor.phone}
            </p>
            <p>
              <strong className="text-[#1C1917]">Business Email:</strong> {vendor.email || 'N/A'}
            </p>
            <p>
              <strong className="text-[#1C1917]">Operating Radius:</strong> {vendor.operatingRadiusKm} km
            </p>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E0D8] shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#1C1917] flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-secondary" />
            <span>Location & Address</span>
          </h3>
          <div className="text-xs space-y-2 text-[#57534E]">
            <p>
              <strong className="text-[#1C1917]">Address:</strong> {vendor.addressLine1}
            </p>
            {vendor.addressLine2 && (
              <p>
                <strong className="text-[#1C1917]">Line 2:</strong> {vendor.addressLine2}
              </p>
            )}
            <p>
              <strong className="text-[#1C1917]">City / State:</strong> {vendor.city}, {vendor.state}
            </p>
            <p>
              <strong className="text-[#1C1917]">Pincode:</strong> {vendor.pincode}
            </p>
            <p>
              <strong className="text-[#1C1917]">Coordinates (GPS):</strong>{' '}
              {vendor.latitude.toFixed(4)}, {vendor.longitude.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Owner Information */}
        <div className="bg-white rounded-2xl p-6 border border-[#E7E0D8] shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-[#1C1917] flex items-center space-x-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Account Owner</span>
          </h3>
          <div className="text-xs space-y-2 text-[#57534E]">
            <p>
              <strong className="text-[#1C1917]">Owner Name:</strong> {vendor.owner.name}
            </p>
            <p>
              <strong className="text-[#1C1917]">Account Email:</strong> {vendor.owner.email}
            </p>
            <p>
              <strong className="text-[#1C1917]">Account Phone:</strong> {vendor.owner.phone}
            </p>
            <p>
              <strong className="text-[#1C1917]">User ID:</strong> {vendor.owner.id}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Categories */}
      <div className="bg-white rounded-2xl p-6 border border-[#E7E0D8] shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#1C1917]">Selected Event Categories</h3>
        {vendor.categories.length === 0 ? (
          <p className="text-xs text-[#A8A29E]">No categories selected by this provider.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {vendor.categories.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#FEF3C7] text-primary font-bold text-xs border border-amber-200"
              >
                <span>{c.icon || '🎪'}</span>
                <span>{c.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Verification Documents Table */}
      <div className="bg-white rounded-2xl p-6 border border-[#E7E0D8] shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#1C1917] flex items-center space-x-2">
          <FileText className="w-4 h-4 text-primary" />
          <span>Submitted Verification Documents</span>
        </h3>

        {vendor.documents.length === 0 ? (
          <p className="text-xs text-[#A8A29E]">No verification documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {vendor.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-[#E7E0D8] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-xs text-[#1C1917]">
                      {doc.documentType.replace('_', ' ')}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-primary font-semibold hover:underline mt-1"
                  >
                    <span>Inspect File: {doc.documentUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {doc.rejectionReason && (
                    <p className="text-xs text-rose-700 mt-1 font-medium">
                      Rejection Reason: {doc.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {doc.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleApproveDocument(doc.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                    >
                      Approve Doc
                    </button>
                  )}
                  {doc.status !== 'REJECTED' && (
                    <button
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setShowDocRejectModal(true);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition"
                    >
                      Reject Doc
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Vendor Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-black text-[#1C1917]">Reject Vendor Application</h3>
            <p className="text-xs text-[#78716C]">
              Specify the reason why this vendor application requires changes. The provider will see this explanation in their mobile app to rectify requirements.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Government registration document is blurred or incomplete. Please upload high-resolution scan."
              className="w-full p-3 rounded-xl border border-[#E7E0D8] text-xs focus:outline-none focus:border-rose-600 text-[#1C1917]"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#57534E] hover:bg-[#F5EFE6]"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectVendor}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Document Modal */}
      {showDocRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-black text-[#1C1917]">Reject Verification Document</h3>
            <p className="text-xs text-[#78716C]">
              Explain what is invalid about this specific document (e.g. expired, incorrect name, illegible).
            </p>
            <textarea
              rows={3}
              value={docRejectionReason}
              onChange={(e) => setDocRejectionReason(e.target.value)}
              placeholder="e.g. The uploaded electricity bill does not match the registered business address."
              className="w-full p-3 rounded-xl border border-[#E7E0D8] text-xs focus:outline-none focus:border-rose-600 text-[#1C1917]"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDocRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#57534E] hover:bg-[#F5EFE6]"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDocument}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700"
              >
                Reject Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetailsPage;
