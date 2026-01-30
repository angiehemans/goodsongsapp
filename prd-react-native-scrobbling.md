# Product Requirements Document: Android Scrobbling Service

**Project:** GoodSongs Mobile — Listening Detection  
**Owner:** Angie  
**Last Updated:** January 2026  
**Status:** Draft

---

## Overview

This document defines the requirements for the Android listening detection feature in the GoodSongs mobile app. The feature uses Android's NotificationListenerService to detect music playing from any app on the user's device and automatically logs it to their GoodSongs listening history.

### Goals

- Automatically detect and record music playback from popular streaming apps
- Provide a seamless setup experience with clear permission explanations
- Minimize battery impact while maintaining reliable detection
- Queue scrobbles locally when offline and sync when connectivity returns
- Give users full control over what gets tracked

### Non-Goals (for this phase)

- iOS implementation (blocked by platform restrictions)
- Audio fingerprinting or ambient listening (Shazam-style)
- Real-time "now playing" broadcasting to other users
- Integration with smart speakers or desktop apps

---

## User Stories

**As a new user**, I want a clear explanation of why the app needs notification access so I can make an informed decision about granting permission.

**As a user**, I want my listening to be tracked automatically without having to manually log songs.

**As a user**, I want to control which apps get scrobbled so I can exclude podcasts or audiobooks if I want.

**As a user who listens offline**, I want my plays to be saved and uploaded later when I have connectivity.

**As a privacy-conscious user**, I want to be able to pause tracking temporarily without revoking permissions entirely.

**As a user**, I want to see that scrobbling is working so I have confidence the feature is active.

---

## User Flow

### First-Time Setup

```
[User enables scrobbling in settings]
           ↓
[Permission explanation screen]
"GoodSongs needs notification access to see what music is playing.
We only read media notifications — never messages, emails, or other content."
           ↓
[User taps "Enable Notification Access"]
           ↓
[Android system settings opens to notification access page]
           ↓
[User finds GoodSongs and toggles it on]
           ↓
[Android shows system warning dialog about notification access]
           ↓
[User confirms by tapping "Allow"]
           ↓
[User returns to app — success state shown]
           ↓
[Optional: App source selection screen]
"Choose which apps to track"
[Spotify ✓] [YouTube Music ✓] [Tidal ✓] [Local Player ✓]
           ↓
[Setup complete — scrobbling active]
```

### Ongoing Usage

```
[User plays music in Spotify]
           ↓
[GoodSongs service detects media notification]
           ↓
[Service extracts: track, artist, album, duration, source app]
           ↓
[Track plays for >50% or >4 minutes]
           ↓
[Scrobble queued locally]
           ↓
[If online: POST to /api/v1/scrobbles]
[If offline: Store in local queue]
           ↓
[User opens GoodSongs app]
           ↓
[Recently played feed shows new scrobble]
```

---

## Screens

### 1. Scrobbling Settings Screen

**Location:** Settings → Listening History → Scrobbling

**States:**

**A) Not Set Up**
```
┌─────────────────────────────────────┐
│ ← Scrobbling                        │
├─────────────────────────────────────┤
│                                     │
│  🎵                                 │
│                                     │
│  Track Your Listening               │
│                                     │
│  GoodSongs can automatically save   │
│  what you're playing to your        │
│  listening history.                 │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Set Up Scrobbling      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Learn how it works →               │
│                                     │
└─────────────────────────────────────┘
```

**B) Permission Not Granted (returned from system settings without enabling)**
```
┌─────────────────────────────────────┐
│ ← Scrobbling                        │
├─────────────────────────────────────┤
│                                     │
│  ⚠️ Permission Required             │
│                                     │
│  GoodSongs needs notification       │
│  access to detect music playback.   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    Open System Settings     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Why is this needed? →              │
│                                     │
└─────────────────────────────────────┘
```

**C) Active**
```
┌─────────────────────────────────────┐
│ ← Scrobbling                        │
├─────────────────────────────────────┤
│                                     │
│  Scrobbling                    [ON] │
│  ─────────────────────────────────  │
│                                     │
│  STATUS                             │
│  ● Active — Listening for music     │
│  Last scrobble: 2 minutes ago       │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  TRACKED APPS                       │
│  Tap to enable or disable           │
│                                     │
│  Spotify                       [✓]  │
│  YouTube Music                 [✓]  │
│  Tidal                         [✓]  │
│  Amazon Music                  [✓]  │
│  Local media player            [ ]  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  SYNC                               │
│  3 scrobbles pending upload         │
│  [Sync Now]                         │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Manage notification access →       │
│                                     │
└─────────────────────────────────────┘
```

**D) Paused**
```
┌─────────────────────────────────────┐
│ ← Scrobbling                        │
├─────────────────────────────────────┤
│                                     │
│  Scrobbling                   [OFF] │
│  ─────────────────────────────────  │
│                                     │
│  STATUS                             │
│  ○ Paused — Not tracking            │
│                                     │
│  ... rest of settings grayed out    │
│                                     │
└─────────────────────────────────────┘
```

---

### 2. Permission Explanation Screen

**Shown when:** User taps "Set Up Scrobbling" for the first time

```
┌─────────────────────────────────────┐
│                               Skip  │
├─────────────────────────────────────┤
│                                     │
│  How Scrobbling Works               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     [Illustration of        │   │
│  │      phone with music       │   │
│  │      notification]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  When you play music, apps show     │
│  what's playing in your             │
│  notifications. GoodSongs reads     │
│  this to save your listening        │
│  history automatically.             │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ✓ We only read media playback      │
│  ✓ Never messages or personal data  │
│  ✓ You control which apps to track  │
│  ✓ Pause anytime in settings        │
│                                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Continue to Permissions   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

### 3. System Permission Flow

**Note:** This happens in Android system settings, not in our app. We deep-link the user there.

**Step 1:** App calls `startActivity()` with `ACTION_NOTIFICATION_LISTENER_SETTINGS`

**Step 2:** User sees list of apps requesting notification access, finds "GoodSongs"

**Step 3:** User toggles GoodSongs on

**Step 4:** Android shows scary system dialog:
> "Allow GoodSongs to access all notifications? GoodSongs will be able to read all notifications, including personal information such as contact names and the text of messages you receive."

**Step 5:** User taps "Allow"

**Step 6:** User navigates back to GoodSongs app

**Handling return:** When the app resumes, check `NotificationManagerCompat.getEnabledListenerPackages()` to verify permission was granted. Show appropriate success or retry state.

---

### 4. "How It Works" Explainer (Optional Deep Dive)

Accessible via "Learn how it works" link. Can be a bottom sheet or separate screen.

```
┌─────────────────────────────────────┐
│ How Scrobbling Works           [X]  │
├─────────────────────────────────────┤
│                                     │
│  WHAT WE DETECT                     │
│  When music apps play a song, they  │
│  show a notification with the       │
│  track info. GoodSongs reads this   │
│  notification to see:               │
│  • Song title                       │
│  • Artist name                      │
│  • Album name                       │
│  • Which app is playing             │
│                                     │
│  WHAT WE SAVE                       │
│  A song is saved to your history    │
│  after you've listened to at least  │
│  half of it (or 4 minutes,          │
│  whichever comes first).            │
│                                     │
│  WHAT WE DON'T ACCESS               │
│  • Text messages                    │
│  • Emails                           │
│  • Social media notifications       │
│  • Any other app notifications      │
│                                     │
│  We specifically filter for media   │
│  playback notifications only.       │
│                                     │
│  YOUR CONTROL                       │
│  • Choose which apps to track       │
│  • Pause scrobbling anytime         │
│  • Delete any scrobble from history │
│  • Revoke access in system settings │
│                                     │
└─────────────────────────────────────┘
```

---

## Technical Implementation

### NotificationListenerService

Create a service that extends `NotificationListenerService`:

```kotlin
class ScrobbleListenerService : NotificationListenerService() {
    
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        // Filter for media notifications only
        // Extract track metadata
        // Track playback state
    }
    
    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Handle playback stop
    }
}
```

**Manifest registration:**

```xml
<service
    android:name=".service.ScrobbleListenerService"
    android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    android:exported="false">
    <intent-filter>
        <action android:name="android.service.notification.NotificationListenerService" />
    </intent-filter>
</service>
```

### Detecting Media Notifications

Media apps use `Notification.MediaStyle` and include a `MediaSession.Token`. Use this to identify media notifications:

```kotlin
fun isMediaNotification(sbn: StatusBarNotification): Boolean {
    val notification = sbn.notification
    // Check for MediaStyle
    val extras = notification.extras
    return extras.containsKey(Notification.EXTRA_MEDIA_SESSION)
}
```

### Extracting Metadata

```kotlin
fun extractMetadata(sbn: StatusBarNotification): TrackInfo? {
    val extras = sbn.notification.extras
    
    return TrackInfo(
        trackName = extras.getString(Notification.EXTRA_TITLE),
        artistName = extras.getString(Notification.EXTRA_TEXT),
        albumName = extras.getString(Notification.EXTRA_SUB_TEXT),
        sourceApp = sbn.packageName,
        timestamp = System.currentTimeMillis()
    )
}
```

**Note:** Different apps structure their notifications differently. You'll need to handle variations:

| App | Title | Text | SubText |
|-----|-------|------|---------|
| Spotify | Track name | Artist | Album |
| YouTube Music | Track name | Artist — Album | — |
| Tidal | Track name | Artist | Album |

Build a mapping layer to normalize these.

### Determining When to Scrobble

**Scrobble rule:** Track must be played for at least 50% of its duration OR at least 4 minutes, whichever comes first.

**Challenge:** Media notifications don't always include duration. Strategies:

1. Use `MediaController` to get playback position and duration if available
2. Track time between notification posted and removed/changed
3. For unknown durations, default to 4-minute rule

```kotlin
class PlaybackTracker {
    private var currentTrack: TrackInfo? = null
    private var playbackStartTime: Long = 0
    
    fun onTrackStarted(track: TrackInfo) {
        // If previous track played long enough, scrobble it
        currentTrack?.let { 
            if (shouldScrobble(it, playbackStartTime)) {
                queueScrobble(it)
            }
        }
        currentTrack = track
        playbackStartTime = System.currentTimeMillis()
    }
    
    fun shouldScrobble(track: TrackInfo, startTime: Long): Boolean {
        val playedMs = System.currentTimeMillis() - startTime
        val minPlaytime = minOf(track.durationMs / 2, 4 * 60 * 1000)
        return playedMs >= minPlaytime
    }
}
```

### App Filtering

Store user preferences in SharedPreferences or Room:

```kotlin
data class AppScrobbleSettings(
    val packageName: String,
    val displayName: String,
    val enabled: Boolean
)

// Default enabled apps
val DEFAULT_ENABLED_APPS = listOf(
    "com.spotify.music",
    "com.google.android.apps.youtube.music",
    "com.aspiro.tidal",
    "com.amazon.mp3",
    "com.apple.android.music"
)
```

### Local Queue & Sync

Use Room database to store pending scrobbles:

```kotlin
@Entity(tableName = "pending_scrobbles")
data class PendingScrobble(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val trackName: String,
    val artistName: String,
    val albumName: String?,
    val durationMs: Long?,
    val playedAt: Long,
    val sourceApp: String,
    val createdAt: Long = System.currentTimeMillis(),
    val syncAttempts: Int = 0,
    val lastSyncAttempt: Long? = null
)
```

**Sync strategy:**

1. When scrobble is ready, insert into pending_scrobbles
2. If online, attempt immediate sync
3. If offline or sync fails, leave in queue
4. Use WorkManager for reliable background sync
5. Batch syncs: send up to 50 scrobbles per request
6. On success, delete from pending_scrobbles
7. On failure, increment syncAttempts, back off exponentially
8. After 10 failed attempts over 7 days, mark as permanently failed

```kotlin
class ScrobbleSyncWorker(context: Context, params: WorkerParameters) 
    : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        val pending = scrobbleDao.getPendingScrobbles(limit = 50)
        if (pending.isEmpty()) return Result.success()
        
        return try {
            api.submitScrobbles(pending.toApiModel())
            scrobbleDao.deleteSynced(pending.map { it.id })
            Result.success()
        } catch (e: Exception) {
            scrobbleDao.incrementSyncAttempts(pending.map { it.id })
            Result.retry()
        }
    }
}
```

### Battery Optimization

The NotificationListenerService runs persistently, but reading notifications is very low-cost. To minimize battery impact:

- Don't do heavy processing in onNotificationPosted — queue work
- Batch network requests (don't POST every single scrobble immediately)
- Use WorkManager constraints for sync (require network, optionally unmetered)
- Avoid wake locks

### Permission Checking

```kotlin
fun isNotificationAccessGranted(context: Context): Boolean {
    val enabledPackages = NotificationManagerCompat
        .getEnabledListenerPackages(context)
    return enabledPackages.contains(context.packageName)
}

fun openNotificationAccessSettings(context: Context) {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
    context.startActivity(intent)
}
```

---

## React Native Bridge

Since NotificationListenerService requires native Android code, you'll need a bridge.

### Native Module

```kotlin
// ScrobbleModule.kt
class ScrobbleModule(reactContext: ReactApplicationContext) 
    : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName() = "ScrobbleModule"
    
    @ReactMethod
    fun isPermissionGranted(promise: Promise) {
        val granted = isNotificationAccessGranted(reactApplicationContext)
        promise.resolve(granted)
    }
    
    @ReactMethod
    fun openPermissionSettings() {
        openNotificationAccessSettings(currentActivity!!)
    }
    
    @ReactMethod
    fun setScrobblingEnabled(enabled: Boolean, promise: Promise) {
        // Toggle the service
        promise.resolve(true)
    }
    
    @ReactMethod
    fun getAppSettings(promise: Promise) {
        // Return list of apps and their enabled states
    }
    
    @ReactMethod
    fun setAppEnabled(packageName: String, enabled: Boolean, promise: Promise) {
        // Update app-specific setting
    }
    
    @ReactMethod
    fun getPendingCount(promise: Promise) {
        // Return count of pending scrobbles
    }
    
    @ReactMethod
    fun syncNow(promise: Promise) {
        // Trigger immediate sync
    }
}
```

### React Native Usage

```typescript
import { NativeModules } from 'react-native';

const { ScrobbleModule } = NativeModules;

// Check permission
const granted = await ScrobbleModule.isPermissionGranted();

// Open settings
ScrobbleModule.openPermissionSettings();

// Toggle scrobbling
await ScrobbleModule.setScrobblingEnabled(true);

// Get tracked apps
const apps = await ScrobbleModule.getAppSettings();

// Enable/disable specific app
await ScrobbleModule.setAppEnabled('com.spotify.music', false);
```

---

## Edge Cases

### Multiple Music Apps

User plays Spotify, then switches to YouTube Music without pausing Spotify.

**Behavior:** Treat notification change as track change. If Spotify track played long enough, scrobble it. Start tracking YouTube Music track.

### Podcast/Audiobook Detection

Some podcast apps use MediaStyle notifications too.

**Handling options:**
1. Maintain a blocklist of known podcast app package names
2. Filter by notification category if available
3. Let users manually exclude apps
4. Future: Use duration heuristics (tracks > 20min likely podcasts)

### Repeated Tracks

User plays the same song on repeat.

**Behavior:** Each complete play (meeting the 50%/4min rule) is a separate scrobble. Use timestamp to differentiate.

### Notification Updates Without Track Change

Some apps update notifications frequently (progress, button state changes) without changing the track.

**Behavior:** Compare track+artist with previous. Only treat as new track if these change.

### System Reboot

NotificationListenerService needs to be re-enabled after reboot.

**Behavior:** Service should restart automatically if permission is granted. Use a BOOT_COMPLETED receiver as backup to verify service is running.

### App Killed by System

Android may kill the service to reclaim memory.

**Behavior:** Service should restart automatically. Implement sticky service behavior. Accept that some plays may be missed if aggressively killed.

---

## Analytics Events

Track these events for product insights:

| Event | Properties | Purpose |
|-------|------------|---------|
| scrobble_setup_started | | Funnel tracking |
| scrobble_permission_screen_viewed | | Funnel tracking |
| scrobble_permission_settings_opened | | Funnel tracking |
| scrobble_permission_granted | | Funnel tracking |
| scrobble_permission_denied | | Identify friction |
| scrobble_enabled | | Feature activation |
| scrobble_disabled | | Feature deactivation |
| scrobble_app_toggled | app_package, enabled | App preferences |
| scrobble_recorded | source_app | Usage patterns |
| scrobble_synced | count | Sync health |
| scrobble_sync_failed | error_type, pending_count | Reliability |

---

## Testing

### Manual Test Cases

1. **Fresh install flow:** Complete setup from scratch, verify first scrobble works
2. **Permission denied:** Verify app handles return without permission gracefully
3. **Offline scrobbling:** Enable airplane mode, play music, disable, verify sync
4. **App switching:** Switch between music apps, verify both scrobble correctly
5. **Skip track:** Skip songs before 50%, verify they don't scrobble
6. **Pause/resume:** Pause for extended time, resume, verify scrobble logic
7. **Service restart:** Force stop app, play music, verify service recovers
8. **Background operation:** Leave app in background for hours, verify scrobbles accumulate
9. **Disable/re-enable:** Toggle scrobbling off and on, verify state persistence

### Devices to Test

- Pixel (stock Android)
- Samsung Galaxy (One UI)
- OnePlus (OxygenOS)  
- Xiaomi (MIUI) — known to be aggressive with background services

### Music Apps to Test

- Spotify
- YouTube Music
- Tidal
- Amazon Music
- Local media players (Samsung Music, Google Play Music replacement)

---

## Privacy Considerations

- Only read notifications categorized as media playback
- Never store or transmit notification content from non-media apps
- Clear explanation of what data is collected before requesting permission
- Easy way to pause tracking without revoking system permission
- Delete all local scrobble data when user logs out
- Respect any platform-level "private listening" modes (e.g., Spotify's private session shows different notification)

---

## Open Questions

1. Should we show a persistent notification while scrobbling is active? (Pros: transparency, keeps service alive. Cons: notification fatigue)
2. How do we handle "private session" modes in apps that support them?
3. Should we detect and handle CarPlay/Android Auto scenarios differently?
4. Do we want to support scrobbling from smart speakers via companion apps?

---

## Milestones

**Phase 1: Core Service (Target: 2 weeks)**
- NotificationListenerService implementation
- Basic metadata extraction for Spotify
- Local queue with Room
- React Native bridge (permission check, settings open)

**Phase 2: UI & Settings (Target: 1.5 weeks)**
- Setup flow screens
- Settings screen with app toggles
- Permission state handling

**Phase 3: Multi-App Support (Target: 1 week)**
- Metadata normalization for YouTube Music, Tidal, etc.
- App filtering preferences
- Sync with WorkManager

**Phase 4: Polish (Target: 1 week)**
- Battery optimization audit
- Edge case handling
- Device-specific testing (Samsung, Xiaomi)
- Analytics integration

---

## Design Tokens Reference

Use these from `@goodsongs/tokens`:

```typescript
import { colors, typography, spacing } from '@goodsongs/tokens';

// Primary actions
colors.primary.blue      // #0124B0

// Status indicators  
colors.green.500         // Active/success
colors.yellow.500        // Warning/pending
colors.neutral.gray400   // Disabled

// Typography
typography.fonts.heading // Aesthet Nova
typography.fonts.body    // Inter
```
