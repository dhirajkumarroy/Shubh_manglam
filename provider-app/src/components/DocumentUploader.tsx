import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import colors from '../theme/colors';
import { DocumentRequirementItem, VendorDocumentItem } from '../types';
import { ProviderApiService } from '../services/api';

interface DocumentUploaderProps {
  requirements?: DocumentRequirementItem[];
  documents: VendorDocumentItem[];
  onAddDocument: (doc: {
    requirementId?: string;
    documentType?: string;
    documentUrl: string;
    originalFileName?: string;
    fileSize?: number;
    mimeType?: string;
  }) => Promise<void>;
  onDeleteDocument: (documentId: string) => Promise<void>;
  isUploading?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  requirements = [],
  documents = [],
  onAddDocument,
  onDeleteDocument,
  isUploading = false,
}) => {
  const [activeUploadingReqId, setActiveUploadingReqId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Match documents to requirements
  const getDocumentForRequirement = (req: DocumentRequirementItem) => {
    return (
      documents.find((d) => d.requirementId === req.id) ||
      documents.find((d) => d.documentType === req.documentType)
    );
  };

  // Additional documents not bound to any listed requirement
  const unlinkedDocuments = documents.filter(
    (doc) =>
      !requirements.some(
        (r) => r.id === doc.requirementId || r.documentType === doc.documentType
      )
  );

  const handlePickAndUpload = async (req: DocumentRequirementItem) => {
    Alert.alert(
      `Upload ${req.name}`,
      `Choose how you want to upload your document (Max ${req.maxFileSizeMb}MB):`,
      [
        {
          text: 'Choose from Photo Library',
          onPress: () => pickImage(req, 'library'),
        },
        {
          text: 'Take Photo with Camera',
          onPress: () => pickImage(req, 'camera'),
        },
        {
          text: 'Select PDF Document',
          onPress: () => pickDocument(req),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickImage = async (req: DocumentRequirementItem, mode: 'library' | 'camera') => {
    try {
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to capture documents.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Photo library permission is required to pick documents.');
          return;
        }
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      };

      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.fileName || `${req.code.toLowerCase()}_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || (fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      const fileSize = asset.fileSize || 0;

      // Check file size if available (maxFileSizeMb)
      if (fileSize > req.maxFileSizeMb * 1024 * 1024) {
        Alert.alert(
          'File Too Large',
          `The selected file exceeds the maximum limit of ${req.maxFileSizeMb}MB. Please select a smaller file.`
        );
        return;
      }

      await uploadAndSave(req, {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
        size: fileSize,
      });
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to select image');
    }
  };

  const pickDocument = async (req: DocumentRequirementItem) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.name || `${req.code.toLowerCase()}_${Date.now()}.pdf`;
      const mimeType = asset.mimeType || 'application/pdf';
      const fileSize = asset.size || 0;

      if (fileSize > req.maxFileSizeMb * 1024 * 1024) {
        Alert.alert(
          'File Too Large',
          `The selected file exceeds the maximum limit of ${req.maxFileSizeMb}MB.`
        );
        return;
      }

      await uploadAndSave(req, {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
        size: fileSize,
      });
    } catch (err: any) {
      Alert.alert('Document Picker Error', err.message || 'Failed to select document');
    }
  };

  const uploadAndSave = async (
    req: DocumentRequirementItem,
    file: { uri: string; name: string; type: string; size: number }
  ) => {
    setActiveUploadingReqId(req.id);
    try {
      // 1. Upload to storage endpoint
      const uploadRes = await ProviderApiService.uploadDocumentFile({
        uri: file.uri,
        name: file.name,
        type: file.type,
      });

      // 2. Attach document record to vendor profile
      await onAddDocument({
        requirementId: req.id,
        documentType: req.documentType,
        documentUrl: uploadRes.url,
        originalFileName: uploadRes.originalName || file.name,
        fileSize: uploadRes.size || file.size,
        mimeType: uploadRes.mimeType || file.type,
      });

      Alert.alert('Document Attached', `${req.name} has been successfully uploaded.`);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload document');
    } finally {
      setActiveUploadingReqId(null);
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    Alert.alert('Delete Document', `Are you sure you want to remove ${docName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(docId);
          try {
            await onDeleteDocument(docId);
          } catch (err: any) {
            Alert.alert('Delete Failed', err.message || 'Could not remove document');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Partner Verification Documents</Text>
      <Text style={styles.helperText}>
        Upload clear, government or municipal documents to achieve "Verified Partner" status and receive bookings.
      </Text>

      {/* Dynamic Requirements List */}
      <View style={styles.reqList}>
        {requirements.map((req) => {
          const doc = getDocumentForRequirement(req);
          const isUploaded = !!doc;
          const isApproved = doc?.status === 'APPROVED';
          const isRejected = doc?.status === 'REJECTED';
          const isPending = doc?.status === 'PENDING';
          const isCurrentUploading = activeUploadingReqId === req.id;

          return (
            <View
              key={req.id}
              style={[
                styles.card,
                isApproved && styles.cardApproved,
                isRejected && styles.cardRejected,
                isPending && styles.cardPending,
              ]}
            >
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.headerTitleWrap}>
                  <Text style={styles.reqName}>{req.name}</Text>
                  <View style={styles.badgeRow}>
                    {req.isRequired ? (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                      </View>
                    ) : (
                      <View style={styles.optionalBadge}>
                        <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                      </View>
                    )}
                    <Text style={styles.fileLimitText}>Max {req.maxFileSizeMb}MB • PDF/Images</Text>
                  </View>
                </View>

                {/* Status Indicator */}
                {isUploaded && (
                  <View
                    style={[
                      styles.statusPill,
                      isApproved && styles.statusPillApproved,
                      isRejected && styles.statusPillRejected,
                      isPending && styles.statusPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isApproved && styles.statusPillTextApproved,
                        isRejected && styles.statusPillTextRejected,
                        isPending && styles.statusPillTextPending,
                      ]}
                    >
                      {isApproved ? '✓ VERIFIED' : isRejected ? '✕ REJECTED' : '● UNDER REVIEW'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Requirement Description */}
              {req.description && <Text style={styles.reqDesc}>{req.description}</Text>}

              {/* Rejection Alert */}
              {isRejected && doc?.rejectionReason && (
                <View style={styles.rejectionBox}>
                  <Text style={styles.rejectionTitle}>Admin Feedback:</Text>
                  <Text style={styles.rejectionBody}>{doc.rejectionReason}</Text>
                </View>
              )}

              {/* Document Info / Action Row */}
              {isUploaded ? (
                <View style={styles.uploadedRow}>
                  <View style={styles.fileMeta}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      📄 {doc.originalFileName || doc.documentUrl.split('/').pop() || 'Document'}
                    </Text>
                    {doc.fileSize ? (
                      <Text style={styles.fileSize}>
                        {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.btnGroup}>
                    <TouchableOpacity
                      onPress={() => handlePickAndUpload(req)}
                      disabled={isCurrentUploading}
                      style={styles.replaceBtn}
                    >
                      {isCurrentUploading ? (
                        <ActivityIndicator size="small" color="#D97706" />
                      ) : (
                        <Text style={styles.replaceBtnText}>Replace</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(doc.id, req.name)}
                      disabled={deletingId === doc.id}
                      style={styles.deleteBtn}
                    >
                      {deletingId === doc.id ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Text style={styles.deleteBtnText}>Remove</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadBtn, isCurrentUploading && styles.btnDisabled]}
                  onPress={() => handlePickAndUpload(req)}
                  disabled={isCurrentUploading || isUploading}
                >
                  {isCurrentUploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.uploadBtnText}>+ Upload {req.name}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Unlinked / Additional Documents */}
      {unlinkedDocuments.length > 0 && (
        <View style={styles.extraSection}>
          <Text style={styles.extraTitle}>Additional Uploaded Documents</Text>
          {unlinkedDocuments.map((doc) => (
            <View key={doc.id} style={styles.extraCard}>
              <View style={styles.fileMeta}>
                <Text style={styles.fileName} numberOfLines={1}>
                  📄 {doc.originalFileName || doc.documentType.replace('_', ' ')}
                </Text>
                <Text style={styles.fileSize}>{doc.status}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(doc.id, doc.originalFileName || 'Document')}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 14,
    lineHeight: 16,
  },
  reqList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E7E5E4',
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  cardApproved: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  cardRejected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  cardPending: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  reqName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  optionalBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4B5563',
  },
  fileLimitText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPillRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillTextApproved: {
    color: '#15803D',
  },
  statusPillTextRejected: {
    color: '#B91C1C',
  },
  statusPillTextPending: {
    color: '#B45309',
  },
  reqDesc: {
    fontSize: 11.5,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 15,
  },
  rejectionBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  rejectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 2,
  },
  rejectionBody: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 14,
  },
  uploadedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  fileMeta: {
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  fileSize: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replaceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  replaceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  uploadBtn: {
    backgroundColor: '#E65100', // Saffron primary
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  extraSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  extraTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
    marginBottom: 8,
  },
  extraCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
});

export default DocumentUploader;
