import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconAlertCircle,
  IconMusic,
  IconExternalLink,
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconTrash,
  IconSend,
} from '@tabler/icons-react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Review } from '@goodsongs/api-client';
import { Header, ProfilePhoto, Badge, LoadingScreen } from '@/components';
import { theme, colors } from '@/theme';
import { useAuthStore } from '@/context/authStore';
import { apiClient, ReviewComment } from '@/utils/api';
import { fixImageUrl } from '@/utils/imageUrl';
import { RootStackParamList, HomeStackParamList } from '@/navigation/types';

type ReviewDetailRouteProp = RouteProp<HomeStackParamList, 'ReviewDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ReviewDetailScreen() {
  const route = useRoute<ReviewDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { reviewId, username } = route.params;
  const { user: currentUser } = useAuthStore();

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
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  // Fetch review
  useEffect(() => {
    async function fetchReview() {
      try {
        setLoading(true);
        const fetchedReview = await apiClient.getReview(reviewId);
        setReview(fetchedReview);
        setIsLiked(fetchedReview.liked_by_current_user ?? false);
        setLikesCount(fetchedReview.likes_count ?? 0);
      } catch (err) {
        console.error('Failed to fetch review:', err);
        setError('Review not found');
      } finally {
        setLoading(false);
      }
    }

    fetchReview();
  }, [reviewId]);

  // Load comments
  const loadComments = useCallback(async (page: number, reset: boolean = false) => {
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
      console.error('Failed to load comments:', error);
    } finally {
      setCommentsLoading(false);
      setLoadingMoreComments(false);
    }
  }, [reviewId]);

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
      console.error('Failed to like/unlike review:', error);
      Alert.alert('Error', 'Failed to update like status');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment || !currentUser) return;

    const commentText = newComment.trim();
    setIsSubmittingComment(true);
    try {
      const response = await apiClient.createReviewComment(reviewId, commentText);
      const comment = {
        ...response,
        body: response.body || commentText,
        created_at: response.created_at || new Date().toISOString(),
        author: response.author || {
          id: currentUser.id,
          username: currentUser.username,
          profile_image_url: currentUser.profile_image_url,
        },
      };
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: number) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingCommentId(commentId);
            try {
              await apiClient.deleteReviewComment(reviewId, commentId);
              setComments((prev) => prev.filter((c) => c.id !== commentId));
            } catch (error) {
              console.error('Failed to delete comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            } finally {
              setDeletingCommentId(null);
            }
          },
        },
      ]
    );
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle author press
  const handleAuthorPress = (authorUsername: string) => {
    if (authorUsername === currentUser?.username) {
      navigation.navigate('Main', { screen: 'Profile' });
    } else {
      navigation.navigate('UserProfile', { username: authorUsername });
    }
  };

  // Handle band press
  const handleBandPress = (slug: string) => {
    navigation.navigate('BandProfile', { slug });
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

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !review) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Review" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <IconAlertCircle size={48} color={colors.grape[4]} />
          <Text style={styles.errorText}>{error || 'Review not found'}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const authorUsername = review.author?.username || review.user?.username || username;
  const authorProfileImage = review.author?.profile_image_url;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Review" showBackButton onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Author Row */}
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => handleAuthorPress(authorUsername)}
          >
            <ProfilePhoto
              src={authorProfileImage}
              alt={authorUsername}
              size={44}
              fallback={authorUsername}
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                @{authorUsername}
                <Text style={styles.timestampSeparator}>  ·  </Text>
                <Text style={styles.timestamp}>{formatTimeAgo(review.created_at)}</Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Song Card */}
          <TouchableOpacity
            style={styles.songCard}
            onPress={review.song_link ? handleOpenLink : undefined}
            disabled={!review.song_link}
          >
            {review.artwork_url ? (
              <Image
                source={{ uri: fixImageUrl(review.artwork_url) || '' }}
                style={styles.artwork}
              />
            ) : (
              <View style={[styles.artwork, styles.artworkPlaceholder]}>
                <IconMusic size={28} color={colors.grape[4]} />
              </View>
            )}
            <View style={styles.songDetails}>
              <Text style={styles.songName}>{review.song_name}</Text>
              <TouchableOpacity
                onPress={() => review.band?.slug && handleBandPress(review.band.slug)}
                disabled={!review.band?.slug}
              >
                <Text style={styles.bandName}>{review.band_name}</Text>
              </TouchableOpacity>
            </View>
            {review.song_link && (
              <IconExternalLink size={20} color={colors.grape[6]} />
            )}
          </TouchableOpacity>

          {/* Review Text */}
          <Text style={styles.reviewText}>{review.review_text}</Text>

          {/* Tags */}
          {review.liked_aspects && review.liked_aspects.length > 0 && (
            <View style={styles.tagsRow}>
              {review.liked_aspects.map((aspect, index) => (
                <Badge
                  key={index}
                  text={
                    typeof aspect === 'string'
                      ? aspect
                      : aspect.name || String(aspect)
                  }
                />
              ))}
            </View>
          )}

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLikePress}
              disabled={isLiking}
            >
              {isLiking ? (
                <ActivityIndicator size="small" color={colors.grape[6]} />
              ) : isLiked ? (
                <IconHeartFilled size={22} color="#ef4444" />
              ) : (
                <IconHeart size={22} color={colors.grape[6]} />
              )}
              {likesCount > 0 && (
                <Text style={[styles.actionCount, isLiked && styles.actionCountLiked]}>
                  {likesCount}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.actionButton}>
              <IconMessageCircle size={22} color={colors.grape[6]} />
              {comments.length > 0 && (
                <Text style={styles.actionCount}>{comments.length}</Text>
              )}
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments {comments.length > 0 && `(${comments.length})`}
            </Text>

            {commentsLoading ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator size="small" color={colors.grape[6]} />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>
                  No comments yet. Be the first to comment!
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment, index) => {
                  const commentAuthor = comment.author || {
                    id: 0,
                    username: 'unknown',
                    profile_image_url: undefined,
                  };
                  return (
                    <View key={comment.id ?? `comment-${index}`} style={styles.commentItem}>
                      <TouchableOpacity
                        onPress={() => handleAuthorPress(commentAuthor.username)}
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
                            onPress={() => handleAuthorPress(commentAuthor.username)}
                          >
                            <Text style={styles.commentAuthor}>
                              @{commentAuthor.username}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.commentTime}>
                            {formatTimeAgo(comment.created_at)}
                          </Text>
                          {currentUser?.id === commentAuthor.id && (
                            <TouchableOpacity
                              onPress={() => handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                              style={styles.deleteButton}
                            >
                              {deletingCommentId === comment.id ? (
                                <ActivityIndicator size="small" color="#ef4444" />
                              ) : (
                                <IconTrash size={14} color="#ef4444" />
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.commentBody}>{comment.body}</Text>
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
                      <ActivityIndicator size="small" color={colors.grape[6]} />
                    ) : (
                      <Text style={styles.loadMoreText}>Load more comments</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        {currentUser ? (
          <View style={[styles.commentInputContainer, { paddingBottom: theme.spacing.md + insets.bottom }]}>
            <ProfilePhoto
              src={currentUser.profile_image_url}
              alt={currentUser.username || ''}
              size={36}
              fallback={currentUser.username || '?'}
            />
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={colors.grape[4]}
              value={newComment}
              onChangeText={setNewComment}
              maxLength={300}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newComment.trim() || isSubmittingComment) && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color={colors.grape[0]} />
              ) : (
                <IconSend size={18} color={colors.grape[0]} />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.loginPrompt, { paddingBottom: theme.spacing.md + insets.bottom }]}>
            <Text style={styles.loginPromptText}>
              Log in to leave a comment
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSizes.base,
    color: colors.grape[6],
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
  },
  backButtonText: {
    color: colors.grape[0],
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
  },
  // Author Row
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    color: colors.grape[7],
    lineHeight: theme.fontSizes.lg * 1.4,
  },
  timestampSeparator: {
    color: colors.grape[5],
    fontWeight: 'normal',
  },
  timestamp: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
    fontWeight: 'normal',
    fontFamily: theme.fonts.regular,
  },
  // Song Card
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  artwork: {
    width: 64,
    height: 64,
    borderRadius: theme.radii.sm,
  },
  artworkPlaceholder: {
    backgroundColor: colors.grape[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  songDetails: {
    flex: 1,
  },
  songName: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaBold,
    color: colors.grey[9],
  },
  bandName: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[6],
  },
  // Review Text
  reviewText: {
    fontSize: theme.fontSizes.base,
    color: colors.grey[8],
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.grape[2],
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionCount: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[6],
  },
  actionCountLiked: {
    color: '#ef4444',
  },
  // Comments Section
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.grape[2],
    paddingTop: theme.spacing.md,
  },
  commentsTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.md,
  },
  commentsLoading: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  noComments: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
    textAlign: 'center',
  },
  commentsList: {
    gap: theme.spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    color: colors.grape[7],
  },
  commentTime: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  commentBody: {
    fontSize: theme.fontSizes.sm,
    color: colors.grey[8],
    lineHeight: 20,
  },
  loadMoreButton: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  loadMoreText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[6],
    fontWeight: '500',
  },
  // Comment Input
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.grape[2],
    backgroundColor: colors.grape[0],
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSizes.base,
    color: colors.grape[8],
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.grape[3],
  },
  loginPrompt: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.grape[2],
  },
  loginPromptText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
  },
});
