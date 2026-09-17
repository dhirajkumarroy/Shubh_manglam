import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import colors from '../theme/colors';
import { VendorDocumentItem } from '../types';

const DOCUMENT_TYPES = [
  { label: 'Identity Proof (Aadhaar / Voter ID)', value: 'IDENTITY_PROOF' },
  { label: 'Business Registration / GST', value: 'BUSINESS_REGISTRATION' },
  { label: 'Address Proof (Electricity / Rent)', value: 'ADDRESS_PROOF' },
  { label: 'Tax Document (PAN Card)', value: 'TAX_DOCUMENT' },
  { label: 'Trade Certificate / FSSAI', value: 'CERTIFICATE' },
  { label: 'Other Verification Document', value: 'OTHER' },
] as const;

interface DocumentUploaderProps {
  documents: VendorDocumentItem[];
  onAddDocument: (doc: { documentType: string; documentUrl: string }) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
  isUploading?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documents,
  onAddDocument,
  onDeleteDocument,
  isUploading = false,
}) => {
  const [selectedType, setSelectedType] = useState<string>('IDENTITY_PROOF');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!documentUrl.trim()) {
      setErrorMsg('Please enter document URL or path');
      return;
    }
    setErrorMsg('');
    try {
      await onAddDocument({
        documentType: selectedType,
        documentUrl: documentUrl.trim(),
      });
      setDocumentUrl('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit document');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteDocument(id);
    } catch {
      // Ignored
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Business & Identity Verification Documents</Text>
      <Text style={styles.helperText}>
        Upload government or municipal documents to achieve "Verified Partner" status.
      </Text>

      {/* Submitted Documents List */}
      {documents.length > 0 && (
        <View style={styles.docList}>
          {documents.map((doc) => {
            const isApproved = doc.status === 'APPROVED';
            const isRejected = doc.status === 'REJECTED';
            return (
              <View
                key={doc.id}
                style={[
                  styles.docCard,
                  isApproved && styles.docCardApproved,
                  isRejected && styles.docCardRejected,
                ]}
              >
                <View style={styles.docInfo}>
                  <Text style={styles.docTypeTitle}>
                    {doc.documentType.replace('_', ' ')}
                  </Text>
                  <Text style={styles.docUrlText} numberOfLines={1}>
                    {doc.documentUrl}
                  </Text>
                  {isRejected && doc.rejectionReason && (
                    <View style={styles.rejectionReasonBox}>
                      <Text style={styles.rejectionReasonLabel}>Admin Note:</Text>
                      <Text style={styles.rejectionReasonText}>
                        {doc.rejectionReason}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.docActions}>
                  <View
                    style={[
                      styles.statusBadge,
                      isApproved && styles.statusBadgeApproved,
                      isRejected && styles.statusBadgeRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isApproved && styles.statusBadgeTextApproved,
                        isRejected && styles.statusBadgeTextRejected,
                      ]}
                    >
                      {doc.status}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    style={styles.deleteBtn}
                  >
                    {deletingId === doc.id ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <Text style={styles.deleteBtnText}>✕ Remove</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Add Document Section */}
      <View style={styles.uploadForm}>
        <Text style={styles.subLabel}>Upload or Register Document</Text>

        {/* Type Selector Pills */}
        <View style={styles.typePillRow}>
          {DOCUMENT_TYPES.map((dt) => (
            <TouchableOpacity
              key={dt.value}
              onPress={() => setSelectedType(dt.value)}
              style={[
                styles.typePill,
                selectedType === dt.value && styles.typePillActive,
              ]}
            >
              <Text
                style={[
                  styles.typePillText,
                  selectedType === dt.value && styles.typePillTextActive,
                ]}
              >
                {dt.label.split('(')[0].trim()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* URL Input */}
        <TextInput
          style={styles.input}
          placeholder="Document file URL or path (e.g. /uploads/documents/id.pdf)"
          placeholderTextColor={colors.placeholder}
          value={documentUrl}
          onChangeText={setDocumentUrl}
          autoCapitalize="none"
        />

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TouchableOpacity
          style={[styles.submitDocBtn, isUploading && styles.btnDisabled]}
          onPress={handleAdd}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.submitDocBtnText}>+ Attach Document</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  docList: {
    marginBottom: 14,
    gap: 8,
  },
  docCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  docCardApproved: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  docCardRejected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  docInfo: {
    flex: 1,
    marginRight: 10,
  },
  docTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  docUrlText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  rejectionReasonBox: {
    marginTop: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    padding: 6,
  },
  rejectionReasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
  },
  rejectionReasonText: {
    fontSize: 11,
    color: '#7F1D1D',
  },
  docActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  statusBadgeTextApproved: {
    color: '#15803D',
  },
  statusBadgeTextRejected: {
    color: '#B91C1C',
  },
  deleteBtn: {
    marginTop: 8,
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  uploadForm: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  typePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  typePill: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typePillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  typePillText: {
    fontSize: 11,
    color: colors.text,
  },
  typePillTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: colors.text,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginBottom: 8,
  },
  submitDocBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitDocBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default DocumentUploader;
