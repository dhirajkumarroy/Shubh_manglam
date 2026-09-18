import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import colors from '../theme/colors';
import { ProviderApiService, resolveMediaUrl } from '../services/api';
import { VendorGalleryItem, VendorGalleryResponse, CatalogServiceItem } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface ProviderGalleryScreenProps {
  onBack?: () => void;
}

export const ProviderGalleryScreen: React.FC<ProviderGalleryScreenProps> = ({ onBack }) => {
  const [galleryData, setGalleryData] = useState<VendorGalleryResponse>({
    photosCount: 0,
    videosCount: 0,
    maxPhotos: 10,
    maxVideos: 5,
    totalCount: 0,
    items: [],
  });
  const [services, setServices] = useState<CatalogServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<VendorGalleryItem | null>(null);

  // Edit Caption & Service Modal State
  const [editingItem, setEditingItem] = useState<VendorGalleryItem | null>(null);
  const [editCaption, setEditCaption] = useState<string>('');
  const [editServiceId, setEditServiceId] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Add Media with Caption Modal State
  const [pendingUpload, setPendingUpload] = useState<{
    file: { uri: string; name: string; type: string; size: number };
    mediaType: 'IMAGE' | 'VIDEO';
  } | null>(null);
  const [newCaption, setNewCaption] = useState<string>('');
  const [newServiceId, setNewServiceId] = useState<string>('');

  const loadGalleryAndServices = async () => {
    try {
      setLoading(true);
      const [gData, sData] = await Promise.all([
        ProviderApiService.getGallery(),
        ProviderApiService.getVendorServices().catch(() => ({ services: [] })),
      ]);
      setGalleryData(gData);
      setServices(sData.services || []);
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Could not load gallery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryAndServices();
  }, []);

  // ---------------------------------------------------------------------------
  // Media Picking & Verification
  // ---------------------------------------------------------------------------

  const handleAddMedia = async (type: 'IMAGE' | 'VIDEO') => {
    if (type === 'IMAGE' && galleryData.photosCount >= galleryData.maxPhotos) {
      Alert.alert(
        'Photo Limit Reached',
        `You have already uploaded the maximum limit of ${galleryData.maxPhotos} photos. Please delete an existing photo to upload a new one.`
      );
      return;
    }

    if (type === 'VIDEO' && galleryData.videosCount >= galleryData.maxVideos) {
      Alert.alert(
        'Video Limit Reached',
        `You have already uploaded the maximum limit of ${galleryData.maxVideos} videos. Please delete an existing video to upload a new one.`
      );
      return;
    }

    Alert.alert(
      type === 'IMAGE' ? 'Add Partner Photo' : 'Add Celebration Video',
      type === 'IMAGE'
        ? `Select an image (Max ${galleryData.maxPhotos} photos):`
        : `Select a video (Max ${galleryData.maxVideos} videos, max 50MB):`,
      [
        {
          text: 'Choose from Library',
          onPress: () => pickMediaFromLibrary(type),
        },
        {
          text: type === 'IMAGE' ? 'Take Photo' : 'Record Video',
          onPress: () => captureMediaFromCamera(type),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickMediaFromLibrary = async (type: 'IMAGE' | 'VIDEO') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to select files.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'IMAGE' ? ['images'] : ['videos'],
        allowsEditing: type === 'IMAGE',
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const fileName =
        asset.fileName || `${type.toLowerCase()}_${Date.now()}.${type === 'IMAGE' ? 'jpg' : 'mp4'}`;
      const mimeType =
        asset.mimeType ||
        (type === 'VIDEO' ? 'video/mp4' : fileName.endsWith('.png') ? 'image/png' : 'image/jpeg');
      const size = asset.fileSize || 0;

      // Check video size constraint (50MB max)
      if (type === 'VIDEO' && size > 50 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Videos must be under 50MB in size.');
        return;
      }

      setPendingUpload({
        file: { uri: asset.uri, name: fileName, type: mimeType, size },
        mediaType: type,
      });
      setNewCaption('');
      setNewServiceId('');
    } catch (err: any) {
      Alert.alert('Picker Error', err.message || 'Failed to select media');
    }
  };

  const captureMediaFromCamera = async (type: 'IMAGE' | 'VIDEO') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture media.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: type === 'IMAGE' ? ['images'] : ['videos'],
        allowsEditing: type === 'IMAGE',
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      const fileName =
        asset.fileName || `${type.toLowerCase()}_${Date.now()}.${type === 'IMAGE' ? 'jpg' : 'mp4'}`;
      const mimeType =
        asset.mimeType ||
        (type === 'VIDEO' ? 'video/mp4' : fileName.endsWith('.png') ? 'image/png' : 'image/jpeg');
      const size = asset.fileSize || 0;

      setPendingUpload({
        file: { uri: asset.uri, name: fileName, type: mimeType, size },
        mediaType: type,
      });
      setNewCaption('');
      setNewServiceId('');
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Failed to capture media');
    }
  };

  // ---------------------------------------------------------------------------
  // Complete Upload & Create Gallery Item
  // ---------------------------------------------------------------------------

  const handleConfirmUpload = async () => {
    if (!pendingUpload) return;
    try {
      setUploading(true);
      setUploadProgressText(`Uploading ${pendingUpload.mediaType.toLowerCase()} to storage...`);

      // 1. Upload to storage endpoint
      const uploadRes = await ProviderApiService.uploadGalleryMediaFile({
        uri: pendingUpload.file.uri,
        name: pendingUpload.file.name,
        type: pendingUpload.file.type,
      });

      setUploadProgressText('Attaching to Partner Gallery...');

      // 2. Add record to vendor gallery
      await ProviderApiService.addGalleryMedia({
        mediaType: pendingUpload.mediaType,
        url: uploadRes.url,
        caption: newCaption.trim() || undefined,
        serviceId: newServiceId || undefined,
      });

      setPendingUpload(null);
      await loadGalleryAndServices();
      Alert.alert('Success', `${pendingUpload.mediaType === 'IMAGE' ? 'Photo' : 'Video'} added to your gallery.`);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not save gallery media');
    } finally {
      setUploading(false);
      setUploadProgressText('');
    }
  };

  // ---------------------------------------------------------------------------
  // Delete Media Item (Permanently purges Cloudinary or Local storage)
  // ---------------------------------------------------------------------------

  const handleDeleteMedia = async (item: VendorGalleryItem) => {
    Alert.alert(
      'Permanent Deletion',
      `Are you sure you want to delete this ${item.mediaType.toLowerCase()}? This will permanently remove it from storage and your public profile.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProviderApiService.deleteGalleryMedia(item.id);
              if (previewItem?.id === item.id) setPreviewItem(null);
              await loadGalleryAndServices();
              Alert.alert('Deleted', 'Media permanently deleted from storage and gallery.');
            } catch (err: any) {
              Alert.alert('Delete Error', err.message || 'Could not delete media item');
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // Edit Caption & Service
  // ---------------------------------------------------------------------------

  const openEditModal = (item: VendorGalleryItem) => {
    setEditingItem(item);
    setEditCaption(item.caption || '');
    setEditServiceId(item.serviceId || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      setSavingEdit(true);
      await ProviderApiService.updateGalleryMedia(editingItem.id, {
        caption: editCaption.trim() || undefined,
        serviceId: editServiceId || null,
      });
      setEditingItem(null);
      await loadGalleryAndServices();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update media details');
    } finally {
      setSavingEdit(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Reorder Item
  // ---------------------------------------------------------------------------

  const handleMoveItem = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredItems.length) return;

    const newItems = [...filteredItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const orderedIds = newItems.map((i) => i.id);
    try {
      // Optimistic update
      setGalleryData((prev) => ({ ...prev, items: newItems }));
      await ProviderApiService.reorderGallery(orderedIds);
    } catch (err: any) {
      Alert.alert('Reorder Failed', err.message || 'Could not save new order');
      await loadGalleryAndServices();
    }
  };

  // Filtered items
  const filteredItems = galleryData.items.filter((item) => {
    if (activeFilter === 'IMAGE') return item.mediaType === 'IMAGE';
    if (activeFilter === 'VIDEO') return item.mediaType === 'VIDEO';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Partner Gallery</Text>
          <Text style={styles.headerSub}>Photos & Videos for Users</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      {/* 2. Media Limit Counters Bar */}
      <View style={styles.limitCountersRow}>
        {/* Photo Counter */}
        <View style={[styles.counterCard, galleryData.photosCount >= 10 && styles.counterCardFull]}>
          <View style={styles.counterHeader}>
            <Text style={styles.counterIcon}>📸</Text>
            <Text style={styles.counterTitle}>Photos</Text>
          </View>
          <Text style={styles.counterNumbers}>
            <Text style={styles.counterCurrent}>{galleryData.photosCount}</Text>
            <Text style={styles.counterMax}> / {galleryData.maxPhotos}</Text>
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(galleryData.photosCount / galleryData.maxPhotos) * 100}%` },
                galleryData.photosCount >= 10 ? styles.progressFillFull : {},
              ]}
            />
          </View>
        </View>

        {/* Video Counter */}
        <View style={[styles.counterCard, galleryData.videosCount >= 5 && styles.counterCardFull]}>
          <View style={styles.counterHeader}>
            <Text style={styles.counterIcon}>🎥</Text>
            <Text style={styles.counterTitle}>Videos</Text>
          </View>
          <Text style={styles.counterNumbers}>
            <Text style={styles.counterCurrent}>{galleryData.videosCount}</Text>
            <Text style={styles.counterMax}> / {galleryData.maxVideos}</Text>
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(galleryData.videosCount / galleryData.maxVideos) * 100}%` },
                galleryData.videosCount >= 5 ? styles.progressFillFull : {},
              ]}
            />
          </View>
        </View>
      </View>

      {/* 3. Action Buttons (+ Photo, + Video) */}
      <View style={styles.actionButtonRow}>
        <TouchableOpacity
          style={[
            styles.addMediaBtn,
            styles.addPhotoBtn,
            galleryData.photosCount >= 10 && styles.btnDisabled,
          ]}
          onPress={() => handleAddMedia('IMAGE')}
          disabled={galleryData.photosCount >= 10 || uploading}
        >
          <Text style={styles.addMediaBtnText}>
            + Add Photo ({galleryData.photosCount}/10)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addMediaBtn,
            styles.addVideoBtn,
            galleryData.videosCount >= 5 && styles.btnDisabled,
          ]}
          onPress={() => handleAddMedia('VIDEO')}
          disabled={galleryData.videosCount >= 5 || uploading}
        >
          <Text style={styles.addMediaBtnText}>
            + Add Video ({galleryData.videosCount}/5)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Filter Pills */}
      <View style={styles.filterPillRow}>
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'ALL' && styles.filterPillActive]}
          onPress={() => setActiveFilter('ALL')}
        >
          <Text style={[styles.filterPillText, activeFilter === 'ALL' && styles.filterPillTextActive]}>
            All ({galleryData.totalCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'IMAGE' && styles.filterPillActive]}
          onPress={() => setActiveFilter('IMAGE')}
        >
          <Text
            style={[styles.filterPillText, activeFilter === 'IMAGE' && styles.filterPillTextActive]}
          >
            Photos ({galleryData.photosCount}/10)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'VIDEO' && styles.filterPillActive]}
          onPress={() => setActiveFilter('VIDEO')}
        >
          <Text
            style={[styles.filterPillText, activeFilter === 'VIDEO' && styles.filterPillTextActive]}
          >
            Videos ({galleryData.videosCount}/5)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Media Grid List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Partner Gallery...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyTitle}>Your Gallery is Empty</Text>
          <Text style={styles.emptyDesc}>
            Upload up to 10 photos and 5 celebration videos to showcase your work, venue setups, and decor to users!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item, index }) => {
            const isVideo = item.mediaType === 'VIDEO';
            const mediaUrl = resolveMediaUrl(item.thumbnailUrl || item.url);

            return (
              <View style={styles.mediaCard}>
                {/* Media Image / Video Thumbnail */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setPreviewItem(item)}
                  style={styles.imageWrap}
                >
                  <Image
                    source={{ uri: mediaUrl }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />

                  {/* Video Play Badge */}
                  {isVideo && (
                    <View style={styles.videoBadge}>
                      <Text style={styles.videoPlayIcon}>▶ VIDEO</Text>
                    </View>
                  )}

                  {/* Sort Order Badge */}
                  <View style={styles.sortBadge}>
                    <Text style={styles.sortBadgeText}>#{index + 1}</Text>
                  </View>
                </TouchableOpacity>

                {/* Caption & Service Tag */}
                <View style={styles.cardInfo}>
                  <Text style={styles.captionText} numberOfLines={1}>
                    {item.caption || (isVideo ? 'Celebration Video' : 'Celebration Photo')}
                  </Text>
                  {item.service && (
                    <Text style={styles.serviceTag} numberOfLines={1}>
                      🏷 {item.service.name}
                    </Text>
                  )}
                </View>

                {/* Actions Row */}
                <View style={styles.cardActions}>
                  {/* Reorder Buttons */}
                  <View style={styles.reorderGroup}>
                    <TouchableOpacity
                      onPress={() => handleMoveItem(index, 'UP')}
                      disabled={index === 0}
                      style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                    >
                      <Text style={styles.arrowText}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleMoveItem(index, 'DOWN')}
                      disabled={index === filteredItems.length - 1}
                      style={[
                        styles.arrowBtn,
                        index === filteredItems.length - 1 && styles.arrowBtnDisabled,
                      ]}
                    >
                      <Text style={styles.arrowText}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Edit & Delete */}
                  <View style={styles.editGroup}>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={styles.editBtn}
                    >
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteMedia(item)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* 6. Upload Confirmation Modal */}
      <Modal
        visible={!!pendingUpload}
        transparent
        animationType="slide"
        onRequestClose={() => !uploading && setPendingUpload(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Add {pendingUpload?.mediaType === 'IMAGE' ? 'Photo' : 'Video'} to Gallery
            </Text>
            <Text style={styles.modalSub}>
              Give this media an optional caption and link it to one of your celebration services.
            </Text>

            {pendingUpload?.file && (
              <View style={styles.previewThumbWrap}>
                <Image
                  source={{ uri: pendingUpload.file.uri }}
                  style={styles.previewThumb}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Caption Input */}
            <Text style={styles.modalLabel}>Caption (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Grand Entrance Mandap Decor at Taj Palace"
              placeholderTextColor={colors.placeholder}
              value={newCaption}
              onChangeText={setNewCaption}
            />

            {/* Linked Service Selector */}
            {services.length > 0 && (
              <>
                <Text style={styles.modalLabel}>Link to Celebration Service (Optional)</Text>
                <View style={styles.servicePillRow}>
                  {services.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() =>
                        setNewServiceId(newServiceId === s.id ? '' : s.id)
                      }
                      style={[
                        styles.servicePill,
                        newServiceId === s.id && styles.servicePillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.servicePillText,
                          newServiceId === s.id && styles.servicePillTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {uploading ? (
              <View style={styles.uploadingState}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.uploadingStateText}>{uploadProgressText}</Text>
              </View>
            ) : (
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setPendingUpload(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleConfirmUpload}
                >
                  <Text style={styles.modalConfirmText}>Upload to Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 7. Edit Caption & Service Modal */}
      <Modal
        visible={!!editingItem}
        transparent
        animationType="fade"
        onRequestClose={() => !savingEdit && setEditingItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Media Details</Text>

            <Text style={styles.modalLabel}>Caption</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter caption..."
              placeholderTextColor={colors.placeholder}
              value={editCaption}
              onChangeText={setEditCaption}
            />

            {services.length > 0 && (
              <>
                <Text style={styles.modalLabel}>Linked Service</Text>
                <View style={styles.servicePillRow}>
                  {services.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() =>
                        setEditServiceId(editServiceId === s.id ? '' : s.id)
                      }
                      style={[
                        styles.servicePill,
                        editServiceId === s.id && styles.servicePillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.servicePillText,
                          editServiceId === s.id && styles.servicePillTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingItem(null)}
                disabled={savingEdit}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 8. Full-screen Preview Modal */}
      <Modal
        visible={!!previewItem}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewItem(null)}
      >
        <View style={styles.previewBackdrop}>
          <TouchableOpacity
            style={styles.previewCloseBtn}
            onPress={() => setPreviewItem(null)}
          >
            <Text style={styles.previewCloseText}>✕ Close</Text>
          </TouchableOpacity>

          {previewItem && (
            <View style={styles.previewInner}>
              <Image
                source={{ uri: resolveMediaUrl(previewItem.url) }}
                style={styles.previewImage}
                resizeMode="contain"
              />

              <View style={styles.previewMeta}>
                <View style={styles.previewMetaHeader}>
                  <Text style={styles.previewTypeBadge}>
                    {previewItem.mediaType === 'VIDEO' ? '🎥 VIDEO' : '📸 PHOTO'}
                  </Text>
                  {previewItem.service && (
                    <Text style={styles.previewServiceBadge}>
                      {previewItem.service.name}
                    </Text>
                  )}
                </View>

                {previewItem.caption ? (
                  <Text style={styles.previewCaption}>{previewItem.caption}</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.previewDeleteBtn}
                  onPress={() => handleDeleteMedia(previewItem)}
                >
                  <Text style={styles.previewDeleteText}>Delete from Storage</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0EA',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1C1917',
  },
  headerSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  limitCountersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  counterCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FED7AA', // Warm gold/saffron tint
  },
  counterCardFull: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  counterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  counterIcon: {
    fontSize: 14,
  },
  counterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1917',
  },
  counterNumbers: {
    marginBottom: 6,
  },
  counterCurrent: {
    fontSize: 20,
    fontWeight: '900',
    color: '#E65100',
  },
  counterMax: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716C',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E65100',
    borderRadius: 3,
  },
  progressFillFull: {
    backgroundColor: '#EF4444',
  },
  actionButtonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  addMediaBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    backgroundColor: '#E65100',
  },
  addVideoBtn: {
    backgroundColor: '#1E3A8A',
  },
  addMediaBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  filterPillRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  filterPillActive: {
    backgroundColor: '#E65100',
    borderColor: '#E65100',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#57534E',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#78716C',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12.5,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 18,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  mediaCard: {
    width: COLUMN_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 125,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(30, 58, 138, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  videoPlayIcon: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sortBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sortBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardInfo: {
    padding: 8,
  },
  captionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1C1917',
  },
  serviceTag: {
    fontSize: 10,
    color: '#D97706',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
    paddingTop: 6,
  },
  reorderGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  arrowBtn: {
    backgroundColor: '#F3F4F6',
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 10,
    color: '#374151',
  },
  editGroup: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  editBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  editBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#374151',
  },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1917',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 14,
    lineHeight: 16,
  },
  previewThumbWrap: {
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#F3F4F6',
  },
  previewThumb: {
    width: '100%',
    height: '100%',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    color: '#1C1917',
    marginBottom: 12,
  },
  servicePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  servicePill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  servicePillActive: {
    backgroundColor: '#E65100',
    borderColor: '#E65100',
  },
  servicePillText: {
    fontSize: 11,
    color: '#4B5563',
  },
  servicePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  uploadingState: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  uploadingStateText: {
    fontSize: 12,
    color: '#78716C',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#E65100',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  previewCloseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  previewInner: {
    width: '90%',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 380,
    borderRadius: 14,
  },
  previewMeta: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  previewMetaHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  previewTypeBadge: {
    backgroundColor: '#E65100',
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewServiceBadge: {
    backgroundColor: '#1E3A8A',
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewCaption: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  previewDeleteBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  previewDeleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default ProviderGalleryScreen;
