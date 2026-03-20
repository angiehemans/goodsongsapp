# PRD: Social Sharing Phase 1 — Frontend

**GoodSongs / Next.js**
**Status:** Draft
**Version:** 1.0

---

## Overview

Phase 1 adds share buttons to all shareable content and an optional checkbox during content creation. No accounts to connect, no OAuth, no auto-posting. The user clicks a button and lands in the platform's native compose window pre-filled with a caption and link.

---

## Goals

- Place share buttons on recommendations, band posts, and events (both the creation success state and the detail page)
- Add an optional "Share to Threads after posting" checkbox to the creation flow for each content type
- Handle Threads via Intent URL (all devices), Instagram via Web Share API on mobile and clipboard fallback on desktop
- Keep the UI surface minimal — share actions should feel lightweight, never disruptive

---

## Out of Scope

OAuth connection, connected accounts, auto-posting, token management — all Phase 2.

---

## Share Mechanics

### Threads

All devices use the Intent URL. The frontend opens it in a new tab. The user lands in Threads with the caption pre-populated and posts manually.

```
https://www.threads.net/intent/post?text={encodeURIComponent(text)}
```

### Instagram

Instagram has no Intent URL equivalent for web. Two paths depending on context:

**Mobile (Web Share API available):**
`navigator.share({ text, url })` opens the OS share sheet where the user can pick Instagram. In v1 this shares text + URL only — no image. The user can add the image manually in Instagram.

**Desktop (or Web Share API unavailable):**
Copy the caption to clipboard and show a confirmation with a link to open Instagram.com. Be direct with the user: Instagram doesn't allow pre-filled posts from external sites on desktop.

---

## Creation Flow — Checkbox

Each content creation form (recommendation, band post, event) gets a share section at the bottom, just above the submit button.

```
─────────────────────────────────
Share after posting

[ ] Open Threads to share           (opens Intent URL in new tab on submit success)
[ ] Share to Instagram              (triggers Web Share API or copy on submit success)

        [ Post recommendation ]
─────────────────────────────────
```

**Behavior:**

- Checkboxes are unchecked by default
- On successful form submission, any checked platforms are actioned immediately before the success state renders
- If Web Share API is unavailable and the user checked Instagram, fall through to clipboard copy + show the desktop confirmation state
- Checking a platform does not block or delay the post save — shares happen after the record is confirmed created

**On mobile** the checkboxes are labeled "Share to Threads" and "Share to Instagram" with no secondary description needed — the action is self-evident.

**On desktop** the Instagram checkbox label appends "(caption will be copied)" so the user understands what to expect before they check it.

---

## Share Buttons on Content Pages

Share buttons appear in two places:

1. The post-creation success state (immediately after creating content)
2. The content detail page (persistent)

### Layout

```
[ Share on Threads ]   [ Share on Instagram ]   [ Copy link ]
```

Buttons are text buttons with platform icons, not prominent CTAs. They sit below the content, visually secondary to the content itself.

### Post-Creation Success State

After a recommendation, band post, or event is saved, show the share buttons inline as part of the success message — not a modal.

```
Your recommendation is live.

[ Share on Threads ]   [ Share on Instagram ]   [ Copy link ]
```

This dismisses naturally when the user navigates away. No forced interaction.

---

## Component Architecture

```
/components/social/
  ShareButtonGroup       — renders Threads + Instagram + Copy buttons for a piece of content
  ThreadsShareButton     — fetches payload, opens Intent URL
  InstagramShareButton   — platform-aware: Web Share API or clipboard fallback
  CopyLinkButton         — copies canonical URL, shows transient "Copied" confirmation
  CreationShareOptions   — checkbox group for use inside creation forms
```

### `ShareButtonGroup`

```typescript
interface ShareButtonGroupProps {
  postableType: "recommendation" | "band_post" | "event";
  postableId: string;
}
```

Fetches share payload from `GET /api/v1/share_payload` on mount. Renders buttons once payload is available; renders nothing during loading (no skeleton — these are secondary actions).

### `CreationShareOptions`

```typescript
interface CreationShareOptionsProps {
  onShareThreads: () => void; // called by parent on successful submit
  onShareInstagram: () => void;
}
```

The parent creation form holds the checkbox state and calls these callbacks after the record is confirmed saved. The component itself is purely presentational.

---

## Instagram Share Logic

```typescript
// utils/share.ts

export const shareToInstagram = async (text: string, url: string) => {
  const fullText = `${text}\n\n${url}`;

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text: fullText });
      return { method: "web_share" };
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return { method: "cancelled" };
      }
      // Fall through to clipboard on other errors
    }
  }

  await navigator.clipboard.writeText(fullText);
  return { method: "clipboard" };
};
```

The calling component uses the returned `method` to decide which confirmation state to show.

---

## Confirmation States

### After sharing to Threads

```
Opened in Threads
```

Transient — shown for 2 seconds, then resets to the default button label.

### After Instagram — Web Share API

No confirmation needed; the OS share sheet handles feedback.

### After Instagram — Clipboard (desktop)

```
Caption copied
Open Instagram to paste and post →
```

The "Open Instagram" link navigates to `https://www.instagram.com` in a new tab. The message persists until the user dismisses or navigates away (does not auto-dismiss, since they may need time to switch to Instagram).

### After Copy Link

```
Link copied
```

Transient — resets after 2 seconds.

---

## Device Detection

```typescript
// utils/platform.ts

export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad/i.test(navigator.userAgent);
};

export const supportsWebShare = (): boolean => {
  if (typeof window === "undefined") return false;
  return typeof navigator.share === "function";
};
```

Used by `InstagramShareButton` and `CreationShareOptions` to adjust labels and behavior. SSR-safe.

---

## Content Types in Scope

| Content Type   | Share button on detail page | Checkbox in creation form |
| -------------- | --------------------------- | ------------------------- |
| Recommendation | Yes                         | Yes                       |
| Band post      | Yes                         | Yes                       |
| Event          | Yes                         | Yes                       |

---

## Tasks

**Utilities**

- [ ] `utils/platform.ts` — `isMobile`, `supportsWebShare`
- [ ] `utils/share.ts` — `shareToInstagram` (Web Share API + clipboard fallback)

**Components**

- [ ] `ThreadsShareButton` — fetches payload, opens Intent URL in new tab
- [ ] `InstagramShareButton` — platform-aware, clipboard confirmation state on desktop
- [ ] `CopyLinkButton` — copies URL, transient "Copied" state
- [ ] `ShareButtonGroup` — composes the three buttons, fetches share payload
- [ ] `CreationShareOptions` — checkbox group for creation forms

**Integration**

- [ ] Add `ShareButtonGroup` to recommendation detail page
- [ ] Add `ShareButtonGroup` to band post detail page
- [ ] Add `ShareButtonGroup` to event detail page
- [ ] Add post-creation success state with `ShareButtonGroup` for each content type
- [ ] Add `CreationShareOptions` to recommendation creation form
- [ ] Add `CreationShareOptions` to band post creation form
- [ ] Add `CreationShareOptions` to event creation form

**API**

- [ ] Wire `ShareButtonGroup` to `GET /api/v1/share_payload`
