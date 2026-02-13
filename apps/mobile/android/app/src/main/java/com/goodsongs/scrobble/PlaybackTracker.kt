package com.goodsongs.scrobble

import android.media.session.MediaController
import android.os.Handler
import android.os.Looper
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
    private var currentTrackScrobbled: Boolean = false
    private val handler = Handler(Looper.getMainLooper())
    private var scrobbleRunnable: Runnable? = null

    // Callback to notify when a scrobble happens (for sending events to RN)
    var onScrobbleCallback: (() -> Unit)? = null

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

        // Cancel any pending scrobble timer for the previous track
        cancelScrobbleTimer()

        // Track changed — check if we should scrobble the previous one
        // (only if it wasn't already scrobbled by the timer)
        scrobbled = if (prev != null && !currentTrackScrobbled) {
            tryScrobble(prev)
        } else {
            false
        }

        // Start tracking the new track
        currentTrack = newTrack
        currentTrackStartTime = System.currentTimeMillis()
        currentTrackScrobbled = false
        currentDurationMs = if (controller != null) {
            metadataExtractor.getDurationFromController(controller)
        } else {
            null
        }

        // Start timer to scrobble after 20 seconds
        startScrobbleTimer(newTrack)

        Log.d(TAG, "Now tracking: ${newTrack.artistName} - ${newTrack.trackName}")
        return scrobbled
    }

    /**
     * Called when playback stops (notification removed).
     * Returns true if a scrobble was created.
     */
    fun onPlaybackStopped(): Boolean {
        cancelScrobbleTimer()
        val track = currentTrack ?: return false
        // Only scrobble if not already scrobbled by the timer
        val scrobbled = if (!currentTrackScrobbled) {
            tryScrobble(track)
        } else {
            false
        }
        currentTrack = null
        currentDurationMs = null
        currentTrackScrobbled = false
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

    /**
     * Start a timer to scrobble the track after 20 seconds.
     */
    private fun startScrobbleTimer(track: TrackInfo) {
        scrobbleRunnable = Runnable {
            if (currentTrack != null && isSameTrack(currentTrack!!, track) && !currentTrackScrobbled) {
                val scrobbleTrack = track.copy(
                    playedAt = currentTrackStartTime,
                    durationMs = currentDurationMs
                )
                storage.addPendingScrobble(scrobbleTrack)
                currentTrackScrobbled = true
                Log.d(TAG, "Scrobbled (after 20s): ${track.artistName} - ${track.trackName}")
                onScrobbleCallback?.invoke()
            }
        }
        handler.postDelayed(scrobbleRunnable!!, SCROBBLE_THRESHOLD_MS)
    }

    /**
     * Cancel any pending scrobble timer.
     */
    private fun cancelScrobbleTimer() {
        scrobbleRunnable?.let { handler.removeCallbacks(it) }
        scrobbleRunnable = null
    }
}
