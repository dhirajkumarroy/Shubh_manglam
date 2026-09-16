import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useOwnerVehicles, useDeleteVehicle } from '../../hooks/useOwner';
import { Vehicle } from '../../types/vehicle';
import Config from '../../config';
import colors from '../../theme/colors';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';

export const MyVehiclesScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // Fetch owner's vehicles
  const { data: vehiclesData, isLoading, refetch, isRefetching } = useOwnerVehicles({ limit: 100 });
  const deleteVehicleMutation = useDeleteVehicle();

  const handleEdit = (vehicleId: string) => {
    navigation.navigate('EditVehicle', { vehicleId });
  };

  const handleDelete = (vehicleId: string, title: string) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to permanently delete the vehicle listing: "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteVehicleMutation.mutate(vehicleId, {
              onSuccess: () => {
                Alert.alert('Success', 'Vehicle listing deleted.');
              },
              onError: (err: any) => {
                Alert.alert('Error', err.message || 'Could not delete listing.');
              },
            });
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success; // Green
      case 'PENDING':
        return colors.primary; // Blue
      case 'REJECTED':
      case 'SUSPENDED':
        return colors.error; // Red
      default:
        return colors.textMuted; // Gray
    }
  };

  // Helper function to resolve dynamic image endpoints
  const getFullImageUrl = (imagePath?: string): string => {
    const fallbackImage = 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&auto=format&fit=crop';
    if (!imagePath) return fallbackImage;
    if (imagePath.startsWith('http')) return imagePath;

    const baseUrl = Config.API_URL.split('/api/v1')[0];
    return `${baseUrl}/${imagePath.replace(/^\//, '')}`;
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => {
    const primaryImageObj = item.images.find((img) => img.isPrimary) || item.images[0];
    const imageUri = getFullImageUrl(primaryImageObj?.imageUrl);

    return (
      <View style={styles.card}>
        <View style={styles.vehicleRow}>
          <Image source={{ uri: imageUri }} style={styles.vehicleImage} />
          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <Text style={styles.brandText}>{item.brand}</Text>
              <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.titleText}>{item.title}</Text>
            <Text style={styles.numberText}>{item.vehicleNumber}</Text>
            <Text style={styles.priceText}>
              Rate: <Text style={styles.priceAmount}>₹{item.pricePerDay}</Text> / day
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id, item.title)}
            disabled={deleteVehicleMutation.isPending}
          >
            <Text style={styles.deleteBtnText}>Remove</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => handleEdit(item.id)}
            disabled={deleteVehicleMutation.isPending}
          >
            <Text style={styles.editBtnText}>Edit Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const vehicles = vehiclesData?.vehicles || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>← Dashboard</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Vehicles</Text>
            <Text style={styles.subtitle}>Manage your vehicle rental listings</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateVehicle')}
          >
            <Text style={styles.addBtnText}>+ Add New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => String(item)}
          renderItem={() => <SkeletonLoader />}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicleItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="You haven't listed any vehicles yet."
              message="Add your first vehicle listing to start hosting."
              icon="🚗"
            >
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('CreateVehicle')}
              >
                <Text style={styles.emptyAddBtnText}>Add Your First Vehicle</Text>
              </TouchableOpacity>
            </EmptyState>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 20,
  },
  backLink: {
    marginBottom: 12,
  },
  backLinkText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  vehicleRow: {
    flexDirection: 'row',
  },
  vehicleImage: {
    width: 100,
    height: 80,
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  infoCol: {
    flex: 1,
    marginLeft: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  numberText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  priceText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 6,
  },
  priceAmount: {
    color: colors.primary,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 10,
  },
  deleteBtnText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  editBtn: {
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  editBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyAddBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default MyVehiclesScreen;
