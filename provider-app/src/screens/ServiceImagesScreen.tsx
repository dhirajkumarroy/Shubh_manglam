import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import colors from '../theme/colors';
import { ProviderApiService } from '../services/api';

interface ServiceImagesScreenProps {
  serviceId: string;
  serviceName: string;
  onBack: () => void;
}

interface ImageItem {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export const ServiceImagesScreen: React.FC<ServiceImagesScreenProps> = ({
  serviceId,
  serviceName,
  onBack,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newUrl, setNewUrl] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await ProviderApiService.listServiceImages(serviceId);
      setImages(data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load service images.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [serviceId]);

  const handleAddImage = async () => {
    if (!newUrl.trim()) {
      Alert.alert('Validation Error', 'Please enter an image URL.');
      return;
    }

    try {
      setAdding(true);
      await ProviderApiService.addServiceImage(serviceId, {
        url: newUrl.trim(),
        isPrimary: images.length === 0, // First image auto-primary
      });
      setNewUrl('');
      fetchImages();
      Alert.alert('Success', 'Image added to service gallery.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add image.');
    } finally {
      setAdding(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await ProviderApiService.setPrimaryServiceImage(serviceId, imageId);
      fetchImages();
      Alert.alert('Success', 'Primary image updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to set primary image.');
    }
  };

  const handleDeleteImage = (imageId: string) => {
    Alert.alert('Delete Image', 'Are you sure you want to remove this image from the gallery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ProviderApiService.deleteServiceImage(serviceId, imageId);
            fetchImages();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete image.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Gallery Photos</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {serviceName}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      {/* Add New Image URL Bar */}
      <View style={styles.addBar}>
        <TextInput
          style={styles.input}
          placeholder="Paste photo URL (HTTPS image link)..."
          value={newUrl}
          onChangeText={setNewUrl}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.addBtn, adding && styles.addBtnDisabled]}
          onPress={handleAddImage}
          disabled={adding}
        >
          <Text style={styles.addBtnText}>{adding ? 'Adding...' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading gallery photos...</Text>
        </View>
      ) : (
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.imageCard}>
              <Image source={{ uri: item.url }} style={styles.thumbnail} resizeMode="cover" />
              <View style={styles.cardOverlay}>
                {item.isPrimary ? (
                  <View style={styles.primaryTag}>
                    <Text style={styles.primaryTagText}>★ Primary Cover</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.setPrimaryBtn}
                    onPress={() => handleSetPrimary(item.id)}
                  >
                    <Text style={styles.setPrimaryBtnText}>Make Primary</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteImage(item.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑 Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={styles.emptyTitle}>No Photos in Gallery</Text>
              <Text style={styles.emptySubtitle}>
                Add celebration photos to showcase your work to customers.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: 200,
  },
  addBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addBtnDisabled: {
    opacity: 0.6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  cardOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  primaryTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryTagText: {
    color: '#92400E',
    fontWeight: 'bold',
    fontSize: 12,
  },
  setPrimaryBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  setPrimaryBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ServiceImagesScreen;
