import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import colors from '../theme/colors';
import { ProviderApiService } from '../services/api';

interface LineItem {
  serviceId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  notes?: string;
}

interface CreateQuoteModalProps {
  visible: boolean;
  quoteId?: string; // If fulfilling or revising
  isRevision?: boolean;
  initialNotes?: string;
  initialItems?: any[];
  initialDiscount?: number;
  initialTax?: number;
  customerName?: string;
  eventTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({
  visible,
  quoteId,
  isRevision = false,
  initialNotes = '',
  initialItems = [],
  initialDiscount = 0,
  initialTax = 0,
  customerName = 'Customer',
  eventTitle,
  onClose,
  onSuccess,
}) => {
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: '1', unitPrice: '' },
  ]);
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState('14');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialItems && initialItems.length > 0) {
        setItems(
          initialItems.map((it) => ({
            serviceId: it.serviceId || undefined,
            description: it.description || it.name || '',
            quantity: String(it.quantity || 1),
            unitPrice: String(it.unitPrice || 0),
            notes: it.notes || '',
          }))
        );
      } else {
        setItems([{ description: '', quantity: '1', unitPrice: '' }]);
      }
      setDiscount(String(initialDiscount || 0));
      setTax(String(initialTax || 0));
      setNotes(initialNotes || '');
    }
  }, [visible, initialItems, initialDiscount, initialTax, initialNotes]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: '1', unitPrice: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      Alert.alert('Required', 'A quote must have at least one line item.');
      return;
    }
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const updateItem = (index: number, field: keyof LineItem, val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  // Calculations
  const calculatedSubtotal = items.reduce((acc, item) => {
    const q = parseFloat(item.quantity) || 0;
    const p = parseFloat(item.unitPrice) || 0;
    return acc + q * p;
  }, 0);

  const discountVal = parseFloat(discount) || 0;
  const taxVal = parseFloat(tax) || 0;
  const grandTotal = Math.max(0, calculatedSubtotal - discountVal + taxVal);

  const handleSubmit = async () => {
    // Validate
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description.trim()) {
        Alert.alert('Validation Error', `Please provide a description for item #${i + 1}.`);
        return;
      }
      const qty = parseInt(it.quantity, 10);
      const price = parseFloat(it.unitPrice);
      if (isNaN(qty) || qty < 1) {
        Alert.alert('Validation Error', `Quantity must be at least 1 for item #${i + 1}.`);
        return;
      }
      if (isNaN(price) || price < 0) {
        Alert.alert('Validation Error', `Unit price cannot be negative for item #${i + 1}.`);
        return;
      }
    }

    const days = parseInt(validDays, 10) || 14;
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + days);

    const formattedItems = items.map((it) => ({
      serviceId: it.serviceId,
      description: it.description.trim(),
      quantity: parseInt(it.quantity, 10),
      unitPrice: parseFloat(it.unitPrice),
      notes: it.notes?.trim() || undefined,
    }));

    try {
      setSubmitting(true);
      if (isRevision && quoteId) {
        await ProviderApiService.reviseQuote(quoteId, {
          items: formattedItems,
          discount: discountVal,
          tax: taxVal,
          notes: notes.trim() || undefined,
          validUntil: validUntilDate.toISOString(),
        });
        Alert.alert('Revised Quote Sent!', `Revision successfully submitted to ${customerName}.`);
      } else {
        await ProviderApiService.createFormalQuote({
          quoteRequestId: quoteId,
          items: formattedItems,
          discount: discountVal,
          tax: taxVal,
          notes: notes.trim() || undefined,
          validUntil: validUntilDate.toISOString(),
        });
        Alert.alert('Formal Quote Sent!', `Quote successfully submitted to ${customerName}.`);
      }
      onClose();
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to submit quote.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Title Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {isRevision ? 'Create Revised Quote' : 'Create Formal Quote'}
              </Text>
              <Text style={styles.subtitle}>
                Client: {customerName} {eventTitle ? `• ${eventTitle}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Line Items Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Quoted Line Items</Text>
              <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                <Text style={styles.addItemBtnText}>+ Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, idx) => {
              const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
              return (
                <View key={idx} style={styles.itemCard}>
                  <View style={styles.itemCardHeader}>
                    <Text style={styles.itemIndexText}>Item #{idx + 1}</Text>
                    {items.length > 1 && (
                      <TouchableOpacity onPress={() => removeItem(idx)}>
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Item description (e.g. Stage Decoration, Live Jalebi)"
                    placeholderTextColor={colors.textLight}
                    value={item.description}
                    onChangeText={(v) => updateItem(idx, 'description', v)}
                  />

                  <View style={styles.itemQtyPriceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Qty</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="1"
                        placeholderTextColor={colors.textLight}
                        keyboardType="number-pad"
                        value={item.quantity}
                        onChangeText={(v) => updateItem(idx, 'quantity', v)}
                      />
                    </View>

                    <View style={{ flex: 2 }}>
                      <Text style={styles.fieldLabel}>Unit Price (₹)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="25000"
                        placeholderTextColor={colors.textLight}
                        keyboardType="numeric"
                        value={item.unitPrice}
                        onChangeText={(v) => updateItem(idx, 'unitPrice', v)}
                      />
                    </View>

                    <View style={{ flex: 1.5, alignItems: 'flex-end', justifyContent: 'center' }}>
                      <Text style={styles.fieldLabel}>Line Total</Text>
                      <Text style={styles.itemLineTotalText}>
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Price Calculations */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{calculatedSubtotal.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.summaryLabel}>Discount (₹)</Text>
                <TextInput
                  style={styles.summaryInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.summaryLabel}>Tax / GST (₹)</Text>
                <TextInput
                  style={styles.summaryInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={tax}
                  onChangeText={setTax}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Final Quoted Total</Text>
                <Text style={styles.totalValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Validity & Notes */}
            <Text style={styles.fieldLabel}>Valid For (Days)</Text>
            <TextInput
              style={styles.input}
              placeholder="14"
              keyboardType="number-pad"
              value={validDays}
              onChangeText={setValidDays}
            />

            <Text style={styles.fieldLabel}>Notes for Customer</Text>
            <TextInput
              style={[styles.input, styles.notesArea]}
              placeholder="e.g. Price includes setup, cleanup, and 4 dedicated service staff."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.sendBtnText}>
                  {isRevision ? 'Send Revised Quote' : 'Send Formal Quote'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  scrollArea: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  addItemBtn: {
    backgroundColor: colors.backgroundWarm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addItemBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  itemCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  removeBtnText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
  itemQtyPriceRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'flex-end',
  },
  itemLineTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.backgroundWarm,
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryInput: {
    width: 100,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    textAlign: 'right',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  notesArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.backgroundWarm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sendBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});

export default CreateQuoteModal;
