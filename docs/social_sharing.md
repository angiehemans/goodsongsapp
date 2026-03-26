# PRD: Social Sharing Phase 2 — Frontend

**GoodSongs / Next.js**
**Status:** Draft
**Version:** 1.0

---

## Overview

Phase 2 builds on the share buttons from Phase 1 and adds OAuth account connections, connected account management, and auto-post preference controls. Users who connect Threads or Instagram unlock auto-posting and a more seamless one-tap share experience.

---

## Prerequisites

Phase 1 frontend must be complete. The `ShareButtonGroup`, `CreationShareOptions`, and platform utilities built in Phase 1 are extended here — not replaced.

---

## Goals

- Allow users to connect Threads and Instagram from account settings
- Surface auto-post preference toggles post-connection and in settings
- Upgrade Phase 1 share buttons for connected users (show auto-post confirmation, offer one-off share)
- Handle Instagram personal account limitations clearly and without friction
- Surface re-auth prompts when a connected account needs reconnecting

---

## Out of Scope

- Generated share card images
- Twitter/X integration
- Bulk-sharing past content after connecting

---

## User Flows

### Flow 1 — Connecting a Threads Account

1. Settings → Connected Accounts → "Connect Threads"
2. Redirect to Threads authorization
3. On callback: success state shows connected username
4. Immediately show auto-post preference toggles (all off by default)
5. User saves preferences; returns to Connected Accounts

### Flow 2 — Connecting an Instagram Account (Business/Creator)

1. Same entry point
2. On callback: backend returns `account_type`
3. If `BUSINESS` or `CREATOR`: show auto-post toggles for band posts and events
4. User saves; returns to Connected Accounts

### Flow 3 — Connecting Instagram (Personal Account)

1. Same entry point
2. On callback: `account_type` is `PERSONAL`
3. Show personal account message — no auto-post toggles
4. Phase 1 share buttons continue to work as before

### Flow 4 — Re-auth Required

1. Backend sets `needs_reauth: true`
2. In-app notification appears
3. Clicking navigates to Connected Accounts; affected row shows "Reconnect" CTA
4. Reconnect re-initiates OAuth; on success preferences are preserved

---

## Settings UI — Connected Accounts

### Not connected state

```
Connected Accounts

Threads
  Not connected               [ Connect ]

Instagram
  Not connected               [ Connect ]
  (Bands only — shown only for band accounts)
```

### Threads connected state

```
Threads
  Connected as @yourhandle    [ Disconnect ]

  Auto-post when I create:
  [ ] Recommendations          (fans, bloggers)
  [ ] Band posts               (bands)
  [ ] Events                   (bands)

                               [ Save preferences ]
```

### Instagram — Business/Creator

```
Instagram
  Connected as @yourbandname (Business)    [ Disconnect ]

  Auto-post when I create:
  [ ] Band posts
  [ ] Events

                               [ Save preferences ]
```

### Instagram — Personal Account

```
Instagram
  Connected as @yourhandle

  Instagram only supports direct posting for business and creator accounts.
  Your current account type is personal — share buttons on your posts will
  still open Instagram for you to post manually.

  To enable auto-posting, switch to a Creator account in Instagram settings.
  How to switch to a Creator account →

                               [ Disconnect ]
```

No auto-post toggles. No error styling — this is informational.

### Re-auth state

```
Threads
  ⚠ Reconnection needed — auto-posting has been paused
  [ Reconnect ]    [ Disconnect ]
```

---

## Auto-Post Preference Toggles

- Preferences are not saved on toggle — a "Save preferences" button commits to the backend
- Optimistic UI is acceptable; show spinner on save, revert on error
- Toggles are disabled while save is in flight

**Threads visible toggles by user type:**

| User type | Toggles shown      |
| --------- | ------------------ |
| Fan       | Recommendations    |
| Blogger   | Recommendations    |
| Band      | Band posts, Events |

**Instagram visible toggles:**

| Condition               | Toggles shown               |
| ----------------------- | --------------------------- |
| Band + Business/Creator | Band posts, Events          |
| Personal account        | None                        |
| Fan/Blogger             | Instagram section not shown |

---

## Share Button Upgrades (Phase 1 Extension)

Phase 1 share buttons always open Intent URLs or the Web Share API. In Phase 2, the behavior of `ThreadsShareButton` and `InstagramShareButton` changes when the user has a connected account.

### `ThreadsShareButton` — Connected User

```
If auto_post is enabled for this content type:
  → Show "Posted to Threads" (post already happened automatically)
  → Offer "Share again" as secondary action (opens Intent URL)

If connected but auto_post is off for this content type:
  → Show "Share to Threads" (same Intent URL as Phase 1, but label changes to
    "Post to Threads" to reflect the authenticated context)
```

### `InstagramShareButton` — Connected Business/Creator

Auto-posting for Instagram doesn't change the share button behavior in Phase 2 — Instagram auto-posts for bands are triggered server-side. The button continues to use the Phase 1 Web Share API / clipboard path. A future phase could offer in-app direct posting for connected business accounts, but that's not in scope here.

---

## Post-Creation Flow

### Auto-post was triggered (Threads)

```
Your recommendation is live — shared to Threads automatically.

[ View on Threads ]   [ Copy link ]
```

"View on Threads" uses the post URL returned from the auto-post job if available. If the job hasn't completed yet (still in the queue), show the standard Phase 1 success state instead — do not poll or wait.

### Creation checkbox upgrade

`CreationShareOptions` from Phase 1 is unchanged for unconnected users. For connected users with auto-post enabled, the relevant checkbox is replaced with a status line:

```
Auto-posting to Threads is on                 (settings →)
```

For connected users with auto-post off, the checkbox remains and functions identically to Phase 1.

---

## State Management

Extend the Zustand store to include connected accounts:

```typescript
interface ConnectedAccountsState {
  accounts: ConnectedAccount[];
  isLoading: boolean;
  fetchAccounts: () => Promise<void>;
  updatePreferences: (
    platform: Platform,
    prefs: AutoPostPrefs,
  ) => Promise<void>;
  disconnect: (platform: Platform) => Promise<void>;
}

interface ConnectedAccount {
  platform: "threads" | "instagram";
  platformUsername: string;
  accountType: "BUSINESS" | "CREATOR" | "PERSONAL" | null;
  autoPostRecommendations: boolean;
  autoPostBandPosts: boolean;
  autoPostEvents: boolean;
  needsReauth: boolean;
}
```

Fetch accounts on app init for authenticated users. `ShareButtonGroup` and `CreationShareOptions` read from this store to determine connected state without additional API calls.

---

## Notifications

When `needs_reauth` is true on any connected account:

- Include in unread notification count
- Notification item: "[Platform] disconnected — tap to reconnect"
- Tapping navigates to Connected Accounts settings
- After successful reconnect, notification clears automatically

No email notification in Phase 2.

---

## Component Architecture

New in Phase 2:

```
/components/social/
  ConnectedAccountsSection    — settings page section
  ConnectPlatformButton       — initiates OAuth redirect
  ConnectedAccountRow         — shows account + prefs + disconnect
  AutoPostPreferences         — toggle group per platform
  PersonalAccountMessage      — Instagram personal account info state
  ReauthBanner                — inline warning on ConnectedAccountRow
```

Extended from Phase 1:

```
  ThreadsShareButton          — adds connected-user auto-post confirmation state
  CreationShareOptions        — adds auto-post status line for connected users
```

---

## API Integration

| Action                   | Endpoint                                      |
| ------------------------ | --------------------------------------------- |
| Fetch connected accounts | `GET /api/v1/connected_accounts`              |
| Update preferences       | `PATCH /api/v1/connected_accounts/:platform`  |
| Disconnect               | `DELETE /api/v1/connected_accounts/:platform` |
| Initiate Threads OAuth   | Redirect to `/auth/threads/authorize`         |
| Initiate Instagram OAuth | Redirect to `/auth/instagram/authorize`       |

---

## Tasks

**Connected Accounts settings**

- [ ] `ConnectedAccountsSection` with platform rows
- [ ] `ConnectPlatformButton` with OAuth redirect
- [ ] OAuth callback page — receives account data, updates Zustand, shows post-connection preferences
- [ ] `ConnectedAccountRow` — connected state, disconnect action
- [ ] `AutoPostPreferences` toggles + save button
- [ ] `PersonalAccountMessage` for Instagram personal accounts
- [ ] `ReauthBanner` on affected account row

**Share button upgrades**

- [ ] `ThreadsShareButton` — add auto-post confirmation state and "Share again" secondary action
- [ ] `CreationShareOptions` — add auto-post status line for connected users with auto-post enabled

**State**

- [ ] `ConnectedAccountsState` in Zustand
- [ ] Fetch on app init for authenticated users
- [ ] Invalidate after OAuth callback, disconnect, preference save

**Notifications**

- [ ] Re-auth notification item
- [ ] Include in unread count
- [ ] Clear after successful reconnect
