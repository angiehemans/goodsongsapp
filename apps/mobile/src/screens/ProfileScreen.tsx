import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import { Header, ProfilePhoto, Badge, ReviewCard, EmptyState, LoadingScreen } from '@/components';
import { theme, colors } from '@/theme';
import { useAuthStore } from '@/context/authStore';
import { apiClient } from '@/utils/api';
import { Review, User } from '@goodsongs/api-client';

// Separate component for the edit form to prevent re-render issues
function ProfileEditForm({
  user,
  onSave,
  onCancel,
}: {
  user: User | null;
  onSave: (data: { about_me: string; city: string; region: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [editBio, setEditBio] = useState(user?.about_me || '');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [editRegion, setEditRegion] = useState(user?.region || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ about_me: editBio, city: editCity, region: editRegion });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.profileSection}>
      {/* Profile Info */}
      <View style={styles.profileHeader}>
        <ProfilePhoto
          src={user?.profile_image_url}
          alt={user?.username}
          size={72}
          fallback={user?.username || 'U'}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.username}>@{user?.username || 'User'}</Text>
          <View style={styles.locationEditRow}>
            <TextInput
              style={styles.locationInput}
              value={editCity}
              onChangeText={setEditCity}
              placeholder="City"
              placeholderTextColor={colors.grape[4]}
            />
            <Text style={styles.locationSeparator}>,</Text>
            <TextInput
              style={styles.locationInput}
              value={editRegion}
              onChangeText={setEditRegion}
              placeholder="State"
              placeholderTextColor={colors.grape[4]}
            />
          </View>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioEditContainer}>
        <TextInput
          style={styles.bioInput}
          value={editBio}
          onChangeText={setEditBio}
          placeholder="Write something about yourself..."
          placeholderTextColor={colors.grape[4]}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{editBio.length}/500</Text>
      </View>

      {/* Edit Action Buttons */}
      <View style={styles.editActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.grape[0]} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// View mode profile header
function ProfileViewHeader({
  user,
  reviewCount,
}: {
  user: User | null;
  reviewCount: number;
}) {
  return (
    <View style={styles.profileSection}>
      {/* Profile Info */}
      <View style={styles.profileHeader}>
        <ProfilePhoto
          src={user?.profile_image_url}
          alt={user?.username}
          size={72}
          fallback={user?.username || 'U'}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.username}>@{user?.username || 'User'}</Text>
          {(user?.location || user?.city) && (
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={14} color={colors.grape[5]} />
              <Text style={styles.location}>
                {user.city && user.region
                  ? `${user.city}, ${user.region}`
                  : user.location || user.city}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Bio */}
      {user?.about_me && (
        <Text style={styles.bio} numberOfLines={4}>
          {user.about_me}
        </Text>
      )}

      {/* Stats Badges */}
      <View style={styles.badgesRow}>
        <Badge text={`${reviewCount} recommendation${reviewCount !== 1 ? 's' : ''}`} />
        {user?.followers_count !== undefined && (
          <Badge text={`${user.followers_count} follower${user.followers_count !== 1 ? 's' : ''}`} />
        )}
        {user?.following_count !== undefined && (
          <Badge text={`${user.following_count} following`} />
        )}
      </View>

      {/* Recommendations Title */}
      <Text style={styles.sectionTitle}>Recommendations</Text>
    </View>
  );
}

export function ProfileScreen({ navigation }: any) {
  const { user, setUser } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchUserReviews = useCallback(async () => {
    try {
      const userReviews = await apiClient.getUserReviews();
      setReviews(userReviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserReviews();
  }, [fetchUserReviews]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserReviews();
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async (data: { about_me: string; city: string; region: string }) => {
    try {
      const updatedUser = await apiClient.updateProfile(data);
      setUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
      throw error; // Re-throw so the form knows it failed
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // When editing, use a ScrollView instead of FlatList to avoid keyboard issues
  if (isEditing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Profile" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            <ProfileEditForm
              user={user}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Profile"
        rightContent={
          <TouchableOpacity
            onPress={handleStartEdit}
            style={styles.editButton}
          >
            <Icon name="edit-2" size={20} color={colors.grape[8]} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reviewWrapper}>
            <ReviewCard
              review={item}
              onPressBand={(slug) => navigation.navigate('BandProfile', { slug })}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <ProfileViewHeader user={user} reviewCount={reviews.length} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="music"
            title="No recommendations yet"
            message="Share your first song recommendation!"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  flex: {
    flex: 1,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  profileSection: {
    marginBottom: theme.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.cooperBold,
    color: theme.colors.primary,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  location: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
  },
  locationEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  locationInput: {
    flex: 1,
    fontSize: theme.fontSizes.sm,
    color: colors.grape[8],
    borderBottomWidth: 1,
    borderBottomColor: colors.grape[4],
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: 0,
  },
  locationSeparator: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
    marginHorizontal: theme.spacing.xs,
  },
  bio: {
    fontSize: theme.fontSizes.sm,
    color: colors.grey[7],
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  bioEditContainer: {
    marginBottom: theme.spacing.md,
  },
  bioInput: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[8],
    borderWidth: 1,
    borderColor: colors.grape[4],
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 100,
    lineHeight: 20,
  },
  charCount: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: colors.grape[4],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    color: colors.grape[6],
  },
  saveButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    color: colors.grape[0],
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.cooperBold,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  reviewWrapper: {
    marginBottom: theme.spacing.md,
  },
});
