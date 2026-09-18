import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import {
  useUserProfile,
  useUpdateProfile,
  useUploadAvatar,
} from '../../hooks/useProfile';
import Config from '../../config';
import colors from '../../theme/colors';
import AppIcon from '../../components/AppIcon';

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const reduxUser = useAppSelector((state) => state.auth.user);
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isRefetching,
    refetch,
  } = useUserProfile();

  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const user = profileData || reduxUser;

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdateProfile = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Phone number cannot be empty.');
      return;
    }

    updateProfileMutation.mutate(
      { name, phone },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Profile details updated successfully.');
        },
        onError: (err: any) => {
          Alert.alert('Update Failed', err.message || 'Could not update profile details.');
        },
      }
    );
  };

  const handleImageUpload = (localUri: string) => {
    const filename = localUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('avatar', {
      uri: localUri,
      name: filename,
      type,
    } as any);

    uploadAvatarMutation.mutate(formData, {
      onSuccess: () => {
        Alert.alert('Success', 'Profile photo updated successfully.');
      },
      onError: (err: any) => {
        Alert.alert('Upload Failed', err.message || 'Could not upload avatar image.');
      },
    });
  };

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Gallery access permissions are required to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera permissions are required to take a new photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const handleSelectAvatar = () => {
    Alert.alert('Change Profile Photo', 'Choose a source for your photo:', [
      { text: 'Camera', onPress: pickImageFromCamera },
      { text: 'Gallery', onPress: pickImageFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out of Shubh Ausar?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logoutUser());
        },
      },
    ]);
  };

  const getFullImageUrl = (imagePath?: string | null): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = Config.API_URL.split('/api/v1')[0];
    return `${baseUrl}/${imagePath.replace(/^\//, '')}`;
  };

  const avatarUri = getFullImageUrl(user?.avatar);
  const isSaving = updateProfileMutation.isPending;
  const isUploading = uploadAvatarMutation.isPending;

  if (isProfileLoading && !user) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching profile records...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Manage your account, celebrations & preferences</Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleSelectAvatar} disabled={isUploading}>
            {isUploading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator color="#ffffff" size="large" />
              </View>
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handleSelectAvatar}
            disabled={isUploading}
          >
            <Text style={styles.uploadBtnText}>
              {isUploading ? 'Uploading...' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Navigation Hub */}
        <View style={styles.hubCard}>
          <Text style={styles.hubTitle}>CELEBRATION MANAGEMENT</Text>
          <TouchableOpacity
            style={styles.hubItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EventsTab')}
          >
            <AppIcon type="ionicons" name="calendar-outline" size={20} color="#881337" />
            <Text style={styles.hubItemText}>My Events</Text>
            <AppIcon type="ionicons" name="chevron-forward" size={16} color="#A8A29E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('QuotesListScreen')}
          >
            <AppIcon type="ionicons" name="document-text-outline" size={20} color="#881337" />
            <Text style={styles.hubItemText}>My Quotes & Offers</Text>
            <AppIcon type="ionicons" name="chevron-forward" size={16} color="#A8A29E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MyBookingsScreen')}
          >
            <AppIcon type="ionicons" name="checkmark-done-circle-outline" size={20} color="#881337" />
            <Text style={styles.hubItemText}>My Confirmed Bookings</Text>
            <AppIcon type="ionicons" name="chevron-forward" size={16} color="#A8A29E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('FavoritesTab')}
          >
            <AppIcon type="ionicons" name="heart-outline" size={20} color="#881337" />
            <Text style={styles.hubItemText}>My Favorites</Text>
            <AppIcon type="ionicons" name="chevron-forward" size={16} color="#A8A29E" />
          </TouchableOpacity>
        </View>

        {/* Personal Details Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>PERSONAL INFORMATION</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            placeholderTextColor="#A8A29E"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor="#A8A29E"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email Address (Registered)</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={email}
            editable={false}
          />

          {/* Action buttons */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleUpdateProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.passwordBtn}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text style={styles.passwordBtnText}>Change Account Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Log Out Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#881337', // Brand Royal Maroon
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#881337',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  avatarLetter: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  uploadBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E0D8',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  uploadBtnText: {
    color: '#881337',
    fontSize: 11.5,
    fontWeight: '700',
  },
  hubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    padding: 16,
    marginBottom: 16,
  },
  hubTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
    gap: 12,
  },
  hubItemText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C1917',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    padding: 16,
  },
  formTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  label: {
    fontSize: 11.5,
    color: '#78716C',
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FAF8F5',
    borderColor: '#E7E0D8',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#1C1917',
    marginBottom: 14,
  },
  disabledInput: {
    backgroundColor: '#F5F5F4',
    color: '#A8A29E',
  },
  saveBtn: {
    backgroundColor: '#E65100', // Saffron Orange
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  passwordBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7E0D8',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  passwordBtnText: {
    color: '#881337',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#78716C',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ProfileScreen;
