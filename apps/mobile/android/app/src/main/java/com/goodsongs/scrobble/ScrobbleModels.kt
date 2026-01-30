package com.goodsongs.scrobble

data class TrackInfo(
    val trackName: String,
    val artistName: String,
    val albumName: String?,
    val durationMs: Long?,
    val sourceApp: String,
    val playedAt: Long // epoch millis
)

data class PendingScrobble(
    val id: String,
    val trackName: String,
    val artistName: String,
    val albumName: String?,
    val durationMs: Long?,
    val sourceApp: String,
    val playedAt: Long,
    val syncAttempts: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)

data class AppScrobbleSetting(
    val packageName: String,
    val displayName: String,
    val enabled: Boolean
)

object DefaultApps {
    val list = listOf(
        AppScrobbleSetting("com.spotify.music", "Spotify", true),
        AppScrobbleSetting("com.google.android.apps.youtube.music", "YouTube Music", true),
        AppScrobbleSetting("com.aspiro.tidal", "Tidal", true),
        AppScrobbleSetting("com.amazon.mp3", "Amazon Music", true),
        AppScrobbleSetting("com.apple.android.music", "Apple Music", true)
    )

    val packageNames = list.map { it.packageName }.toSet()
}
