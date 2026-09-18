import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import colors from '../../theme/colors';
import { quoteService, Quote, QuoteStatus } from '../../api/quote.service';
import { AppIcon } from '../../components/AppIcon';
import { StatusBadge } from '../../components/StatusBadge';

const STATUS_FILTERS: { label: string; value?: QuoteStatus }[] = [
  { label: 'All' },
  { label: 'Received', value: 'SENT' },
  { label: 'In Negotiation', value: 'REVISION_REQUESTED' },
  { label: 'Revised', value: 'REVISED' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Requested', value: 'REQUESTED' },
];

export const QuotesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<QuoteStatus | undefined>(undefined);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await quoteService.getCustomerQuotes({ status: selectedFilter });
      setQuotes(res.quotes);
    } catch (err: any) {
      console.warn('Failed to load quotes:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    setLoading(true);
    fetchQuotes();
  }, [fetchQuotes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuotes();
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'SENT':
        return { label: 'Quote Received', bg: '#FEF3C7', text: '#92400E' };
      case 'REVISION_REQUESTED':
        return { label: 'Revision Requested', bg: '#F3E8FF', text: '#6B21A8' };
      case 'REVISED':
        return { label: 'Revised Quote', bg: '#E0E7FF', text: '#3730A3' };
      case 'ACCEPTED':
        return { label: 'Quote Accepted', bg: '#DCFCE7', text: '#15803D' };
      case 'REQUESTED':
        return { label: 'Awaiting Vendor', bg: '#DBEAFE', text: '#1E40AF' };
      case 'REJECTED':
      case 'CANCELLED':
        return { label: 'Declined', bg: '#FEE2E2', text: '#991B1B' };
      case 'EXPIRED':
        return { label: 'Expired', bg: '#F3F4F6', text: '#6B7280' };
      default:
        return { label: status, bg: '#F3F4F6', text: '#374151' };
    }
  };

  const renderQuoteCard = ({ item }: { item: Quote }) => {
    const badge = getStatusBadge(item.status);
    const hasDiscount = Number(item.discount) > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('QuoteDetailsScreen', { quoteId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {item.vendor?.businessName || 'Celebration Vendor'}
            </Text>
            <Text style={styles.quoteNumber}>
              Quote #{item.quoteNumber} {item.currentVersion > 1 ? `• v${item.currentVersion}` : ''}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {item.event && (
          <View style={styles.eventInfoContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="calendar-outline" size={13} color="#881337" />
              <Text style={[styles.eventTitle, { marginLeft: 4 }]} numberOfLines={1}>
                {item.event.title}
              </Text>
            </View>
            <Text style={styles.eventDate}>
              {new Date(item.event.eventDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {item.event.guestCount ? ` • ${item.event.guestCount} Guests` : ''}
            </Text>
          </View>
        )}

        {item.items && item.items.length > 0 && (
          <View style={styles.itemsPreview}>
            <Text style={styles.itemsLabel}>Services Included ({item.items.length}):</Text>
            <Text style={styles.itemsText} numberOfLines={2}>
              {item.items.map((i) => i.description).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Quoted Amount</Text>
            <View style={styles.priceRow}>
              <Text style={styles.amountValue}>₹{Number(item.total).toLocaleString('en-IN')}</Text>
              {hasDiscount && (
                <Text style={styles.discountBadge}>-₹{Number(item.discount).toLocaleString('en-IN')} off</Text>
              )}
            </View>
          </View>

          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Quote →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Quotes (कोटेशन)</Text>
        <Text style={styles.subtitle}>Review vendor proposals, request revisions & confirm</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.value;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedFilter(item.value)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Quotes List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching your celebration quotes...</Text>
        </View>
      ) : quotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppIcon name="document-text-outline" size={48} color="#D97706" />
          <Text style={styles.emptyTitle}>No Quotes Found</Text>
          <Text style={styles.emptySubtitle}>
            {selectedFilter
              ? 'No quotes match this filter status.'
              : 'Discover vendors and tap "Request Quote" to receive formal pricing proposals.'}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('CategoryDiscoveryScreen')}
          >
            <Text style={styles.browseButtonText}>Explore Vendor Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.id}
          renderItem={renderQuoteCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  filtersWrapper: {
    paddingVertical: 10,
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  quoteNumber: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  eventInfoContainer: {
    backgroundColor: colors.backgroundWarm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  eventDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemsPreview: {
    marginBottom: 10,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 2,
  },
  itemsText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  discountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    backgroundColor: colors.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionButton: {
    backgroundColor: colors.backgroundWarm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default QuotesListScreen;
