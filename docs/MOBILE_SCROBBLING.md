# Mobile App Scrobbling System

This document outlines how the GoodSongs mobile app listens for songs playing on Android, extracts metadata, syncs with the API, and updates the UI.

---

## 1. Listening for Music via Android Notifications

The app uses Android's `NotificationListenerService` to monitor music playback across all supported streaming apps.

**File:** `apps/mobile/android/app/src/main/java/com/goodsongs/scrobble/ScrobbleListenerService.kt`

### Key Lifecycle Methods

| Method | Trigger |
|--------|---------|
| `onListenerConnected()` | Android grants notification access |
| `onListenerDisconnected()` | Notification access is revoked |
| `onNotificationPosted(sbn)` | A notification appears (new track playing) |
| `onNotificationRemoved(sbn)` | A notification is removed (playback stopped) |

### Supported Music Apps

| Package Name | App |
|--------------|-----|
| `com.spotify.music` | Spotify |
| `com.google.android.apps.youtube.music` | YouTube Music |
| `com.aspiro.tidal` | Tidal |
| `com.amazon.mp3` | Amazon Music |
| `com.apple.android.music` | Apple Music |

---

## 2. Data Extracted from Notifications

**File:** `apps/mobile/android/app/src/main/java/com/goodsongs/scrobble/MetadataExtractor.kt`

The `MetadataExtractor` class parses Android media notifications and MediaController metadata to extract:

### Basic Metadata (from Notification)

| Field | Source |
|-------|--------|
| Track Name | `Notification.EXTRA_TITLE` |
| Artist Name | Parsed from `EXTRA_TEXT` (app-specific formatting) |
| Album Name | Parsed from `EXTRA_SUB_TEXT` or combined fields |
| Source App | Package name of the music app |
| Played At | Unix timestamp when track was detected |

### Extended Metadata (from MediaController)

| Field | MediaMetadata Key | Notes |
|-------|-------------------|-------|
| Duration | `METADATA_KEY_DURATION` | In milliseconds |
| Album Artist | `METADATA_KEY_ALBUM_ARTIST` | Useful for compilations |
| Genre | `METADATA_KEY_GENRE` | Max 100 chars |
| Year | `METADATA_KEY_YEAR` | 4-digit year (1800-2100) |
| Release Date | `METADATA_KEY_DATE` | Parsed to YYYY-MM-DD |
| Artwork URI | `METADATA_KEY_ART_URI` / `METADATA_KEY_ALBUM_ART_URI` | Preferred (no upload needed) |
| Album Art | `METADATA_KEY_ART` / `METADATA_KEY_ALBUM_ART` | Bitmap converted to base64 |

### Artwork Extraction Priority

1. **artwork_uri** - External URL from any music service (Spotify, YouTube Music, Tidal, etc.) - highest priority, no upload needed
2. **album_art** - Bitmap converted to base64 JPEG (scaled to max 500x500, 85% quality)
3. Backend enrichment fallback - if neither is available

### Data Model

```kotlin
data class TrackInfo(
    val trackName: String,
    val artistName: String,
    val albumName: String?,
    val durationMs: Long?,
    val sourceApp: String,
    val playedAt: Long,  // epoch millis
    // Extended metadata
    val albumArtist: String? = null,
    val genre: String? = null,
    val year: Int? = null,
    val releaseDate: String? = null,  // YYYY-MM-DD format
    val artworkUri: String? = null,
    val albumArt: String? = null      // base64 encoded
)
```

---

## 3. Scrobble Decision Logic

**File:** `apps/mobile/android/app/src/main/java/com/goodsongs/scrobble/PlaybackTracker.kt`

### Scrobbling Rules

- **Minimum listen duration:** 20 seconds
- A track is scrobbled when:
  1. User has listened for 20+ seconds AND a new track starts, OR
  2. User has listened for 20+ seconds AND playback stops

### Flow

```
onNotificationPosted()
       │
       ▼
Is track different from current?
       │
       ├─ No ──▶ Continue tracking
       │
       ▼ Yes
Did previous track have 20+ sec listen time?
       │
       ├─ Yes ──▶ Save as pending scrobble
       │
       ▼
Start 20-second timer for new track
       │
       ▼
Timer fires after 20 seconds
       │
       ▼
Save as pending scrobble + emit event to React Native
```

---

## 4. Local Storage of Pending Scrobbles

**File:** `apps/mobile/android/app/src/main/java/com/goodsongs/scrobble/ScrobbleStorage.kt`

Pending scrobbles are stored in `SharedPreferences` as JSON arrays until synced:

```kotlin
data class PendingScrobble(
    val id: String,           // UUID
    val trackName: String,
    val artistName: String,
    val albumName: String?,
    val durationMs: Long?,
    val sourceApp: String,
    val playedAt: Long,
    val syncAttempts: Int = 0,
    val createdAt: Long,
    // Extended metadata
    val albumArtist: String? = null,
    val genre: String? = null,
    val year: Int? = null,
    val releaseDate: String? = null,
    val artworkUri: String? = null,
    val albumArt: String? = null
)
```

| SharedPreferences Key | Purpose |
|-----------------------|---------|
| `pending_scrobbles` | JSON array of pending scrobbles |
| `scrobbling_enabled` | Master toggle |
| `app_settings` | Per-app enable/disable settings |
| `last_scrobble_time` | Timestamp of most recent scrobble |

---

## 5. API Communication

### Submitting Scrobbles

**Endpoint:** `POST /api/v1/scrobbles`

**Request Body:**
```json
{
  "scrobbles": [
    {
      "track_name": "Song Title",
      "artist_name": "Artist Name",
      "album_name": "Album Name",
      "duration_ms": 180000,
      "source_app": "com.spotify.music",
      "played_at": "2024-01-15T10:30:00Z",
      "source_device": "Pixel 8",
      "album_artist": "Various Artists",
      "genre": "Rock",
      "year": 2024,
      "release_date": "2024-03-15",
      "artwork_uri": "https://i.scdn.co/image/abc123",
      "album_art": "data:image/jpeg;base64,/9j/4AAQ..."
    }
  ]
}
```

**Artwork Priority (server-side):**
1. `artwork_uri` - External URL from any music service (Spotify, YouTube Music, Tidal, etc.)
2. `album_art` - Base64-encoded bitmap uploaded to storage
3. `preferred_artwork_url` - User-selected override
4. `track.album.cover_art_url` - Enrichment fallback from MusicBrainz

**Response:**
```json
{
  "data": {
    "accepted": 5,
    "rejected": 0,
    "scrobbles": [
      {
        "id": "uuid",
        "track_name": "Song Title",
        "artist_name": "Artist Name",
        "album_name": "Album Name",
        "artwork_url": "https://...",
        "metadata_status": "resolved",
        "played_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### Sync Behavior

**File:** `apps/mobile/src/context/scrobbleStore.ts`

1. Fetches up to 1000 pending scrobbles from native storage
2. Batches them in groups of 50
3. Sends each batch to the API
4. On success: removes synced scrobbles from native storage
5. On failure: keeps in pending queue for retry

**Auto-sync:** Debounced 5 seconds after the last scrobble event.

### Fetching Recent Scrobbles

**Endpoint:** `GET /api/v1/scrobbles?limit=20`

Returns the user's scrobble history from the server.

---

## 6. React Native Bridge

**File:** `apps/mobile/src/utils/scrobbleNative.ts`

### Query Methods

```typescript
scrobbleNative.isPermissionGranted(): Promise<boolean>
scrobbleNative.isScrobblingEnabled(): Promise<boolean>
scrobbleNative.getAppSettings(): Promise<AppScrobbleSetting[]>
scrobbleNative.getPendingCount(): Promise<number>
scrobbleNative.getLastScrobbleTime(): Promise<number>
scrobbleNative.getCurrentTrack(): Promise<NowPlayingTrack | null>
scrobbleNative.getRecentPendingScrobbles(limit): Promise<PendingScrobbleLocal[]>
```

### Control Methods

```typescript
scrobbleNative.setScrobblingEnabled(enabled: boolean): Promise<boolean>
scrobbleNative.setAppEnabled(packageName: string, enabled: boolean): Promise<boolean>
scrobbleNative.openPermissionSettings(): Promise<boolean>
scrobbleNative.removeSyncedScrobbles(ids: string[]): Promise<boolean>
```

### Event Listeners

```typescript
// Fired when a scrobble is created
scrobbleNative.onScrobble(callback: (event) => void)
// Emits: { pendingCount: number; lastScrobbleTime: number }

// Fired when current track changes
scrobbleNative.onNowPlaying(callback: (event) => void)
// Emits: { trackName, artistName, albumName, sourceApp } or empty object
```

---

## 7. State Management (Zustand)

**File:** `apps/mobile/src/context/scrobbleStore.ts`

### State

```typescript
interface ScrobbleStoreState {
  status: ScrobbleStatus;              // notSetUp, permissionNeeded, active, paused
  appSettings: AppScrobbleSetting[];
  pendingCount: number;
  lastScrobbleTime: number | null;
  syncing: boolean;
  nowPlaying: NowPlayingTrack | null;
  recentScrobbles: ScrobbleApiResponse[];
  localScrobbles: PendingScrobbleLocal[];
}
```

### Key Actions

| Method | Purpose |
|--------|---------|
| `refreshStatus()` | Query permission and settings from native |
| `toggleScrobbling()` | Enable/disable scrobbling globally |
| `toggleApp()` | Enable/disable a specific music app |
| `syncNow()` | Manually trigger sync to API |
| `fetchRecentScrobbles()` | GET from `/api/v1/scrobbles` |
| `autoSync()` | Debounced sync (5 sec after last event) |

---

## 8. Updating the Recently Played UI

**File:** `apps/mobile/src/screens/FeedScreen.tsx`

### Display Components

1. **Now Playing Track** - Shows at top when music is actively playing
2. **Recently Played List** - Horizontal scrollable list of up to 12 tracks

### Data Flow

```
GET /recently-played?limit=12
       │
       ▼
Filter by source ('lastfm' or 'scrobble')
       │
       ▼
Combine with nowPlaying track
       │
       ▼
Remove duplicates
       │
       ▼
Display with artwork & metadata
```

### Metadata Polling

When tracks have `metadata_status === 'pending'`, the UI polls every 3 seconds until artwork/metadata is resolved:

```typescript
useEffect(() => {
  const hasPendingTracks = recentlyPlayed.some(
    track => track.metadata_status === 'pending'
  );

  if (!hasPendingTracks) return;

  const pollInterval = setInterval(() => {
    fetchRecentlyPlayed(true); // silent refresh
  }, 3000);

  return () => clearInterval(pollInterval);
}, [recentlyPlayed]);
```

---

## 9. Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 NATIVE ANDROID LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Music App Notification                                     │
│         │                                                   │
│         ▼                                                   │
│  ScrobbleListenerService.onNotificationPosted()            │
│         │                                                   │
│         ▼                                                   │
│  MetadataExtractor.extract(notification)                   │
│    → Extracts: track, artist, album, source app            │
│         │                                                   │
│         ▼                                                   │
│  PlaybackTracker.onTrackUpdate()                           │
│    → Scrobble previous track if 20+ seconds                │
│    → Start timer for new track                             │
│         │                                                   │
│         ▼                                                   │
│  Save to ScrobbleStorage (SharedPreferences)               │
│  Emit onScrobble event to React Native                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               REACT NATIVE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AppNavigator listens for events:                           │
│    • onScrobble → update pending count, trigger autoSync   │
│    • onNowPlaying → update now playing state               │
│                                                             │
│  Zustand store (scrobbleStore.ts):                          │
│    • Manages sync state and scrobble lists                 │
│    • Auto-syncs after 5 second debounce                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /api/v1/scrobbles                                    │
│    → Batch pending scrobbles (50 at a time)                │
│    → Returns accepted/rejected counts + scrobble objects   │
│                                                             │
│  GET /recently-played                                      │
│    → Returns recent tracks with artwork & metadata         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    UI LAYER                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FeedScreen:                                                │
│    • Now Playing card (live updates)                       │
│    • Recently Played list (12 tracks)                      │
│    • Polls every 3s for pending metadata                   │
│                                                             │
│  ScrobbleSettingsScreen:                                    │
│    • Last scrobble timestamp                               │
│    • Scrobble history                                      │
│    • Per-app toggles                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Key Configuration Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `SCROBBLE_THRESHOLD_MS` | 20,000 | Minimum listen duration to trigger scrobble |
| Auto-sync debounce | 5,000 | Wait time after last scrobble before syncing |
| Metadata poll interval | 3,000 | Polling interval for pending metadata |
| Batch size | 50 | Max scrobbles per API request |
| Max pending fetch | 1,000 | Max scrobbles fetched for sync |

---

## 11. Error Handling

| Scenario | Behavior |
|----------|----------|
| Sync failure | Scrobbles stay in pending queue for retry |
| Permission revoked | Status changes to `permissionNeeded`, UI shows warning |
| Network error | Scrobbles remain pending, auto-sync retries on next event |
| Metadata pending | UI polls every 3 seconds until resolved |
