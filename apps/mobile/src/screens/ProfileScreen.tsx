import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@react-native-vector-icons/feather";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Header,
  ProfilePhoto,
  Badge,
  ReviewCard,
  EmptyState,
  LoadingScreen,
} from "@/components";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import { useAuthStore } from "@/context/authStore";
import { apiClient } from "@/utils/api";
import { Review, User } from "@goodsongs/api-client";
import { RootStackParamList } from "@/navigation/types";

// Separate component for the edit form to prevent re-render issues
function ProfileEditForm({
  user,
  onSave,
  onCancel,
}: {
  user: User | null;
  onSave: (data: {
    about_me: string;
    city: string;
    region: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );
  const [editBio, setEditBio] = useState(user?.about_me || "");
  const [editCity, setEditCity] = useState(user?.city || "");
  const [editRegion, setEditRegion] = useState(user?.region || "");
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
          fallback={user?.username || "U"}
        />
        <View style={styles.profileInfo}>
          <Text style={[styles.username, themedStyles.username]}>@{user?.username || "User"}</Text>
          <View style={styles.locationEditRow}>
            <TextInput
              style={[styles.locationInput, themedStyles.locationInput]}
              value={editCity}
              onChangeText={setEditCity}
              placeholder="City"
              placeholderTextColor={themeColors.textPlaceholder}
            />
            <Text style={[styles.locationSeparator, themedStyles.locationSeparator]}>,</Text>
            <TextInput
              style={[styles.locationInput, themedStyles.locationInput]}
              value={editRegion}
              onChangeText={setEditRegion}
              placeholder="State"
              placeholderTextColor={themeColors.textPlaceholder}
            />
          </View>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioEditContainer}>
        <TextInput
          style={[styles.bioInput, themedStyles.bioInput]}
          value={editBio}
          onChangeText={setEditBio}
          placeholder="Write something about yourself..."
          placeholderTextColor={themeColors.textPlaceholder}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, themedStyles.charCount]}>{editBio.length}/500</Text>
      </View>

      {/* Edit Action Buttons */}
      <View style={styles.editActions}>
        <TouchableOpacity
          style={[styles.cancelButton, themedStyles.cancelButton]}
          onPress={onCancel}
          disabled={isSaving}
        >
          <Text style={[styles.cancelButtonText, themedStyles.cancelButtonText]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, themedStyles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={themeColors.btnPrimaryText} />
          ) : (
            <Text style={[styles.saveButtonText, themedStyles.saveButtonText]}>Save</Text>
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
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );

  return (
    <View style={styles.profileSection}>
      {/* Profile Info */}
      <View style={styles.profileHeader}>
        <ProfilePhoto
          src={user?.profile_image_url}
          alt={user?.username}
          size={72}
          fallback={user?.username || "U"}
        />
        <View style={styles.profileInfo}>
          <Text style={[styles.username, themedStyles.username]}>@{user?.username || "User"}</Text>
          {(user?.location || user?.city) && (
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={14} color={themeColors.iconMuted} />
              <Text style={[styles.location, themedStyles.location]}>
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
        <Text style={[styles.bio, themedStyles.bio]} numberOfLines={4}>
          {user.about_me}
        </Text>
      )}

      {/* Stats Badges */}
      <View style={styles.badgesRow}>
        <Badge
          text={`${reviewCount} recommendation${reviewCount !== 1 ? "s" : ""}`}
        />
        {user?.followers_count !== undefined && (
          <Badge
            text={`${user.followers_count} follower${user.followers_count !== 1 ? "s" : ""}`}
          />
        )}
        {user?.following_count !== undefined && (
          <Badge text={`${user.following_count} following`} />
        )}
      </View>

      {/* Recommendations Title */}
      <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Recommendations</Text>
    </View>
  );
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function ProfileScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );
  const { user, setUser } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Pagination state
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  const fetchUserReviews = useCallback(
    async (page: number = 1, isLoadMore: boolean = false) => {
      if (!user?.username) return;

      if (isLoadMore) {
        setLoadingMoreReviews(true);
      }

      try {
        const userProfile = await apiClient.getUserProfile(user.username, page);
        const newReviews = userProfile.reviews || [];

        if (isLoadMore) {
          setReviews((prev) => [...prev, ...newReviews]);
        } else {
          setReviews(newReviews);
        }

        setHasMoreReviews(
          userProfile.reviews_pagination?.has_next_page || false,
        );
        setReviewsPage(page);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        if (!isLoadMore) {
          setReviews([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMoreReviews(false);
      }
    },
    [user?.username],
  );

  useEffect(() => {
    fetchUserReviews();
  }, [fetchUserReviews]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserReviews(1, false);
  };

  const handleLoadMore = () => {
    if (hasMoreReviews && !loadingMoreReviews) {
      fetchUserReviews(reviewsPage + 1, true);
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async (data: {
    about_me: string;
    city: string;
    region: string;
  }) => {
    try {
      const updatedUser = await apiClient.updateProfile(data);
      setUser(updatedUser);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
      throw error; // Re-throw so the form knows it failed
    }
  };

  // Memoized render function - must be defined before any early returns
  const renderReviewItem = useCallback(({ item }: { item: Review }) => (
    <View style={styles.reviewWrapper}>
      <ReviewCard
        review={item}
        onPressReview={(review: Review) =>
          navigation.navigate("ReviewDetail", {
            reviewId: review.id,
            username: review.author?.username || review.user?.username || user?.username || '',
          })
        }
        onPressBand={(slug: string) =>
          navigation.navigate("BandProfile", { slug })
        }
      />
    </View>
  ), [navigation, user?.username]);

  if (loading) {
    return <LoadingScreen />;
  }

  // When editing, use a ScrollView instead of FlatList to avoid keyboard issues
  if (isEditing) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]} edges={["top"]}>
        <Header title="Profile" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
    <SafeAreaView style={[styles.container, themedStyles.container]} edges={["top"]}>
      <Header
        title="Profile"
        rightContent={
          <TouchableOpacity onPress={handleStartEdit} style={styles.editButton}>
            <Icon name="edit-2" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[themeColors.btnPrimaryBg]}
            tintColor={themeColors.btnPrimaryBg}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <ProfileViewHeader
            user={user}
            reviewCount={user?.reviews_count || reviews.length}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="music"
            title="No recommendations yet"
            message="Share your first song recommendation!"
          />
        }
        ListFooterComponent={
          loadingMoreReviews ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={themeColors.btnPrimaryBg} />
            </View>
          ) : null
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

// Themed styles that change based on light/dark mode
const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    username: {
      color: colors.textHeading,
    },
    location: {
      color: colors.textMuted,
    },
    locationInput: {
      color: colors.textPrimary,
      borderBottomColor: colors.borderDefault,
    },
    locationSeparator: {
      color: colors.textMuted,
    },
    bio: {
      color: colors.textSecondary,
    },
    bioInput: {
      color: colors.textPrimary,
      borderColor: colors.borderDefault,
    },
    charCount: {
      color: colors.textMuted,
    },
    cancelButton: {
      borderColor: colors.borderDefault,
    },
    cancelButtonText: {
      color: colors.textMuted,
    },
    saveButton: {
      backgroundColor: colors.btnPrimaryBg,
    },
    saveButtonText: {
      color: colors.btnPrimaryText,
    },
    sectionTitle: {
      color: colors.textHeading,
    },
  });

// Static styles that don't change with theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.thecoaMedium,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  location: {
    fontSize: theme.fontSizes.sm,
  },
  locationEditRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  locationInput: {
    flex: 1,
    fontSize: theme.fontSizes.sm,
    borderBottomWidth: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: 0,
  },
  locationSeparator: {
    fontSize: theme.fontSizes.sm,
    marginHorizontal: theme.spacing.xs,
  },
  bio: {
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  bioEditContainer: {
    marginBottom: theme.spacing.md,
  },
  bioInput: {
    fontSize: theme.fontSizes.sm,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    minHeight: 100,
    lineHeight: 20,
  },
  charCount: {
    fontSize: theme.fontSizes.xs,
    textAlign: "right",
    marginTop: theme.spacing.xs,
  },
  editActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontFamily: theme.fonts.thecoaBold,
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  reviewWrapper: {
    marginBottom: theme.spacing.md,
  },
  loadingMore: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
});
