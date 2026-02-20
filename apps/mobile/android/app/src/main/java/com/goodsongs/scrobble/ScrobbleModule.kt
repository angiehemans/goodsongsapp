package com.goodsongs.scrobble

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*

class ScrobbleModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val storage = ScrobbleStorage(reactContext)

    override fun getName(): String = "ScrobbleModule"

    @ReactMethod
    fun isPermissionGranted(promise: Promise) {
        try {
            val flat = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                "enabled_notification_listeners"
            ) ?: ""
            val componentName = ComponentName(
                reactApplicationContext.packageName,
                ScrobbleListenerService::class.java.name
            ).flattenToString()
            promise.resolve(flat.contains(componentName))
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openPermissionSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_OPEN_SETTINGS", e.message)
        }
    }

    @ReactMethod
    fun isScrobblingEnabled(promise: Promise) {
        promise.resolve(storage.isScrobblingEnabled())
    }

    @ReactMethod
    fun setScrobblingEnabled(enabled: Boolean, promise: Promise) {
        storage.setScrobblingEnabled(enabled)
        promise.resolve(true)
    }

    @ReactMethod
    fun getAppSettings(promise: Promise) {
        try {
            val settings = storage.getAppSettings()
            val array = Arguments.createArray()
            for (setting in settings) {
                val map = Arguments.createMap().apply {
                    putString("packageName", setting.packageName)
                    putString("displayName", setting.displayName)
                    putBoolean("enabled", setting.enabled)
                }
                array.pushMap(map)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("ERR_APP_SETTINGS", e.message)
        }
    }

    @ReactMethod
    fun setAppEnabled(packageName: String, enabled: Boolean, promise: Promise) {
        try {
            storage.setAppEnabled(packageName, enabled)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_SET_APP", e.message)
        }
    }

    @ReactMethod
    fun getPendingCount(promise: Promise) {
        promise.resolve(storage.getPendingCount())
    }

    @ReactMethod
    fun getLastScrobbleTime(promise: Promise) {
        promise.resolve(storage.getLastScrobbleTime().toDouble())
    }

    @ReactMethod
    fun getRecentPendingScrobbles(limit: Int, promise: Promise) {
        try {
            val pending = storage.getPendingScrobbles()
            val array = Arguments.createArray()
            // Return most recent first, up to limit
            val sorted = pending.sortedByDescending { it.playedAt }
            for (s in sorted.take(limit)) {
                val map = Arguments.createMap().apply {
                    putString("id", s.id)
                    putString("trackName", s.trackName)
                    putString("artistName", s.artistName)
                    putString("albumName", s.albumName ?: "")
                    putDouble("durationMs", (s.durationMs ?: 0L).toDouble())
                    putString("sourceApp", s.sourceApp)
                    putDouble("playedAt", s.playedAt.toDouble())
                    // Extended metadata
                    putString("albumArtist", s.albumArtist ?: "")
                    putString("genre", s.genre ?: "")
                    putInt("year", s.year ?: 0)
                    putString("releaseDate", s.releaseDate ?: "")
                    putString("artworkUri", s.artworkUri ?: "")
                    putString("albumArt", s.albumArt ?: "")
                    putInt("syncAttempts", s.syncAttempts)
                }
                array.pushMap(map)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.resolve(Arguments.createArray())
        }
    }

    @ReactMethod
    fun incrementSyncAttempts(ids: ReadableArray, promise: Promise) {
        try {
            val idSet = mutableSetOf<String>()
            for (i in 0 until ids.size()) {
                ids.getString(i)?.let { idSet.add(it) }
            }
            storage.incrementSyncAttempts(idSet)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_INCREMENT_ATTEMPTS", e.message)
        }
    }

    @ReactMethod
    fun removeScrobblesExceedingRetries(maxRetries: Int, promise: Promise) {
        try {
            val pending = storage.getPendingScrobbles()
            val idsToRemove = pending
                .filter { it.syncAttempts >= maxRetries }
                .map { it.id }
                .toSet()
            if (idsToRemove.isNotEmpty()) {
                storage.removeSyncedScrobbles(idsToRemove)
            }
            promise.resolve(idsToRemove.size)
        } catch (e: Exception) {
            promise.reject("ERR_REMOVE_EXCEEDED", e.message)
        }
    }

    @ReactMethod
    fun getCurrentTrack(promise: Promise) {
        val tracker = ScrobbleListenerService.activeTracker
        val track = tracker?.currentTrack
        if (track != null) {
            // Get fresh extended metadata for artwork
            val extMeta = tracker.currentExtendedMetadata
            val map = Arguments.createMap().apply {
                putString("trackName", track.trackName)
                putString("artistName", track.artistName)
                putString("albumName", track.albumName ?: "")
                putString("sourceApp", track.sourceApp)
                // Include artwork if available
                putString("artworkUri", extMeta?.artworkUri ?: "")
                putString("albumArt", extMeta?.albumArt ?: "")
            }
            promise.resolve(map)
        } else {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun removeSyncedScrobbles(ids: ReadableArray, promise: Promise) {
        try {
            val idSet = mutableSetOf<String>()
            for (i in 0 until ids.size()) {
                ids.getString(i)?.let { idSet.add(it) }
            }
            storage.removeSyncedScrobbles(idSet)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_REMOVE_SYNCED", e.message)
        }
    }

    // Required for NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) {
        // No-op: required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // No-op: required for RN event emitter
    }
}
