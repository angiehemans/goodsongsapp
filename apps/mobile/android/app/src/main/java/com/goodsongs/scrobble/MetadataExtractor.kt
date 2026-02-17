package com.goodsongs.scrobble

import android.app.Notification
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSession
import android.net.Uri
import android.os.Build
import android.service.notification.StatusBarNotification
import android.util.Base64
import android.util.Log
import java.io.ByteArrayOutputStream

class MetadataExtractor(
    private val storage: ScrobbleStorage,
    private val context: Context
) {

    companion object {
        private const val TAG = "MetadataExtractor"
        private const val MAX_ARTWORK_SIZE = 4 * 1024 * 1024 // 4MB limit for base64 (leaves room under 5MB API limit)
    }

    /**
     * Attempts to extract track metadata from a StatusBarNotification.
     * Returns null if the notification is not a media notification from an enabled app.
     */
    fun extract(sbn: StatusBarNotification): TrackInfo? {
        val packageName = sbn.packageName

        // Only process notifications from known music apps
        if (packageName !in DefaultApps.packageNames) return null

        // Only process if this app is enabled
        if (!storage.isAppEnabled(packageName)) return null

        val notification = sbn.notification
        val extras = notification.extras ?: return null

        // Check for MediaStyle notification
        val mediaSessionToken = extras.getParcelable<MediaSession.Token>(
            Notification.EXTRA_MEDIA_SESSION
        ) ?: return null

        // Extract basic info from notification extras
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim()
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim()
        val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()?.trim()

        if (title.isNullOrBlank()) return null

        // Parse artist and album based on app format
        val (artist, album) = parseArtistAlbum(packageName, text, subText)

        if (artist.isNullOrBlank()) return null

        return TrackInfo(
            trackName = title,
            artistName = artist,
            albumName = album,
            durationMs = null, // Will be set by PlaybackTracker via MediaController
            sourceApp = packageName,
            playedAt = System.currentTimeMillis()
        )
    }

    /**
     * Data class holding extended metadata from MediaController
     */
    data class ExtendedMetadata(
        val durationMs: Long?,
        val albumArtist: String?,
        val genre: String?,
        val year: Int?,
        val releaseDate: String?,
        val artworkUri: String?,
        val albumArt: String? // base64 encoded
    )

    /**
     * Extracts all available metadata from a MediaController including artwork.
     */
    fun getExtendedMetadataFromController(controller: MediaController?): ExtendedMetadata {
        if (controller == null) {
            Log.d(TAG, "getExtendedMetadata: controller is null")
            return ExtendedMetadata(null, null, null, null, null, null, null)
        }

        val metadata = controller.metadata
        if (metadata == null) {
            Log.d(TAG, "getExtendedMetadata: metadata is null")
            return ExtendedMetadata(null, null, null, null, null, null, null)
        }

        Log.d(TAG, "getExtendedMetadata: extracting from ${controller.packageName}")

        // Extract duration
        val duration = metadata.getLong(MediaMetadata.METADATA_KEY_DURATION)
            .takeIf { it > 0 }

        // Extract album artist
        val albumArtist = metadata.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)
            ?.trim()?.takeIf { it.isNotBlank() }

        // Extract genre
        val genre = metadata.getString(MediaMetadata.METADATA_KEY_GENRE)
            ?.trim()?.takeIf { it.isNotBlank() }?.take(100) // API limit is 100 chars

        // Extract year
        val year = metadata.getLong(MediaMetadata.METADATA_KEY_YEAR)
            .takeIf { it in 1800..2100 }?.toInt()

        // Extract release date (try to parse from METADATA_KEY_DATE)
        val releaseDate = metadata.getString(MediaMetadata.METADATA_KEY_DATE)
            ?.trim()?.takeIf { it.isNotBlank() }?.let { parseReleaseDate(it) }

        // Extract artwork URI from any music service (preferred - no upload needed)
        val artworkUri = getArtworkUri(metadata)
        Log.d(TAG, "getExtendedMetadata: artworkUri = ${artworkUri?.take(100) ?: "null"}")

        // Extract artwork bitmap and convert to base64 (fallback if no URI)
        val albumArt = if (artworkUri == null) {
            val art = getArtworkBase64(metadata)
            Log.d(TAG, "getExtendedMetadata: albumArt (base64) = ${if (art != null) "${art.length} chars" else "null"}")
            art
        } else {
            Log.d(TAG, "getExtendedMetadata: skipping bitmap extraction (have URI)")
            null
        }

        return ExtendedMetadata(
            durationMs = duration,
            albumArtist = albumArtist,
            genre = genre,
            year = year,
            releaseDate = releaseDate,
            artworkUri = artworkUri,
            albumArt = albumArt
        )
    }

    /**
     * Loads a bitmap from a content:// URI (e.g., from Spotify's media provider).
     */
    private fun loadBitmapFromContentUri(metadata: MediaMetadata): Bitmap? {
        // Check for content:// URIs in the URI fields
        val contentUriString = metadata.getString(MediaMetadata.METADATA_KEY_ART_URI)
            ?: metadata.getString(MediaMetadata.METADATA_KEY_ALBUM_ART_URI)
            ?: metadata.getString(MediaMetadata.METADATA_KEY_DISPLAY_ICON_URI)

        if (contentUriString.isNullOrBlank()) return null

        // Only handle content:// URIs here
        if (!contentUriString.startsWith("content://")) return null

        return try {
            Log.d(TAG, "loadBitmapFromContentUri: loading from $contentUriString")
            val uri = Uri.parse(contentUriString)
            val inputStream = context.contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            if (bitmap != null) {
                Log.d(TAG, "loadBitmapFromContentUri: loaded ${bitmap.width}x${bitmap.height}")
            } else {
                Log.d(TAG, "loadBitmapFromContentUri: failed to decode bitmap")
            }
            bitmap
        } catch (e: Exception) {
            Log.w(TAG, "loadBitmapFromContentUri: failed to load - ${e.message}")
            null
        }
    }

    /**
     * Tries to get artwork URI from metadata.
     */
    private fun getArtworkUri(metadata: MediaMetadata): String? {
        // Try various URI keys and log what we find
        val artUri = metadata.getString(MediaMetadata.METADATA_KEY_ART_URI)
        val albumArtUri = metadata.getString(MediaMetadata.METADATA_KEY_ALBUM_ART_URI)
        val displayIconUri = metadata.getString(MediaMetadata.METADATA_KEY_DISPLAY_ICON_URI)

        Log.d(TAG, "getArtworkUri: METADATA_KEY_ART_URI = ${artUri?.take(100) ?: "null"}")
        Log.d(TAG, "getArtworkUri: METADATA_KEY_ALBUM_ART_URI = ${albumArtUri?.take(100) ?: "null"}")
        Log.d(TAG, "getArtworkUri: METADATA_KEY_DISPLAY_ICON_URI = ${displayIconUri?.take(100) ?: "null"}")

        val uri = artUri ?: albumArtUri ?: displayIconUri

        return uri?.trim()?.takeIf {
            it.isNotBlank() && (it.startsWith("http://") || it.startsWith("https://"))
        }?.take(2000) // API limit is 2000 chars
    }

    /**
     * Extracts artwork bitmap and converts to base64.
     * Tries direct bitmap keys first, then falls back to loading from content:// URIs.
     */
    private fun getArtworkBase64(metadata: MediaMetadata): String? {
        try {
            // Try various bitmap keys and log what we find
            val artBitmap = metadata.getBitmap(MediaMetadata.METADATA_KEY_ART)
            val albumArtBitmap = metadata.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
            val displayIconBitmap = metadata.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON)

            Log.d(TAG, "getArtworkBase64: METADATA_KEY_ART = ${if (artBitmap != null) "${artBitmap.width}x${artBitmap.height}" else "null"}")
            Log.d(TAG, "getArtworkBase64: METADATA_KEY_ALBUM_ART = ${if (albumArtBitmap != null) "${albumArtBitmap.width}x${albumArtBitmap.height}" else "null"}")
            Log.d(TAG, "getArtworkBase64: METADATA_KEY_DISPLAY_ICON = ${if (displayIconBitmap != null) "${displayIconBitmap.width}x${displayIconBitmap.height}" else "null"}")

            var bitmap: Bitmap? = artBitmap ?: albumArtBitmap ?: displayIconBitmap

            // If no direct bitmap, try loading from content:// URI
            if (bitmap == null) {
                bitmap = loadBitmapFromContentUri(metadata)
            }

            if (bitmap == null) {
                Log.d(TAG, "getArtworkBase64: no bitmap found")
                return null
            }

            // Scale down if too large (max 500x500 to keep base64 size reasonable)
            val scaledBitmap = scaleBitmapIfNeeded(bitmap, 500)

            // Convert to base64 JPEG
            val outputStream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
            val bytes = outputStream.toByteArray()

            // Check size limit
            if (bytes.size > MAX_ARTWORK_SIZE) {
                Log.w(TAG, "Artwork too large (${bytes.size} bytes), skipping")
                return null
            }

            val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
            return "data:image/jpeg;base64,$base64"
        } catch (e: Exception) {
            Log.w(TAG, "Failed to extract artwork: ${e.message}")
            return null
        }
    }

    /**
     * Scales a bitmap down if it exceeds maxSize on either dimension.
     */
    private fun scaleBitmapIfNeeded(bitmap: Bitmap, maxSize: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height

        if (width <= maxSize && height <= maxSize) {
            return bitmap
        }

        val scale = minOf(maxSize.toFloat() / width, maxSize.toFloat() / height)
        val newWidth = (width * scale).toInt()
        val newHeight = (height * scale).toInt()

        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }

    /**
     * Parses a date string into YYYY-MM-DD format if possible.
     */
    private fun parseReleaseDate(dateString: String): String? {
        // Try common formats
        val patterns = listOf(
            Regex("""(\d{4})-(\d{2})-(\d{2})"""), // YYYY-MM-DD
            Regex("""(\d{4})/(\d{2})/(\d{2})"""), // YYYY/MM/DD
            Regex("""(\d{4})""") // Just year
        )

        for (pattern in patterns) {
            val match = pattern.find(dateString)
            if (match != null) {
                return when (match.groupValues.size) {
                    4 -> "${match.groupValues[1]}-${match.groupValues[2]}-${match.groupValues[3]}"
                    2 -> "${match.groupValues[1]}-01-01" // Year only, use Jan 1
                    else -> null
                }
            }
        }
        return null
    }

    /**
     * Tries to get duration from a MediaController.
     */
    fun getDurationFromController(controller: MediaController?): Long? {
        if (controller == null) return null
        val metadata = controller.metadata ?: return null
        val duration = metadata.getLong(android.media.MediaMetadata.METADATA_KEY_DURATION)
        return if (duration > 0) duration else null
    }

    /**
     * Parse artist and album from notification text fields.
     * Different apps format their notifications differently.
     */
    private fun parseArtistAlbum(
        packageName: String,
        text: String?,
        subText: String?
    ): Pair<String?, String?> {
        return when (packageName) {
            // Spotify: text = "Artist Name", subText = null or album info
            "com.spotify.music" -> {
                // Spotify text often contains "Artist — Album" or just "Artist"
                if (text != null && text.contains(" \u2014 ")) {
                    val parts = text.split(" \u2014 ", limit = 2)
                    Pair(parts[0].trim(), parts.getOrNull(1)?.trim())
                } else {
                    Pair(text, subText)
                }
            }

            // YouTube Music: text = "Artist Name", subText = album or extra info
            "com.google.android.apps.youtube.music" -> {
                // YTM text may contain "Artist \u2022 Album"
                if (text != null && text.contains(" \u2022 ")) {
                    val parts = text.split(" \u2022 ", limit = 2)
                    Pair(parts[0].trim(), parts.getOrNull(1)?.trim())
                } else {
                    Pair(text, subText)
                }
            }

            // Tidal: text = "Artist Name"
            "com.aspiro.tidal" -> {
                Pair(text, subText)
            }

            // Amazon Music: text = "Artist Name"
            "com.amazon.mp3" -> {
                if (text != null && text.contains(" - ")) {
                    val parts = text.split(" - ", limit = 2)
                    Pair(parts[0].trim(), parts.getOrNull(1)?.trim())
                } else {
                    Pair(text, subText)
                }
            }

            // Apple Music: text = "Artist Name — Album"
            "com.apple.android.music" -> {
                if (text != null && text.contains(" \u2014 ")) {
                    val parts = text.split(" \u2014 ", limit = 2)
                    Pair(parts[0].trim(), parts.getOrNull(1)?.trim())
                } else {
                    Pair(text, subText)
                }
            }

            // Bandcamp: text = "Artist Name", subText = album info
            "com.bandcamp.android" -> {
                Pair(text, subText)
            }

            // SoundCloud: text = "Artist Name"
            "com.soundcloud.android" -> {
                // SoundCloud may show "Artist - Album" or just artist
                if (text != null && text.contains(" - ")) {
                    val parts = text.split(" - ", limit = 2)
                    Pair(parts[0].trim(), parts.getOrNull(1)?.trim())
                } else {
                    Pair(text, subText)
                }
            }

            // Plexamp: text = "Artist Name", subText = album info
            "tv.plex.labs.plexamp" -> {
                // Plexamp typically shows "Artist — Album" in text
                if (text != null && text.contains(" \u2014 ")) {
                    val parts = text.split(" \u2014 ", limit = 2)
                    Pair(parts[0].trim(), parts.getOrNull(1)?.trim())
                } else if (text != null && text.contains(" - ")) {
                    val parts = text.split(" - ", limit = 2)
                    Pair(parts[0].trim(), parts.getOrNull(1)?.trim())
                } else {
                    Pair(text, subText)
                }
            }

            // Symfonium: text = "Artist Name", subText = album info
            "app.symfonik.music.player" -> {
                // Symfonium may use various separators
                if (text != null && text.contains(" \u2014 ")) {
                    val parts = text.split(" \u2014 ", limit = 2)
                    Pair(parts[0].trim(), parts.getOrNull(1)?.trim())
                } else if (text != null && text.contains(" - ")) {
                    val parts = text.split(" - ", limit = 2)
                    Pair(parts[0].trim(), parts.getOrNull(1)?.trim())
                } else {
                    Pair(text, subText)
                }
            }

            else -> Pair(text, subText)
        }
    }
}
