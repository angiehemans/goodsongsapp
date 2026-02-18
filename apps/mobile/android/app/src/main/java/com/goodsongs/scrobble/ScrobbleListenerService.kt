package com.goodsongs.scrobble

import android.media.session.MediaController
import android.media.session.MediaSession
import android.app.Notification
import android.os.Handler
import android.os.Looper
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

class ScrobbleListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "ScrobbleListener"
        var isServiceConnected = false
            private set
        // Expose tracker so ScrobbleModule can read the current track
        var activeTracker: PlaybackTracker? = null
            private set
    }

    private lateinit var storage: ScrobbleStorage
    private lateinit var extractor: MetadataExtractor
    private lateinit var tracker: PlaybackTracker
    private val handler = Handler(Looper.getMainLooper())
    private var pendingArtworkRetry: Runnable? = null

    override fun onCreate() {
        super.onCreate()
        storage = ScrobbleStorage(applicationContext)
        extractor = MetadataExtractor(storage, applicationContext)
        tracker = PlaybackTracker(storage, extractor)
        activeTracker = tracker

        // Set callback for timer-based scrobbles (after 20 seconds)
        tracker.onScrobbleCallback = {
            sendScrobbleEvent()
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        isServiceConnected = true
        Log.d(TAG, "NotificationListenerService connected")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        isServiceConnected = false
        Log.d(TAG, "NotificationListenerService disconnected")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return
        if (!storage.isScrobblingEnabled()) return

        val track = extractor.extract(sbn) ?: return

        // Try to get a MediaController for duration info
        val controller = getMediaController(sbn)

        val scrobbled = tracker.onTrackUpdate(track, controller)
        sendNowPlayingEvent(tracker.currentTrack)
        if (scrobbled) {
            sendScrobbleEvent()
        }

        // If artwork wasn't available, schedule a retry after 2 seconds
        // (some apps don't have artwork ready immediately)
        val extMeta = tracker.currentExtendedMetadata
        if (extMeta?.artworkUri == null && extMeta?.albumArt == null) {
            scheduleArtworkRetry(controller)
        }
    }

    /**
     * Schedule a retry to fetch artwork after a delay.
     * Artwork may not be available immediately when a track starts.
     */
    private fun scheduleArtworkRetry(controller: MediaController?) {
        // Cancel any pending retry
        pendingArtworkRetry?.let { handler.removeCallbacks(it) }

        pendingArtworkRetry = Runnable {
            val currentTrack = tracker.currentTrack ?: return@Runnable

            // Re-fetch extended metadata
            val newExtMeta = extractor.getExtendedMetadataFromController(controller)

            // If we got artwork this time, update and re-send Now Playing
            if (newExtMeta.artworkUri != null || newExtMeta.albumArt != null) {
                // Update the tracker's metadata
                tracker.updateExtendedMetadata(newExtMeta)
                sendNowPlayingEvent(currentTrack)
                Log.d(TAG, "Artwork retry successful for ${currentTrack.trackName}")
            }
        }
        handler.postDelayed(pendingArtworkRetry!!, 2000) // 2 second delay
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        if (sbn == null) return
        if (sbn.packageName !in DefaultApps.packageNames) return
        if (!storage.isScrobblingEnabled()) return

        // Cancel any pending artwork retry
        pendingArtworkRetry?.let { handler.removeCallbacks(it) }
        pendingArtworkRetry = null

        val scrobbled = tracker.onPlaybackStopped()
        sendNowPlayingEvent(null)
        if (scrobbled) {
            sendScrobbleEvent()
        }
    }

    private fun getMediaController(sbn: StatusBarNotification): MediaController? {
        return try {
            val token = sbn.notification.extras
                ?.getParcelable<MediaSession.Token>(Notification.EXTRA_MEDIA_SESSION)
            if (token != null) MediaController(applicationContext, token) else null
        } catch (e: Exception) {
            Log.w(TAG, "Failed to get MediaController", e)
            null
        }
    }

    /**
     * Send now-playing event to React Native so the feed can show current track.
     */
    private fun sendNowPlayingEvent(track: TrackInfo?) {
        try {
            val app = applicationContext as? ReactApplication ?: return
            val reactContext = app.reactNativeHost
                .reactInstanceManager
                .currentReactContext ?: return

            val params = if (track != null) {
                val extMeta = tracker.currentExtendedMetadata
                // Use album from MediaMetadata if available (preferred over notification which may be playlist name)
                val albumName = extMeta?.albumName ?: track.albumName
                Arguments.createMap().apply {
                    putString("trackName", track.trackName)
                    putString("artistName", track.artistName)
                    putString("albumName", albumName ?: "")
                    putString("sourceApp", track.sourceApp)
                    // Include artwork if available
                    putString("artworkUri", extMeta?.artworkUri ?: "")
                    putString("albumArt", extMeta?.albumArt ?: "")
                }
            } else {
                Arguments.createMap() // empty = nothing playing
            }

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onNowPlaying", params)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to send now playing event to RN", e)
        }
    }

    /**
     * Send an event to React Native so the UI can update pending count.
     */
    private fun sendScrobbleEvent() {
        try {
            val app = applicationContext as? ReactApplication ?: return
            val reactContext = app.reactNativeHost
                .reactInstanceManager
                .currentReactContext ?: return

            val params = Arguments.createMap().apply {
                putInt("pendingCount", storage.getPendingCount())
                putDouble("lastScrobbleTime", storage.getLastScrobbleTime().toDouble())
            }

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onScrobble", params)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to send scrobble event to RN", e)
        }
    }
}
