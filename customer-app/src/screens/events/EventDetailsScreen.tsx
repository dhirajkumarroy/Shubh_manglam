import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../theme/colors';
import {
  useEventDetails,
  useDeleteEvent,
  useDeleteRequirement,
} from '../../hooks/useEventPlanning';

export const EventDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const eventId = route.params?.eventId;

  const { data: event, isLoading, error, refetch } = useEventDetails(eventId);
  const deleteEventMutation = useDeleteEvent();
  const deleteRequirementMutation = useDeleteRequirement();

  const handleDeleteEvent = () => {
    Alert.alert(
      'Cancel Celebration',
      'Are you sure you want to delete this celebration? All requirements will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEventMutation.mutateAsync(eventId);
              navigation.navigate('HomeScreen');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const handleDeleteRequirement = (reqId: string, catName: string) => {
    Alert.alert('Remove Requirement', `Remove ${catName} from this celebration?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRequirementMutation.mutateAsync({ eventId, requirementId: reqId });
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to remove requirement');
          }
        },
      },
    ]);
  };

  const handleFindVendorsForCategory = (catId: string, catName: string) => {
    navigation.navigate('VendorDiscoveryScreen', {
      categoryId: catId,
      categoryName: catName,
      city: event?.city,
      latitude: event?.latitude ? Number(event.latitude) : undefined,
      longitude: event?.longitude ? Number(event.longitude) : undefined,
      eventId: event?.id,
    });
  };

  const handleBrowseAllVendors = () => {
    navigation.navigate('VendorDiscoveryScreen', {
      city: event?.city,
      latitude: event?.latitude ? Number(event.latitude) : undefined,
      longitude: event?.longitude ? Number(event.longitude) : undefined,
      eventTypeId: event?.eventTypeId,
      eventId: event?.id,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Loading celebration details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Celebration Not Found</Text>
          <Text style={styles.errorSub}>The celebration details could not be loaded.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const requirements = event.requirements || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={styles.subTitle}>Event Overview & Requirements</Text>
        </View>
        <TouchableOpacity style={styles.deleteHeaderBtn} onPress={handleDeleteEvent}>
          <Text style={styles.deleteHeaderIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Celebration Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.typeTag}>
              <Text style={styles.typeIcon}>{event.eventType?.icon || '🎉'}</Text>
              <Text style={styles.typeText}>{event.eventType?.name || 'Celebration'}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{event.status}</Text>
            </View>
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>
          {event.description && <Text style={styles.eventDesc}>{event.description}</Text>}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>📅 DATE</Text>
              <Text style={styles.infoValue}>
                {new Date(event.eventDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>⏰ TIME</Text>
              <Text style={styles.infoValue}>
                {event.startTime || '18:00'} - {event.endTime || '23:00'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>👥 GUESTS</Text>
              <Text style={styles.infoValue}>{event.guestCount || 'Not specified'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>💰 BUDGET</Text>
              <Text style={styles.infoValue}>
                {event.budgetMin && event.budgetMax
                  ? `₹${Number(event.budgetMin).toLocaleString()} - ₹${Number(event.budgetMax).toLocaleString()}`
                  : 'Flexible'}
              </Text>
            </View>
          </View>

          <View style={styles.locationBox}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>
              {event.addressLine1}, {event.city} ({event.pincode})
            </Text>
          </View>
        </View>

        {/* Find All Vendors CTA */}
        <TouchableOpacity style={styles.findVendorsHero} activeOpacity={0.8} onPress={handleBrowseAllVendors}>
          <View style={styles.findVendorsHeroText}>
            <Text style={styles.findVendorsTitle}>Find Vendors in {event.city}</Text>
            <Text style={styles.findVendorsSub}>
              Discover nearby caterers, decorators, DJs, makeup artists & photographers
            </Text>
          </View>
          <Text style={styles.findVendorsArrow}>→</Text>
        </TouchableOpacity>

        {/* Requirements Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Celebration Services Needed</Text>
            <Text style={styles.sectionSubtitle}>
              {requirements.length} requirement{requirements.length !== 1 ? 's' : ''} specified
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addReqButton}
            onPress={() => navigation.navigate('EventRequirementsScreen', { eventId: event.id })}
          >
            <Text style={styles.addReqButtonText}>+ Add Need</Text>
          </TouchableOpacity>
        </View>

        {requirements.length === 0 ? (
          <View style={styles.emptyReqBox}>
            <Text style={styles.emptyReqIcon}>📋</Text>
            <Text style={styles.emptyReqTitle}>No Requirements Added Yet</Text>
            <Text style={styles.emptyReqText}>
              Add the celebration services you need (e.g. Catering, Tent, Decoration) to match with vendors.
            </Text>
            <TouchableOpacity
              style={styles.addReqEmptyBtn}
              onPress={() => navigation.navigate('EventRequirementsScreen', { eventId: event.id })}
            >
              <Text style={styles.addReqEmptyBtnText}>+ Add Celebration Requirement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.requirementsList}>
            {requirements.map((req) => (
              <View key={req.id} style={styles.reqCard}>
                <View style={styles.reqCardTop}>
                  <View style={styles.reqIconWrap}>
                    <Text style={styles.reqIconText}>{req.category?.icon || '🎪'}</Text>
                  </View>
                  <View style={styles.reqBody}>
                    <Text style={styles.reqCategoryName}>{req.category?.name || 'Custom Need'}</Text>
                    {req.notes && <Text style={styles.reqNotes}>{req.notes}</Text>}
                    <View style={styles.reqMetaRow}>
                      <Text style={styles.reqMetaItem}>Qty: {req.quantity}</Text>
                      {req.budgetMax && (
                        <Text style={styles.reqMetaItem}>
                          Budget: ₹{Number(req.budgetMax).toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteReqBtn}
                    onPress={() => handleDeleteRequirement(req.id, req.category?.name || 'Need')}
                  >
                    <Text style={styles.deleteReqBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Find Vendors button for this requirement */}
                <TouchableOpacity
                  style={styles.findVendorsForCategoryBtn}
                  onPress={() =>
                    handleFindVendorsForCategory(req.categoryId, req.category?.name || 'Vendors')
                  }
                >
                  <Text style={styles.findVendorsForCategoryText}>
                    🔍 Find {req.category?.name || 'Service'} Vendors →
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  centerText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  errorSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backBtnText: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: 'bold',
    marginTop: -3,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  deleteHeaderBtn: {
    padding: 8,
  },
  deleteHeaderIcon: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  eventDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
  },
  infoItem: {
    width: '50%',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
  },
  findVendorsHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  findVendorsHeroText: {
    flex: 1,
  },
  findVendorsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  findVendorsSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  findVendorsArrow: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  addReqButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addReqButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  emptyReqBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyReqIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyReqTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptyReqText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  addReqEmptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addReqEmptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  requirementsList: {
    gap: 12,
  },
  reqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  reqCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reqIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reqIconText: {
    fontSize: 20,
  },
  reqBody: {
    flex: 1,
  },
  reqCategoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  reqNotes: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  reqMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  reqMetaItem: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deleteReqBtn: {
    padding: 6,
  },
  deleteReqBtnText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  findVendorsForCategoryBtn: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  findVendorsForCategoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default EventDetailsScreen;
