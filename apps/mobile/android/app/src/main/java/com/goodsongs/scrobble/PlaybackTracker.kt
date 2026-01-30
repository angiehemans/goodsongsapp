package com.goodsongs.scrobble

import android.media.session.MediaController
import android.util.Log

class PlaybackTracker(
    private val storage: ScrobbleStorage,
    private val metadataExtractor: MetadataExtractor
) {

    companion object {
        private const val TAG = "PlaybackTracker"
        // Scrobble after 20 seconds of listening
        private const val SCROBBLE_THRESHOLD_MS = 20 * 1000L // 20 seconds
    }

    var currentTrack: TrackInfo? = null
        private set
    private var currentTrackStartTime: Long = 0
    private var currentDurationMs: Long? = null

    /**
     * Called when a new media notification is received.
     * Returns true if a scrobble was created for the previous track.
     */
    fun onTrackUpdate(newTrack: TrackInfo, controller: MediaController?): Boolean {
        val prev = currentTrack
        val scrobbled: Boolean

        // Check if the track actually changed
        if (prev != null && isSameTrack(prev, newTrack)) {
            // Same track, just a notification update (e.g., play/pause state change)
            // Update duration if we can now get it
            if (currentDurationMs == null && controller != null) {
                currentDurationMs = metadataExtractor.getDurationFromController(controller)
            }
            return false
        }

        // Track changed — check if we should scrobble the previous one
        scrobbled = if (prev != null) {
            tryScrobble(prev)
        } else {
            false
        }

        // Start tracking the new track
        currentTrack = newTrack
        currentTrackStartTime = System.currentTimeMillis()
        currentDurationMs = if (controller != null) {
            metadataExtractor.getDurationFromController(controller)
        } else {
            null
        }

        Log.d(TAG, "Now tracking: ${newTrack.artistName} - ${newTrack.trackName}")
        return scrobbled
    }

    /**
     * Called when playback stops (notification removed).
     * Returns true if a scrobble was created.
     */
    fun onPlaybackStopped(): Boolean {
        val track = currentTrack ?: return false
        val scrobbled = tryScrobble(track)
        currentTrack = null
        currentDurationMs = null
        return scrobbled
    }

    /**
     * Try to scrobble a track if the user listened for at least 20 seconds.
     */
    private fun tryScrobble(track: TrackInfo): Boolean {
        val playDuration = System.currentTimeMillis() - currentTrackStartTime

        if (playDuration < SCROBBLE_THRESHOLD_MS) {
            Log.d(TAG, "Skipping scrobble: only played ${playDuration}ms (need ${SCROBBLE_THRESHOLD_MS}ms)")
            return false
        }

        val scrobbleTrack = track.copy(
            playedAt = currentTrackStartTime,
            durationMs = currentDurationMs
        )
        storage.addPendingScrobble(scrobbleTrack)
        Log.d(TAG, "Scrobbled: ${track.artistName} - ${track.trackName}")
        return true
    }

    private fun isSameTrack(a: TrackInfo, b: TrackInfo): Boolean {
        return a.trackName.equals(b.trackName, ignoreCase = true) &&
                a.artistName.equals(b.artistName, ignoreCase = true) &&
                a.sourceApp == b.sourceApp
    }
}
