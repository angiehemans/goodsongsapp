package com.goodsongs.scrobble

import android.app.Notification
import android.media.session.MediaController
import android.media.session.MediaSession
import android.os.Build
import android.service.notification.StatusBarNotification

class MetadataExtractor(private val storage: ScrobbleStorage) {

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

            else -> Pair(text, subText)
        }
    }
}
