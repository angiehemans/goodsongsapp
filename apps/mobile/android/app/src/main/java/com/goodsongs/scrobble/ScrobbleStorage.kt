package com.goodsongs.scrobble

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

class ScrobbleStorage(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "goodsongs_scrobble"
        private const val KEY_PENDING_SCROBBLES = "pending_scrobbles"
        private const val KEY_APP_SETTINGS = "app_settings"
        private const val KEY_SCROBBLING_ENABLED = "scrobbling_enabled"
        private const val KEY_LAST_SCROBBLE_TIME = "last_scrobble_time"
    }

    fun addPendingScrobble(track: TrackInfo) {
        val scrobbles = getPendingScrobblesJson()
        val obj = JSONObject().apply {
            put("id", UUID.randomUUID().toString())
            put("trackName", track.trackName)
            put("artistName", track.artistName)
            put("albumName", track.albumName ?: "")
            put("durationMs", track.durationMs ?: 0L)
            put("sourceApp", track.sourceApp)
            put("playedAt", track.playedAt)
            put("syncAttempts", 0)
            put("createdAt", System.currentTimeMillis())
            // Extended metadata
            put("albumArtist", track.albumArtist ?: "")
            put("genre", track.genre ?: "")
            put("year", track.year ?: 0)
            put("releaseDate", track.releaseDate ?: "")
            put("artworkUri", track.artworkUri ?: "")
            put("albumArt", track.albumArt ?: "")
        }
        scrobbles.put(obj)
        prefs.edit().putString(KEY_PENDING_SCROBBLES, scrobbles.toString()).apply()
        setLastScrobbleTime(track.playedAt)
    }

    fun getPendingScrobbles(): List<PendingScrobble> {
        val arr = getPendingScrobblesJson()
        val result = mutableListOf<PendingScrobble>()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            result.add(
                PendingScrobble(
                    id = obj.getString("id"),
                    trackName = obj.getString("trackName"),
                    artistName = obj.getString("artistName"),
                    albumName = obj.optString("albumName", null)?.takeIf { it.isNotBlank() },
                    durationMs = obj.optLong("durationMs", 0).takeIf { it > 0 },
                    sourceApp = obj.getString("sourceApp"),
                    playedAt = obj.getLong("playedAt"),
                    syncAttempts = obj.optInt("syncAttempts", 0),
                    createdAt = obj.optLong("createdAt", 0),
                    // Extended metadata
                    albumArtist = obj.optString("albumArtist", null)?.takeIf { it.isNotBlank() },
                    genre = obj.optString("genre", null)?.takeIf { it.isNotBlank() },
                    year = obj.optInt("year", 0).takeIf { it > 0 },
                    releaseDate = obj.optString("releaseDate", null)?.takeIf { it.isNotBlank() },
                    artworkUri = obj.optString("artworkUri", null)?.takeIf { it.isNotBlank() },
                    albumArt = obj.optString("albumArt", null)?.takeIf { it.isNotBlank() }
                )
            )
        }
        return result
    }

    fun removeSyncedScrobbles(ids: Set<String>) {
        val arr = getPendingScrobblesJson()
        val filtered = JSONArray()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            if (obj.getString("id") !in ids) {
                filtered.put(obj)
            }
        }
        prefs.edit().putString(KEY_PENDING_SCROBBLES, filtered.toString()).apply()
    }

    fun incrementSyncAttempts(ids: Set<String>) {
        val arr = getPendingScrobblesJson()
        val updated = JSONArray()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            if (obj.getString("id") in ids) {
                obj.put("syncAttempts", obj.optInt("syncAttempts", 0) + 1)
            }
            updated.put(obj)
        }
        prefs.edit().putString(KEY_PENDING_SCROBBLES, updated.toString()).apply()
    }

    fun getAppSettings(): List<AppScrobbleSetting> {
        val json = prefs.getString(KEY_APP_SETTINGS, null) ?: return DefaultApps.list
        val arr = JSONArray(json)
        val storedSettings = mutableListOf<AppScrobbleSetting>()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            storedSettings.add(
                AppScrobbleSetting(
                    packageName = obj.getString("packageName"),
                    displayName = obj.getString("displayName"),
                    enabled = obj.getBoolean("enabled")
                )
            )
        }

        // Merge in any new apps from DefaultApps that aren't in stored settings
        val storedPackages = storedSettings.map { it.packageName }.toSet()
        val newApps = DefaultApps.list.filter { it.packageName !in storedPackages }

        return if (newApps.isNotEmpty()) {
            val merged = storedSettings + newApps
            // Save the merged list for next time
            saveAppSettings(merged)
            merged
        } else {
            storedSettings
        }
    }

    fun setAppEnabled(packageName: String, enabled: Boolean) {
        val settings = getAppSettings().toMutableList()
        val index = settings.indexOfFirst { it.packageName == packageName }
        if (index >= 0) {
            settings[index] = settings[index].copy(enabled = enabled)
        }
        saveAppSettings(settings)
    }

    fun isAppEnabled(packageName: String): Boolean {
        return getAppSettings().find { it.packageName == packageName }?.enabled ?: false
    }

    fun isScrobblingEnabled(): Boolean {
        return prefs.getBoolean(KEY_SCROBBLING_ENABLED, false)
    }

    fun setScrobblingEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_SCROBBLING_ENABLED, enabled).apply()
    }

    fun getPendingCount(): Int {
        return getPendingScrobblesJson().length()
    }

    fun getLastScrobbleTime(): Long {
        return prefs.getLong(KEY_LAST_SCROBBLE_TIME, 0)
    }

    private fun setLastScrobbleTime(time: Long) {
        prefs.edit().putLong(KEY_LAST_SCROBBLE_TIME, time).apply()
    }

    private fun getPendingScrobblesJson(): JSONArray {
        val json = prefs.getString(KEY_PENDING_SCROBBLES, null) ?: return JSONArray()
        return try {
            JSONArray(json)
        } catch (e: Exception) {
            JSONArray()
        }
    }

    private fun saveAppSettings(settings: List<AppScrobbleSetting>) {
        val arr = JSONArray()
        for (setting in settings) {
            arr.put(JSONObject().apply {
                put("packageName", setting.packageName)
                put("displayName", setting.displayName)
                put("enabled", setting.enabled)
            })
        }
        prefs.edit().putString(KEY_APP_SETTINGS, arr.toString()).apply()
    }
}
