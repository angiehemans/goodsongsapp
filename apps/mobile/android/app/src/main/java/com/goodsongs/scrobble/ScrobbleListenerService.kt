package com.goodsongs.scrobble

import android.media.session.MediaController
import android.media.session.MediaSession
import android.app.Notification
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
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        if (sbn == null) return
        if (sbn.packageName !in DefaultApps.packageNames) return
        if (!storage.isScrobblingEnabled()) return

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
                Arguments.createMap().apply {
                    putString("trackName", track.trackName)
                    putString("artistName", track.artistName)
                    putString("albumName", track.albumName ?: "")
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
