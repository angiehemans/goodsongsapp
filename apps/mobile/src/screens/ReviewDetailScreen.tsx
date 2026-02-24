import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import FastImage from "react-native-fast-image";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  IconAlertCircle,
  IconArrowBackUp,
  IconExternalLink,
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconTrash,
  IconSend,
  IconEdit,
  IconShare,
} from "@tabler/icons-react-native";
import {
  RouteProp,
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Review } from "@goodsongs/api-client";
import {
  Header,
  ProfilePhoto,
  Tag,
  LoadingScreen,
  MentionText,
  MentionTextInput,
} from "@/components";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import { useAuthStore } from "@/context/authStore";
import { apiClient, ReviewComment } from "@/utils/api";
import { fixImageUrl } from "@/utils/imageUrl";
import { RootStackParamList, HomeStackParamList } from "@/navigation/types";

type ReviewDetailRouteProp = RouteProp<HomeStackParamList, "ReviewDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function ReviewDetailScreen() {
  const route = useRoute<ReviewDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { reviewId, username } = route.params;
  const { user: currentUser } = useAuthStore();
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Like state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  // Comments state
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
    null,
  );
  const [likingCommentId, setLikingCommentId] = useState<number | null>(null);
  const [inputKey, setInputKey] = useState(0);

  // Fetch review - refetches when screen is focused (including when returning from edit)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function fetchReview() {
        try {
          const fetchedReview = await apiClient.getReview(reviewId);
          if (isMounted) {
            setReview(fetchedReview);
            setIsLiked(fetchedReview.liked_by_current_user ?? false);
            setLikesCount(fetchedReview.likes_count ?? 0);
            setLoading(false);
          }
        } catch (err) {
          console.error("Failed to fetch review:", err);
          if (isMounted) {
            setError("Review not found");
            setLoading(false);
          }
        }
      }

      fetchReview();

      return () => {
        isMounted = false;
      };
    }, [reviewId]),
  );

  // Load comments
  const loadComments = useCallback(
    async (page: number, reset: boolean = false) => {
      if (reset) {
        setCommentsLoading(true);
      } else {
        setLoadingMoreComments(true);
      }

      try {
        const response = await apiClient.getReviewComments(reviewId, page);
        if (reset) {
          setComments(response.comments);
        } else {
          setComments((prev) => [...prev, ...response.comments]);
        }
        setHasMoreComments(response.pagination.has_next_page);
        setCommentsPage(page);
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setCommentsLoading(false);
        setLoadingMoreComments(false);
      }
    },
    [reviewId],
  );

  useEffect(() => {
    loadComments(1, true);
  }, [loadComments]);

  // Handle like
  const handleLikePress = async () => {
    if (isLiking || !review) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        const response = await apiClient.unlikeReview(review.id);
        setIsLiked(false);
        setLikesCount(response.likes_count);
      } else {
        const response = await apiClient.likeReview(review.id);
        setIsLiked(true);
        setLikesCount(response.likes_count);
      }
    } catch (error) {
      console.error("Failed to like/unlike review:", error);
      Alert.alert("Error", "Failed to update like status");
    } finally {
      setIsLiking(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!review) return;
    try {
      const authorName =
        review.author?.username || review.user?.username || username;
      const shareUrl = `https://goodsongs.app/users/${authorName}/reviews/${review.id}`;
      await Share.share({
        message: `Check out this song recommendation on GoodSongs: "${review.song_name}" by ${review.band_name}\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  // Handle submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment || !currentUser) return;

    const commentText = newComment.trim();
    setIsSubmittingComment(true);
    try {
      await apiClient.createReviewComment(reviewId, commentText);
      // Refetch comments to get proper IDs from server
      const response = await apiClient.getReviewComments(reviewId, 1);
      setComments(response.comments);
      setCommentsPage(1);
      setHasMoreComments(response.pagination.has_next_page);
      setNewComment("");
      setInputKey((k) => k + 1);
      Keyboard.dismiss();
    } catch (error) {
      console.error("Failed to post comment:", error);
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle like/unlike comment
  const handleLikeComment = async (comment: ReviewComment) => {
    if (likingCommentId !== null) return;

    setLikingCommentId(comment.id);
    try {
      if (comment.liked_by_current_user) {
        const response = await apiClient.unlikeComment(comment.id);
        setComments((prev) =>
          prev.map((c) =>
            c.id === comment.id
              ? {
                  ...c,
                  liked_by_current_user: false,
                  likes_count: response.likes_count,
                }
              : c,
          ),
        );
      } else {
        const response = await apiClient.likeComment(comment.id);
        setComments((prev) =>
          prev.map((c) =>
            c.id === comment.id
              ? {
                  ...c,
                  liked_by_current_user: true,
                  likes_count: response.likes_count,
                }
              : c,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to like/unlike comment:", error);
    } finally {
      setLikingCommentId(null);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: number) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingCommentId(commentId);
            try {
              await apiClient.deleteReviewComment(reviewId, commentId);
              setComments((prev) => prev.filter((c) => c.id !== commentId));
            } catch (error) {
              console.error("Failed to delete comment:", error);
              Alert.alert("Error", "Failed to delete comment");
            } finally {
              setDeletingCommentId(null);
            }
          },
        },
      ],
    );
  };

  // Handle reply to comment
  const handleReply = (username: string) => {
    setNewComment(`@${username} `);
  };

  // Format time ago for comments
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 604800)}w`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Handle author press
  const handleAuthorPress = (authorUsername: string) => {
    if (authorUsername === currentUser?.username) {
      navigation.navigate("Main", { screen: "Profile" });
    } else {
      navigation.navigate("UserProfile", { username: authorUsername });
    }
  };

  // Handle band press
  const handleBandPress = (slug: string) => {
    navigation.navigate("BandProfile", { slug });
  };

  // Handle open link
  const handleOpenLink = () => {
    if (review?.song_link) {
      Linking.openURL(review.song_link);
    }
  };

  // Load more comments
  const handleLoadMoreComments = () => {
    if (hasMoreComments && !loadingMoreComments) {
      loadComments(commentsPage + 1, false);
    }
  };

  // Navigate to edit screen
  const handleEditReview = () => {
    if (review) {
      const likedAspects =
        review.liked_aspects?.map((aspect) =>
          typeof aspect === "string" ? aspect : aspect.name || String(aspect),
        ) || [];

      navigation.navigate("Main", {
        screen: "CreateReview",
        params: {
          reviewId: review.id,
          song_name: review.song_name,
          band_name: review.band_name,
          artwork_url: review.artwork_url || undefined,
          song_link: review.song_link || undefined,
          review_text: review.review_text,
          liked_aspects: likedAspects,
          username: authorUsername,
        },
      });
    }
  };

  // Check if current user is the review owner
  const isOwner =
    currentUser &&
    review &&
    (currentUser.id === review.author?.id ||
      currentUser.id === review.user?.id ||
      currentUser.username === review.author?.username ||
      currentUser.username === review.user?.username);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !review) {
    return (
      <SafeAreaView
        style={[styles.container, themedStyles.container]}
        edges={["top"]}
      >
        <Header
          title="Recommendation"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <IconAlertCircle size={48} color={themeColors.textPlaceholder} />
          <Text style={[styles.errorText, themedStyles.errorText]}>
            {error || "Recommendation not found"}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, themedStyles.backButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, themedStyles.backButtonText]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const authorUsername =
    review.author?.username || review.user?.username || username;
  const authorProfileImage = review.author?.profile_image_url;

  return (
    <SafeAreaView
      style={[styles.container, themedStyles.container]}
      edges={["top"]}
    >
      <Header
        title="Recommendation"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={100}
          enableOnAndroid
          enableResetScrollToCoords={false}
        >
          {/* Review Card - matching ReviewCard component design */}
          <View style={[styles.card, themedStyles.card]}>
            {/* Author Row */}
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() => handleAuthorPress(authorUsername)}
            >
              <ProfilePhoto
                src={authorProfileImage}
                alt={authorUsername}
                size={36}
                fallback={authorUsername}
              />
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, themedStyles.authorName]}>
                  @{authorUsername}
                </Text>
                <Text style={[styles.dateText, themedStyles.dateText]}>
                  {formatDate(review.created_at)}
                </Text>
              </View>
              {isOwner && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditReview}
                >
                  <IconEdit size={18} color={themeColors.iconMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Song Content Container */}
            <View style={[styles.songContainer, themedStyles.songContainer]}>
              {/* Song Row */}
              <View style={[styles.songRow, themedStyles.songRow]}>
                <View style={styles.songInfo}>
                  {review.artwork_url ? (
                    <FastImage
                      source={{ uri: fixImageUrl(review.artwork_url) || "" }}
                      style={styles.artwork}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  ) : (
                    <View
                      style={[
                        styles.artwork,
                        styles.artworkPlaceholder,
                        themedStyles.artworkPlaceholder,
                      ]}
                    />
                  )}
                  <View style={styles.songDetails}>
                    <Text
                      style={[styles.songName, themedStyles.songName]}
                      numberOfLines={1}
                    >
                      {review.song_name}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        review.band?.slug && handleBandPress(review.band.slug)
                      }
                      disabled={!review.band?.slug}
                    >
                      <Text
                        style={[styles.bandName, themedStyles.bandName]}
                        numberOfLines={1}
                      >
                        {review.band_name}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {review.song_link && (
                  <TouchableOpacity
                    onPress={handleOpenLink}
                    style={styles.linkButton}
                  >
                    <IconExternalLink size={20} color={themeColors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Review Text - full text, not truncated */}
              <MentionText
                text={
                  (review as any).formatted_review_text || review.review_text
                }
                style={[styles.reviewText, themedStyles.reviewText]}
              />

              {/* Tags */}
              {review.liked_aspects && review.liked_aspects.length > 0 && (
                <View style={styles.tagsRow}>
                  {review.liked_aspects.map((aspect, index) => (
                    <Tag
                      key={index}
                      text={
                        typeof aspect === "string"
                          ? aspect
                          : aspect.name || String(aspect)
                      }
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Actions Row */}
            <View style={styles.actionsRow}>
              {/* Share Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <IconShare size={22} color={themeColors.textMuted} />
              </TouchableOpacity>

              {/* Comments Button */}
              <View style={styles.actionButton}>
                <IconMessageCircle size={22} color={themeColors.textMuted} />
                {comments.length > 0 && (
                  <Text style={[styles.actionCount, themedStyles.actionCount]}>
                    {comments.length}
                  </Text>
                )}
              </View>

              {/* Like Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLikePress}
                disabled={isLiking}
              >
                {isLiking ? (
                  <ActivityIndicator
                    size="small"
                    color={themeColors.textMuted}
                  />
                ) : isLiked ? (
                  <IconHeartFilled size={22} color="#ef4444" />
                ) : (
                  <IconHeart size={22} color={themeColors.textMuted} />
                )}
                {likesCount > 0 && (
                  <Text
                    style={[
                      styles.actionCount,
                      themedStyles.actionCount,
                      isLiked && styles.actionCountLiked,
                    ]}
                  >
                    {likesCount}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={[styles.commentsTitle, themedStyles.commentsTitle]}>
              Comments {comments.length > 0 && `(${comments.length})`}
            </Text>

            {commentsLoading ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator size="small" color={themeColors.textMuted} />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.noComments}>
                <Text
                  style={[styles.noCommentsText, themedStyles.noCommentsText]}
                >
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment, index) => {
                  const commentAuthor = comment.author || {
                    id: 0,
                    username: "unknown",
                    profile_image_url: undefined,
                  };
                  return (
                    <View
                      key={comment.id ?? `comment-${index}`}
                      style={styles.commentItem}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          handleAuthorPress(commentAuthor.username)
                        }
                      >
                        <ProfilePhoto
                          src={commentAuthor.profile_image_url}
                          alt={commentAuthor.username}
                          size={32}
                          fallback={commentAuthor.username}
                        />
                      </TouchableOpacity>
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <TouchableOpacity
                            onPress={() =>
                              handleAuthorPress(commentAuthor.username)
                            }
                          >
                            <Text
                              style={[
                                styles.commentAuthor,
                                themedStyles.commentAuthor,
                              ]}
                            >
                              @{commentAuthor.username}
                            </Text>
                          </TouchableOpacity>
                          <Text
                            style={[
                              styles.commentTime,
                              themedStyles.commentTime,
                            ]}
                          >
                            {formatTimeAgo(comment.created_at)}
                          </Text>
                          {currentUser?.id === commentAuthor.id &&
                            comment.id && (
                              <TouchableOpacity
                                onPress={() => handleDeleteComment(comment.id)}
                                disabled={deletingCommentId === comment.id}
                                style={styles.deleteButton}
                              >
                                {deletingCommentId === comment.id ? (
                                  <ActivityIndicator
                                    size="small"
                                    color="#ef4444"
                                  />
                                ) : (
                                  <IconTrash size={14} color="#ef4444" />
                                )}
                              </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.commentBodyRow}>
                          <MentionText
                            text={comment.formatted_body || comment.body}
                            style={[
                              styles.commentBody,
                              themedStyles.commentBody,
                            ]}
                          />
                          {/* Comment Actions */}
                          <View style={styles.commentActions}>
                            {/* Reply Button */}
                            {currentUser && (
                              <TouchableOpacity
                                style={styles.commentActionButton}
                                onPress={() =>
                                  handleReply(commentAuthor.username)
                                }
                              >
                                <IconArrowBackUp
                                  size={14}
                                  color={themeColors.iconMuted}
                                />
                              </TouchableOpacity>
                            )}
                            {/* Like Button */}
                            <TouchableOpacity
                              style={styles.commentActionButton}
                              onPress={() => handleLikeComment(comment)}
                              disabled={likingCommentId === comment.id}
                            >
                              {likingCommentId === comment.id ? (
                                <ActivityIndicator
                                  size="small"
                                  color={themeColors.iconMuted}
                                />
                              ) : comment.liked_by_current_user ? (
                                <IconHeartFilled size={14} color="#ef4444" />
                              ) : (
                                <IconHeart
                                  size={14}
                                  color={themeColors.iconMuted}
                                />
                              )}
                              {comment.likes_count > 0 && (
                                <Text
                                  style={[
                                    styles.commentLikeCount,
                                    themedStyles.commentLikeCount,
                                    comment.liked_by_current_user &&
                                      styles.commentLikeCountLiked,
                                  ]}
                                >
                                  {comment.likes_count}
                                </Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {hasMoreComments && (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMoreComments}
                    disabled={loadingMoreComments}
                  >
                    {loadingMoreComments ? (
                      <ActivityIndicator
                        size="small"
                        color={themeColors.textMuted}
                      />
                    ) : (
                      <Text
                        style={[styles.loadMoreText, themedStyles.loadMoreText]}
                      >
                        Load more comments
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </KeyboardAwareScrollView>

        {/* Comment Input - Fixed at bottom */}
        {currentUser ? (
          <View
            style={[
              styles.commentInputContainer,
              themedStyles.commentInputContainer,
              { paddingBottom: theme.spacing.md + insets.bottom },
            ]}
          >
            <ProfilePhoto
              src={currentUser.profile_image_url}
              alt={currentUser.username || ""}
              size={36}
              fallback={currentUser.username || "?"}
            />
            <MentionTextInput
              key={inputKey}
              style={[styles.commentInput, themedStyles.commentInput]}
              placeholder="Add a comment"
              placeholderTextColor={themeColors.textPlaceholder}
              value={newComment}
              onChangeText={setNewComment}
              maxLength={300}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                themedStyles.sendButton,
                (!newComment.trim() || isSubmittingComment) &&
                  themedStyles.sendButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? (
                <ActivityIndicator
                  size="small"
                  color={themeColors.btnPrimaryText}
                />
              ) : (
                <IconSend size={18} color={themeColors.btnPrimaryText} />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.loginPrompt,
              themedStyles.loginPrompt,
              { paddingBottom: theme.spacing.md + insets.bottom },
            ]}
          >
            <Text
              style={[styles.loginPromptText, themedStyles.loginPromptText]}
            >
              Log in to leave a comment
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Themed styles that change based on light/dark mode
const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    errorText: {
      color: colors.textMuted,
    },
    backButton: {
      backgroundColor: colors.btnPrimaryBg,
    },
    backButtonText: {
      color: colors.btnPrimaryText,
    },
    card: {
      borderBottomColor: colors.borderDefault,
    },
    authorName: {
      color: colors.textMuted,
    },
    dateText: {
      color: colors.textMuted,
    },
    songContainer: {
      borderBottomColor: colors.borderSubtle,
    },
    songRow: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    artworkPlaceholder: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    songName: {
      color: colors.textPrimary,
    },
    bandName: {
      color: colors.textMuted,
    },
    reviewText: {
      color: colors.textSecondary,
    },
    actionCount: {
      color: colors.textMuted,
    },
    commentsTitle: {
      color: colors.textHeading,
    },
    noCommentsText: {
      color: colors.textMuted,
    },
    commentAuthor: {
      color: colors.textSecondary,
    },
    commentTime: {
      color: colors.textMuted,
    },
    commentBody: {
      color: colors.textSecondary,
    },
    commentLikeCount: {
      color: colors.textMuted,
    },
    loadMoreText: {
      color: colors.textMuted,
    },
    commentInputContainer: {
      borderTopColor: colors.borderSubtle,
      backgroundColor: colors.bgApp,
    },
    commentInput: {
      backgroundColor: colors.bgSurface,
      color: colors.textPrimary,
    },
    sendButton: {
      backgroundColor: colors.btnPrimaryBg,
    },
    sendButtonDisabled: {
      backgroundColor: colors.iconSubtle,
    },
    loginPrompt: {
      borderTopColor: colors.borderSubtle,
    },
    loginPromptText: {
      color: colors.textMuted,
    },
  });

// Static styles that don't change with theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSizes.base,
    textAlign: "center",
  },
  backButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
  },
  backButtonText: {
    fontSize: theme.fontSizes.base,
    fontWeight: "600",
  },
  // Card - matching ReviewCard design
  card: {
    borderBottomWidth: 2,
  },
  // Author Row
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  authorInfo: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaMedium,
  },
  dateText: {
    fontSize: theme.fontSizes.xs,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  // Song Container
  songContainer: {
    marginTop: theme.spacing.sm,
    borderBottomWidth: 2,
    borderStyle: "dotted",
    paddingBottom: theme.spacing.md,
  },
  songRow: {
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  songInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.sm,
  },
  artworkPlaceholder: {},
  songDetails: {
    flex: 1,
  },
  songName: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaMedium,
    lineHeight: 24,
  },
  bandName: {
    fontSize: theme.fontSizes.sm,
  },
  linkButton: {
    padding: theme.spacing.xs,
  },
  // Review Text
  reviewText: {
    fontSize: theme.fontSizes.base,
    lineHeight: 20,
    marginVertical: theme.spacing.sm,
  },
  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  // Actions Row
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  actionCount: {
    fontSize: theme.fontSizes.sm,
  },
  actionCountLiked: {
    color: "#ef4444",
  },
  // Comments Section
  commentsSection: {
    paddingTop: theme.spacing.md,
  },
  commentsTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    marginBottom: theme.spacing.md,
  },
  commentsLoading: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  noComments: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  noCommentsText: {
    fontSize: theme.fontSizes.sm,
    textAlign: "center",
  },
  commentsList: {
    gap: theme.spacing.md,
  },
  commentItem: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: theme.fontSizes.xs,
  },
  deleteButton: {
    marginLeft: "auto",
    padding: 4,
  },
  commentBodyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  commentBody: {
    flex: 1,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  commentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  commentLikeCount: {
    fontSize: theme.fontSizes.xs,
  },
  commentLikeCountLiked: {
    color: "#ef4444",
  },
  loadMoreButton: {
    alignItems: "center",
    padding: theme.spacing.sm,
  },
  loadMoreText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "500",
  },
  // Comment Input
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSizes.base,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {},
  loginPrompt: {
    padding: theme.spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
  },
  loginPromptText: {
    fontSize: theme.fontSizes.sm,
  },
});
