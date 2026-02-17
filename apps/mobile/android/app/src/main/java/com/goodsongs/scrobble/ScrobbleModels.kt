package com.goodsongs.scrobble

data class TrackInfo(
    val trackName: String,
    val artistName: String,
    val albumName: String?,
    val durationMs: Long?,
    val sourceApp: String,
    val playedAt: Long, // epoch millis
    // Extended metadata
    val albumArtist: String? = null,
    val genre: String? = null,
    val year: Int? = null,
    val releaseDate: String? = null, // YYYY-MM-DD format
    val artworkUri: String? = null,
    val albumArt: String? = null // base64 encoded
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
    val createdAt: Long = System.currentTimeMillis(),
    // Extended metadata
    val albumArtist: String? = null,
    val genre: String? = null,
    val year: Int? = null,
    val releaseDate: String? = null,
    val artworkUri: String? = null,
    val albumArt: String? = null
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
        AppScrobbleSetting("com.apple.android.music", "Apple Music", true),
        AppScrobbleSetting("com.bandcamp.android", "Bandcamp", true),
        AppScrobbleSetting("com.soundcloud.android", "SoundCloud", true),
        AppScrobbleSetting("tv.plex.labs.plexamp", "Plexamp", true),
        AppScrobbleSetting("app.symfonik.music.player", "Symfonium", true)
    )

    val packageNames = list.map { it.packageName }.toSet()
}
