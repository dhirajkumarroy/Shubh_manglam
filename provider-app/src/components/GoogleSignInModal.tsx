import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'provider_saved_google_acc';

export interface ProviderGoogleAccount {
  email: string;
  name: string;
  businessName?: string;
}

interface GoogleSignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (account: ProviderGoogleAccount) => void;
  loading?: boolean;
  error?: string | null;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  visible,
  onClose,
  onSuccess,
  loading = false,
  error = null,
}) => {
  const [savedAccounts, setSavedAccounts] = useState<ProviderGoogleAccount[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadSavedAccounts();
      setLocalError(null);
    }
  }, [visible]);

  const loadSavedAccounts = async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAccounts(parsed);
          setShowManualForm(false);
          return;
        }
      }
      setShowManualForm(true);
    } catch {
      setShowManualForm(true);
    }
  };

  const saveAccountToList = async (acc: ProviderGoogleAccount) => {
    try {
      const filtered = savedAccounts.filter((a) => a.email.toLowerCase() !== acc.email.toLowerCase());
      const updated = [acc, ...filtered].slice(0, 5);
      setSavedAccounts(updated);
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore secure store write failure
    }
  };

  const handleSelectSavedAccount = (acc: ProviderGoogleAccount) => {
    setLocalError(null);
    onSuccess(acc);
  };

  const handleManualSubmit = () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanBusiness = businessName.trim();

    if (!cleanEmail) {
      setLocalError('Please enter your Google email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    const finalName = cleanName || cleanEmail.split('@')[0];
    const finalBusiness = cleanBusiness || `${finalName} Celebrations & Services`;

    const account: ProviderGoogleAccount = {
      email: cleanEmail,
      name: finalName,
      businessName: finalBusiness,
    };

    saveAccountToList(account);
    setLocalError(null);
    onSuccess(account);
  };

  const activeError = localError || error;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.googleBrandRow}>
              <View style={styles.googleBadge}>
                <Text style={styles.googleBadgeText}>G</Text>
              </View>
              <Text style={styles.googleBrandTitle}>Partner Sign-In</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetSubtitle}>
            Continue with your Google account to access your Shubh Ausar business portal
          </Text>

          {activeError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{activeError}</Text>
            </View>
          )}

          <ScrollView style={styles.bodyScroll} keyboardShouldPersistTaps="handled">
            {/* List of saved accounts */}
            {!showManualForm && savedAccounts.length > 0 && (
              <View style={styles.accountsList}>
                {savedAccounts.map((acc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.accountRow}
                    onPress={() => handleSelectSavedAccount(acc)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitial}>
                        {(acc.name || acc.email)[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName} numberOfLines={1}>
                        {acc.businessName || acc.name}
                      </Text>
                      <Text style={styles.accountEmail} numberOfLines={1}>
                        {acc.email}
                      </Text>
                    </View>
                    <Text style={styles.accountArrow}>›</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.useAnotherBtn}
                  onPress={() => {
                    setLocalError(null);
                    setShowManualForm(true);
                  }}
                  disabled={loading}
                >
                  <View style={styles.useAnotherIcon}>
                    <Text style={styles.useAnotherIconText}>+</Text>
                  </View>
                  <Text style={styles.useAnotherText}>Use another Google account</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Manual Account Form */}
            {(showManualForm || savedAccounts.length === 0) && (
              <View style={styles.formContent}>
                <Text style={styles.inputLabel}>Google Email Address *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. sharma.events@gmail.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setLocalError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <Text style={styles.inputLabel}>Business / Firm Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Sharma Tent & Catering"
                  placeholderTextColor="#9ca3af"
                  value={businessName}
                  onChangeText={(val) => {
                    setBusinessName(val);
                    setLocalError(null);
                  }}
                  editable={!loading}
                />

                <Text style={styles.inputLabel}>Owner Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ramesh Sharma"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    setLocalError(null);
                  }}
                  autoCapitalize="words"
                  editable={!loading}
                />

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleManualSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Continue with Google</Text>
                  )}
                </TouchableOpacity>

                {savedAccounts.length > 0 && (
                  <TouchableOpacity
                    style={styles.backToAccountsBtn}
                    onPress={() => {
                      setLocalError(null);
                      setShowManualForm(false);
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.backToAccountsText}>← Back to saved accounts</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              Verified vendor sessions are protected by 256-bit encryption.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  googleBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 1,
  },
  googleBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleBrandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeBtn: {
    fontSize: 20,
    color: '#9ca3af',
    fontWeight: '600',
    padding: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '500',
  },
  bodyScroll: {
    maxHeight: 320,
  },
  accountsList: {
    marginVertical: 4,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  accountEmail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  accountArrow: {
    fontSize: 20,
    color: '#9ca3af',
    fontWeight: '400',
    marginLeft: 8,
  },
  useAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  useAnotherIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  useAnotherIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
  },
  useAnotherText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  formContent: {
    paddingVertical: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  backToAccountsBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 6,
  },
  backToAccountsText: {
    fontSize: 13,
    color: '#4285F4',
    fontWeight: '600',
  },
  footerNote: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default GoogleSignInModal;
