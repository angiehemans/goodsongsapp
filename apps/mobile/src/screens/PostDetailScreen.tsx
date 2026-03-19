import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import FastImage from 'react-native-fast-image';
import { Header, ProfilePhoto } from '@/components';
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { SemanticColors } from '@/theme/semanticColors';
import { apiClient } from '@/utils/api';
import { fixImageUrl } from '@/utils/imageUrl';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PostDetailScreen({ route, navigation }: any) {
  const { username, slug, bandSlug } = route.params;
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );

  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  const fetchPost = useCallback(async () => {
    try {
      const response = bandSlug
        ? await apiClient.getBandPost(bandSlug, slug)
        : await apiClient.getPost(username, slug);
      const data = response.data || response;
      setPost(data.post);
      setUser(data.user);
      setIsLiked(data.post?.liked_by_current_user ?? false);
      setLikesCount(data.post?.likes_count ?? 0);
      setCommentsCount(data.post?.comments_count ?? data.comments?.length ?? 0);
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  }, [username, slug, bandSlug]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleToggleLike = async () => {
    if (!post) return;
    try {
      if (isLiked) {
        const result = await apiClient.unlikePost(post.id);
        setIsLiked(false);
        setLikesCount(result.likes_count ?? likesCount - 1);
      } else {
        const result = await apiClient.likePost(post.id);
        setIsLiked(true);
        setLikesCount(result.likes_count ?? likesCount + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const baseUrl = __DEV__ ? 'http://localhost:3001' : 'https://www.goodsongs.app';
    let postUrl: string;
    if (bandSlug) {
      postUrl = `${baseUrl}/bands/${bandSlug}/${slug}`;
    } else {
      postUrl = `${baseUrl}/blog/${username}/${slug}`;
    }
    try {
      await Share.share({
        title: post.title,
        message: postUrl,
        url: postUrl,
      });
    } catch (error) {
      // User cancelled
    }
  };

  const handlePressAuthor = () => {
    if (bandSlug) {
      navigation.navigate('BandProfile', { slug: bandSlug });
    } else if (user?.username) {
      navigation.navigate('UserProfile', { username: user.username });
    }
  };

  const handleOpenSongLink = (url: string | undefined) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
        <Header
          title=""
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.btnPrimaryBg} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
        <Header
          title=""
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, themedStyles.errorText]}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const primaryBand = user?.primary_band;
  const authorName = primaryBand?.name || user?.display_name || user?.username || username;
  const authorUsername = user?.username || username;
  const authorImage = user?.profile_image_url || primaryBand?.profile_picture_url || primaryBand?.spotify_image_url;
  const publishDate = post.publish_date || post.created_at;

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
      <Header
        title=""
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Featured Image */}
        {post.featured_image_url && (
          <FastImage
            source={{ uri: fixImageUrl(post.featured_image_url) }}
            style={[styles.featuredImage, themedStyles.featuredImage]}
            resizeMode={FastImage.resizeMode.cover}
          />
        )}

        {/* Post Title */}
        <Text style={[styles.postTitle, themedStyles.postTitle]}>{post.title}</Text>

        {/* Author Row */}
        <TouchableOpacity
          style={[styles.authorRow, themedStyles.authorRow]}
          onPress={handlePressAuthor}
        >
          <ProfilePhoto
            src={fixImageUrl(authorImage)}
            alt={authorName}
            size={40}
            fallback={authorName || 'U'}
          />
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, themedStyles.authorName]}>{authorName}</Text>
            {publishDate && (
              <Text style={[styles.publishDate, themedStyles.publishDate]}>
                {formatDate(publishDate)}
              </Text>
            )}
          </View>
          <Icon name="chevron-right" size={20} color={themeColors.iconMuted} />
        </TouchableOpacity>

        {/* Song Card */}
        {post.song && (
          <TouchableOpacity
            style={[styles.songCard, themedStyles.songCard]}
            onPress={() => handleOpenSongLink(post.song.song_link)}
            activeOpacity={0.7}
          >
            {post.song.artwork_url && (
              <FastImage
                source={{ uri: fixImageUrl(post.song.artwork_url) }}
                style={styles.songArtwork}
                resizeMode={FastImage.resizeMode.cover}
              />
            )}
            <View style={styles.songInfo}>
              <Text style={[styles.songName, themedStyles.songName]} numberOfLines={1}>
                {post.song.song_name}
              </Text>
              {post.song.band_name && (
                <Text style={[styles.songBand, themedStyles.songBand]} numberOfLines={1}>
                  {post.song.band_name}
                </Text>
              )}
            </View>
            {post.song.song_link && (
              <View style={[styles.playButton, themedStyles.playButton]}>
                <Icon name="play" size={18} color={themeColors.btnPrimaryBg} />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Post Body */}
        {post.body && (
          <View style={styles.bodySection}>
            <Text style={[styles.bodyText, themedStyles.bodyText]}>
              {stripHtml(post.body)}
            </Text>
          </View>
        )}

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleToggleLike}>
            <Icon
              name="heart"
              size={22}
              color={isLiked ? '#ef4444' : themeColors.iconMuted}
            />
            {likesCount > 0 && (
              <Text style={[styles.actionCount, themedStyles.actionCount]}>
                {likesCount}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.actionButton}>
            <Icon name="message-circle" size={22} color={themeColors.iconMuted} />
            {commentsCount > 0 && (
              <Text style={[styles.actionCount, themedStyles.actionCount]}>
                {commentsCount}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Icon name="share" size={22} color={themeColors.iconMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    featuredImage: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    postTitle: {
      color: colors.textHeading,
    },
    authorRow: {
      backgroundColor: colors.bgSurface,
    },
    authorName: {
      color: colors.textHeading,
    },
    publishDate: {
      color: colors.textMuted,
    },
    songCard: {
      backgroundColor: colors.bgSurface,
    },
    songName: {
      color: colors.textHeading,
    },
    songBand: {
      color: colors.textMuted,
    },
    playButton: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    bodyText: {
      color: colors.textSecondary,
    },
    actionCount: {
      color: colors.textMuted,
    },
  });

// Static styles that don't change with theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fontSizes.base,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  featuredImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.lg,
  },
  postTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.thecoaBold,
    marginBottom: theme.spacing.md,
    lineHeight: 32,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
  },
  publishDate: {
    fontSize: theme.fontSizes.xs,
    marginTop: 2,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  songArtwork: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.sm,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
  },
  songBand: {
    fontSize: theme.fontSizes.sm,
    marginTop: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodySection: {
    marginBottom: theme.spacing.lg,
  },
  bodyText: {
    fontSize: theme.fontSizes.base,
    lineHeight: 26,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionCount: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
});
