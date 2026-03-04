# PRD: Profile Customization — Frontend (Next.js)

## Overview

This document covers the frontend implementation of GoodSongs' profile customization feature: the site builder UI where paid accounts configure their profile, and the public profile renderer that displays the customized page to visitors. Both live within the existing Next.js application.

## Goals

- Provide an intuitive drag-and-drop site builder that feels lightweight, not overwhelming
- Show a live preview that updates instantly as users make changes
- Render customized public profiles that are fast, accessible, and SEO-friendly
- Support the draft/publish workflow so users can experiment without affecting their live profile
- Gate advanced features (background images, custom text sections) to Pro plans with clear upgrade prompts

---

## Site Builder UI

### Route

`/settings/profile-builder` — accessible from the account settings area. Requires authentication and an eligible paid plan.

### Layout

The builder uses a two-panel layout:

- **Left panel (editor, ~380px fixed width):** Global settings, section list with drag-and-drop reordering, section-specific settings
- **Right panel (preview, fluid):** Live preview of the profile that updates in real time as settings change

On screens narrower than 1024px, the builder switches to a single-panel mode with a toggle between "Edit" and "Preview" tabs. The mobile experience is functional but the builder is primarily designed for desktop use — a banner on mobile should suggest switching to a larger screen for the best experience.

### Editor Panel Structure

The editor panel is organized into collapsible groups:

**1. Top bar**

- "Save Draft" button (always available when changes exist)
- "Publish" button (primary CTA, copies draft to live)
- "Discard Changes" (text link, requires confirmation)
- Unsaved changes indicator (dot or subtle badge)

**2. Global Theme section (always expanded by default)**

- Background color — color picker input
- Brand color — color picker input
- Font color — color picker input
- Header font — dropdown select from approved list
- Body font — dropdown select from approved list

Each color picker should include a text input for direct hex entry alongside the visual picker. Consider including a small "suggested palette" row derived from the brand color (complementary, lighter, darker variants) to help users who aren't designers.

**3. Sections list**

A vertical list of section cards, one per section in the current configuration. Each card shows:

- **Drag handle** (left edge) for reordering
- **Section type label** (e.g., "Music", "Events", "Custom Text")
- **Visibility toggle** (eye icon, right side) — click to show/hide section
- **Expand/collapse chevron** — click to open section settings

When expanded, a section card shows the section-specific settings as form fields (described per section type below). Section-level color overrides show a "Use global" / "Custom" toggle that reveals the color picker only when "Custom" is selected, keeping the default state clean.

**"Add Section" button** appears at the bottom of the list. Clicking it opens a popover or small modal listing available section types. Predefined types that already exist in the list are shown as disabled with an "Already added" label. `custom_text` shows a count ("2 of 3 used") and is disabled when the limit is reached. Section types not available on the account's current plan show a lock icon with "Available on [Plan Name]" — clicking opens the plan upgrade flow.

**Drag-and-drop implementation:** Use `@dnd-kit/sortable` for the section reorder interaction. On drag end, update the sections array order in local state. The preview re-renders immediately to reflect the new order. Drag should be constrained to the vertical axis. A subtle drop indicator (line between cards) shows the target position during drag.

### Section Settings by Type

Each section, when expanded in the editor, shows its specific controls. All sections also show the shared override fields (background color, background image for Pro, font color) at the bottom of their settings panel, collapsed under an "Appearance" sub-section.

**Hero**

- Headline — text input (120 char limit with counter)
- Subtitle — text input (200 char limit)
- CTA button text — text input (40 char limit), optional
- CTA button URL — URL input, shown only when CTA text is filled
- Background image — upload/select (Pro only)

**Music**

- Should accept embeds from Bandcamp, Soundcloud, Spotify, Apple Music.
- Number of releases to show — slider or number input (3–24)
- Preview note: "Shows your most recent releases"

**Events**

- Number of events to show — slider or number input (3–12)
- Show past events — checkbox
- Preview note: "Shows your upcoming events" (or "upcoming and past" if toggled)

**Posts**

- Number of posts to show — slider or number input (3–12)
- View more button that take users to /username/posts page

**About**

- Body — textarea with basic markdown toolbar (bold, italic, link), 5000 char limit
- Character counter

**Recommendations**

- Layout — toggle: Grid / List
- Number to show — slider or number input (3–24)

**Mailing List**

-
- Heading — text input (120 char limit)
- Description — textarea (500 char limit)
- Provider — select: Native / Mailchimp / ConvertKit
- External form URL — URL input, shown when provider is not Native

**Merch**

- Heading — text input (120 char limit)
- Provider — select: Bandcamp / Big Cartel / Custom Link
- External URL — URL input (required)
- Number of items to show — slider or number input (3–12)

**Custom Text**

- Heading — text input (120 char limit)
- Body — textarea with basic markdown toolbar, 10000 char limit

### State Management

The builder should manage state with a single React context or lightweight store (Zustand is a good fit given the existing stack) that holds:

```typescript
interface BuilderState {
  // Global theme fields
  globals: {
    background_color: string;
    brand_color: string;
    font_color: string;
    header_font: string;
    body_font: string;
  };

  // Working copy of sections (the draft)
  sections: Section[];

  // Snapshot of the last saved state for dirty detection
  lastSaved: { globals: GlobalTheme; sections: Section[] } | null;

  // UI state
  expandedSectionIndex: number | null;
  isSaving: boolean;
  isPublishing: boolean;
  hasUnsavedChanges: boolean;
}
```

**Data flow:**

1. On mount, fetch `GET /api/v1/profile_theme`. If `draft_sections` exists, load that into `sections`. Otherwise, load `sections` (the published config) as the working copy.
2. Every edit updates the store immediately — the preview re-renders via the shared state.
3. "Save Draft" sends `PUT /api/v1/profile_theme` with current `globals` and `sections` as `draft_sections`. Updates `lastSaved` snapshot on success.
4. "Publish" sends `POST /api/v1/profile_theme/publish`. On success, clears the draft state and shows a confirmation toast.
5. "Discard Changes" sends `POST /api/v1/profile_theme/discard_draft`, then reloads the published sections as the working copy.

**Unsaved changes detection:** Compare current state against `lastSaved` snapshot using a deep equality check (lodash `isEqual` or similar). Show a browser `beforeunload` warning if the user tries to navigate away with unsaved changes.

### Preview Panel

The preview panel renders the same component tree as the public profile renderer (shared components), but inside a scaled-down container to simulate a full-width page. Approach:

- Wrap the profile renderer in a container with `transform: scale()` and `transform-origin: top left` to fit the editor layout
- Alternatively, render it at full width in an iframe for true isolation — this avoids CSS bleed but adds complexity. Start with the transform approach and move to iframe only if CSS conflicts emerge.
- Show a responsive preview toggle (Desktop / Mobile) that adjusts the container width. Desktop shows full width, mobile constrains to 390px.

The preview should use the account's real data (releases, events, posts) fetched on builder load, so users see what their actual profile will look like. Placeholder content should only appear for sections where the account has no data yet (e.g., "Add your first event to see it here").

### Asset Upload Flow

For any paid account, background image upload works as follows:

1. User clicks "Upload image" or "Change image" within a section's Appearance settings
2. A modal opens showing existing uploaded assets (from `GET /api/v1/profile_assets`) as a thumbnail grid, plus an upload dropzone
3. User either selects an existing asset or uploads a new one (`POST /api/v1/profile_assets`)
4. On upload, show a progress indicator. On completion, the asset appears in the grid and is auto-selected.
5. Selecting an asset sets the section's `background_image_url` in the store and the preview updates immediately
6. A "Remove" option clears the field (does not delete the asset — it remains available for reuse)

Image requirements shown in the upload area: "JPEG, PNG, or WebP. Max 5MB. Recommended: 2400×800px or wider."

### Plan Gating UI

All customization features (colors, fonts, section overrides, background images, custom text) are available to every paid plan. The only plan-level restriction is **which section types** an account can add.

The "Add Section" button at the bottom of the section list opens a popover listing all section types. The behavior for each:

- **Available and already added** (e.g., Hero for any paid plan): shown as disabled with "Already added" label
- **Available but not yet added**: clickable, adds the section to the list
- **`custom_text`**: shows a count ("2 of 3 used"), disabled at the limit
- **Not available on current plan** (e.g., Merch for a Band Starter account): shown with a lock icon and "Available on Pro" label. Clicking opens a contextual upgrade prompt explaining which plan unlocks it, with a CTA to the plan upgrade page.

The builder fetches the section availability mapping from the API (returned alongside the theme config) so it always reflects the account's current plan. No section types that are unavailable should appear in the section list — if an account downgrades and loses access to a section type, those sections are hidden from the builder with a banner: "Some sections are hidden because they require a higher plan. Your settings are saved and will reappear if you upgrade."

---

## Public Profile Renderer

### Route

`/[username]` — this is the existing profile route. The renderer checks whether the account has a `profile_theme` with a `published_at` date. If yes, render the custom themed profile. If no, render the current default profile layout.

### Server-Side Rendering

The public profile should be server-rendered for SEO and performance. In the Next.js App Router:

- Use a server component for the page that fetches `GET /api/v1/profiles/:username`
- The API response includes both the theme config and all section data (pre-hydrated), so a single fetch powers the entire page
- Set appropriate cache headers: `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` (5 min cache, 10 min stale-while-revalidate)
- Generate `<meta>` tags from the account's display name, bio, and avatar for social sharing

### Rendering Architecture

The profile page component structure:

```
ProfilePage
├── ProfileHead (Google Fonts preload, CSS custom properties)
├── ProfileSection (wrapper, repeated per visible section)
│   ├── HeroSection
│   ├── MusicSection
│   ├── EventsSection
│   ├── PostsSection
│   ├── AboutSection
│   ├── RecommendationsSection
│   ├── MailingListSection
│   ├── MerchSection
│   └── CustomTextSection
└── ProfileFooter ("Powered by GoodSongs" + link)
```

**`ProfileHead`** — renders in the `<head>`:

- Google Fonts `<link>` tags for the two selected fonts (with `display=swap`)
- No need for a `<style>` block — CSS custom properties are set on the page wrapper

**`ProfilePage` wrapper** — sets CSS custom properties from the global theme:

```css
.profile-page {
  --gs-bg: #1a1a1a;
  --gs-brand: #ff6b35;
  --gs-font: #f0f0f0;
  --gs-header-font: "Space Grotesk", sans-serif;
  --gs-body-font: "Inter", sans-serif;

  background-color: var(--gs-bg);
  color: var(--gs-font);
  font-family: var(--gs-body-font);
}

.profile-page h1,
.profile-page h2,
.profile-page h3 {
  font-family: var(--gs-header-font);
}
```

**`ProfileSection` wrapper** — handles the cascade for each section. If the section has override values, it sets scoped CSS custom properties on the section `<div>`:

```css
.profile-section {
  /* Inherits globals by default */
  background-color: var(--gs-section-bg, var(--gs-bg));
  color: var(--gs-section-font, var(--gs-font));
}
```

When a section has overrides, the component sets inline `style` with the custom property overrides:

```jsx
<div
  className="profile-section"
  style={{
    "--gs-section-bg": section.settings.background_color || undefined,
    "--gs-section-font": section.settings.font_color || undefined,
    backgroundImage: section.settings.background_image_url
      ? `url(${section.settings.background_image_url})`
      : undefined,
  }}
>
  <SectionRenderer
    type={section.type}
    settings={section.settings}
    data={section.data}
  />
</div>
```

**Background images** on sections should use `background-size: cover`, `background-position: center`, and include a semi-transparent overlay (using the section's background color at ~80% opacity) to ensure text readability.

**`SectionRenderer`** — a simple switch/map component:

```tsx
const renderers: Record<string, React.ComponentType<SectionProps>> = {
  hero: HeroSection,
  music: MusicSection,
  events: EventsSection,
  posts: PostsSection,
  about: AboutSection,
  recommendations: RecommendationsSection,
  mailing_list: MailingListSection,
  merch: MerchSection,
  custom_text: CustomTextSection,
};
```

Each section component receives `settings`, `data`, and the global theme context. They render the section's content using the account's real data and respect display settings like `layout` and `display_limit`.

### Section Rendering Notes

**Hero** — full-width section, typically taller (min-height ~400px). Background image or solid color. Headline and subtitle centered or left-aligned. CTA button styled with `brand_color`. If no headline is set, fall back to the account's display name.

**Music** — renders releases from `data.releases`. Grid layout shows album art in a responsive grid (2–4 columns depending on viewport). List layout shows art + title + year in rows. Each item links to the release detail page. If the account has no releases, this section is auto-hidden on the public profile (even if `visible: true` in the config).

**Events** — renders from `data.events`. Card layout with date, venue, city. Past events (if shown) are visually dimmed. Same auto-hide behavior if no events exist.

**Posts** — renders from `data.posts`. Card layout with title, excerpt, date. Links to the full post.

**About** — renders markdown body as HTML. Use a sanitized markdown renderer (e.g., `react-markdown` with a restricted set of allowed elements: `p`, `strong`, `em`, `a`, `br`).

**Recommendations** — renders from `data.recommendations`. Similar layout options to Music (grid/list). Shows album art, song/album title, and who recommended it.

**Mailing List** — if provider is `"native"`, renders an email input + subscribe button that submits to a GoodSongs endpoint. If provider is external, renders the heading/description and a CTA button linking to the external form URL.

**Merch** — renders a heading and a CTA button/link to the external merch URL. Future: if GoodSongs builds native merch tools, this section can embed product cards.

**Custom Text** — renders the heading and markdown body. Same sanitized markdown approach as About.

### Performance

- **Font loading:** Preload the two Google Fonts in `<head>` with `rel="preload"` and `display=swap`. Only load the weights actually used (400 for body, 600/700 for headers).
- **Images:** All background images and album art should use `next/image` (or `<img>` with `loading="lazy"` and `srcset` for responsive sizing). Hero background image should be eagerly loaded; all others lazy.
- **Sections below the fold:** Use native lazy loading or Intersection Observer to defer rendering of sections far down the page. The hero and first content section should render immediately.
- **CSS:** The theme uses CSS custom properties, which are extremely lightweight. No runtime CSS-in-JS is needed. Section components can use CSS Modules or Tailwind utility classes as consistent with the existing codebase.

### Accessibility

- All text must meet WCAG 2.1 AA contrast ratios against its background. Since users control colors, the builder should include a **contrast checker** that warns (non-blocking) when a color combination doesn't meet AA. Show a small warning icon next to the font color picker with a tooltip: "This color may be hard to read on your background."
- All interactive elements (CTA buttons, links, form inputs) must be keyboard navigable.
- Background images must not be the sole carrier of information — they're decorative, so `role="presentation"` or empty `alt` is appropriate.
- Section headings should use semantic heading levels (`h2` for section titles within the `h1` profile name).

### Shared Component Strategy

The section renderer components are shared between the builder preview and the public profile. To support this:

- Section components accept all their data as props (no internal fetching)
- They read theme values from CSS custom properties (which both the builder preview and public page set)
- The builder wraps them in a preview container; the public page renders them directly
- No builder-specific logic should leak into the section components — the editing UI and the rendered output are separate component trees

---

## Error States and Edge Cases

**Builder:**

- Save failure: show a toast with "Couldn't save. Please try again." and keep the local state intact so no work is lost.
- Publish failure: same pattern, with "Couldn't publish."
- Asset upload failure: show error in the upload modal with the specific reason (file too large, wrong type, limit reached).
- Session expiry: if a save fails with 401, redirect to login with a return URL back to the builder. Local state will be lost — this is acceptable for an auth edge case.

**Public profile:**

- Account has no theme: render the default profile (existing behavior).
- Account has a theme but no content for a section type: auto-hide that section even if `visible: true`. Don't show empty sections to visitors.
- Invalid font or color values (data corruption): fall back to defaults gracefully. The CSS custom property approach handles this naturally — unset properties inherit from the page defaults.
- Account downgrades from Pro to a lower plan: sections that require the higher plan (e.g., Merch, Mailing List) are hidden from the public profile but preserved in the database. If they upgrade again, everything reappears. The builder shows a banner: "Some sections are hidden because they require a higher plan. Your settings are saved and will reappear if you upgrade."

---

## Implementation Phases

### Phase 1: Foundation

- Profile renderer components for all section types with default styling
- Public profile route using server-rendered data from the API
- CSS custom property theming system

### Phase 2: Builder Core

- Builder page layout (editor + preview panels)
- Global theme controls (colors, fonts)
- Section visibility toggles and drag-and-drop reordering
- Save/publish/discard workflow
- Preview panel with live updates

### Phase 3: Section Editing & Assets

- Section-specific settings forms for all section types
- Section-level appearance overrides
- Asset upload flow and image picker modal
- Background image support in sections
- Custom text section creation
- Contrast checker warning

### Phase 4: Plan Gating & Polish

- Section availability enforcement based on plan
- Upgrade prompts for unavailable section types
- Downgrade handling (hidden sections banner)
- Mobile builder experience (edit/preview toggle)
- Responsive preview toggle (desktop/mobile)
- Onboarding flow for first-time builder users (optional guided setup)
- Animation/transitions on section reorder

## Profile Customization Endpoints

Profile customization allows paid band and blogger accounts to customize their public profiles with theming, sections, and layout ordering.

**Required Ability:** `can_customize_profile` (Band Starter, Band Pro, Blogger, Blogger Pro)

### GET /api/v1/profile_theme

Get the authenticated user's profile theme configuration including draft.

**Authentication:** Required + `can_customize_profile` ability

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "user_id": 42,
    "background_color": "#121212",
    "brand_color": "#6366f1",
    "font_color": "#f5f5f5",
    "header_font": "Inter",
    "body_font": "Inter",
    "sections": [
      { "type": "hero", "visible": true, "order": 0, "content": {} },
      { "type": "music", "visible": true, "order": 1, "content": {} },
      { "type": "events", "visible": true, "order": 2, "content": {} }
    ],
    "draft_sections": null,
    "has_draft": false,
    "published_at": "2026-03-02T10:30:00Z",
    "created_at": "2026-03-01T09:00:00Z",
    "updated_at": "2026-03-02T10:30:00Z",
    "config": {
      "approved_fonts": ["Inter", "Space Grotesk", "DM Sans", "..."],
      "section_types": [
        "hero",
        "music",
        "events",
        "posts",
        "about",
        "recommendations",
        "custom_text",
        "mailing_list",
        "merch"
      ],
      "max_sections": 12,
      "max_custom_text": 3
    }
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "error": "upgrade_required",
  "message": "This feature requires an upgrade.",
  "required_ability": "can_customize_profile",
  "upgrade_plan": "band_starter"
}
```

**Notes:**

- Returns default theme if none exists
- `config` contains static configuration for frontend reference
- `draft_sections` contains unpublished changes (null if no draft)

---

### PUT /api/v1/profile_theme

Update the profile theme. Section changes go to `draft_sections` and must be published separately.

**Authentication:** Required + `can_customize_profile` ability

**Request Body:**

```json
{
  "background_color": "#1a1a1a",
  "brand_color": "#ff6b35",
  "font_color": "#f0f0f0",
  "header_font": "Space Grotesk",
  "body_font": "Inter",
  "sections": [
    {
      "type": "hero",
      "visible": true,
      "order": 0,
      "content": { "headline": "Welcome" }
    },
    { "type": "music", "visible": true, "order": 1, "content": {} },
    {
      "type": "about",
      "visible": true,
      "order": 2,
      "content": { "bio": "About us..." }
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "background_color": "#1a1a1a",
    "brand_color": "#ff6b35",
    "sections": [...],
    "draft_sections": [...],
    "has_draft": true,
    "...": "..."
  }
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "error": "validation_error",
  "message": "Cannot have more than 12 sections, hero section can only appear once",
  "details": [
    "Cannot have more than 12 sections",
    "hero section can only appear once"
  ]
}
```

**Notes:**

- Global theme fields (colors, fonts) are updated immediately
- Section changes go to `draft_sections` until published
- Color fields must be valid hex colors (e.g., `#FF5733`)
- Fonts must be from the approved list

---

### POST /api/v1/profile_theme/publish

Publish draft sections to make them live on the public profile.

**Authentication:** Required + `can_customize_profile` ability

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "sections": [...],
    "draft_sections": null,
    "has_draft": false,
    "published_at": "2026-03-02T15:00:00Z",
    "...": "..."
  },
  "message": "Theme published successfully"
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "error": "no_draft",
  "message": "No draft to publish"
}
```

---

### POST /api/v1/profile_theme/discard_draft

Discard unpublished draft sections.

**Authentication:** Required + `can_customize_profile` ability

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "sections": [...],
    "draft_sections": null,
    "has_draft": false,
    "...": "..."
  },
  "message": "Draft discarded"
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "error": "no_draft",
  "message": "No draft to discard"
}
```

---

### POST /api/v1/profile_theme/reset

Reset the theme to role-based defaults (colors, fonts, and sections).

**Authentication:** Required + `can_customize_profile` ability

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "background_color": "#121212",
    "brand_color": "#6366f1",
    "font_color": "#f5f5f5",
    "header_font": "Inter",
    "body_font": "Inter",
    "sections": [...],
    "draft_sections": null,
    "has_draft": false,
    "published_at": null,
    "...": "..."
  },
  "message": "Theme reset to defaults"
}
```

---

### GET /api/v1/profile_assets

List the authenticated user's uploaded profile assets (background images, etc.).

**Authentication:** Required + `can_customize_profile` ability

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "purpose": "background",
      "url": "https://api.goodsongs.app/rails/active_storage/blobs/.../image.jpg",
      "thumbnail_url": "https://api.goodsongs.app/rails/active_storage/representations/.../image.jpg",
      "file_type": "image/jpeg",
      "file_size": 245000,
      "created_at": "2026-03-01T09:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 20
  }
}
```

---

### POST /api/v1/profile_assets

Upload a new profile asset image.

**Authentication:** Required + `can_customize_profile` ability

**Content-Type:** `multipart/form-data`

**Request Body:**

- `image` (required): Image file (JPEG, PNG, or WebP, max 5MB)
- `purpose` (optional): Asset purpose - `"background"`, `"header"`, or `"custom"` (default: `"background"`)

**Response (201 Created):**

```json
{
  "data": {
    "id": 2,
    "purpose": "background",
    "url": "https://api.goodsongs.app/rails/active_storage/blobs/.../new-image.jpg",
    "thumbnail_url": "https://api.goodsongs.app/rails/active_storage/representations/.../new-image.jpg",
    "file_type": "image/png",
    "file_size": 180000,
    "created_at": "2026-03-02T14:00:00Z"
  }
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "error": "validation_error",
  "message": "Image must be less than 5MB, Image must be a JPEG, PNG, or WebP image",
  "details": {
    "image": ["must be less than 5MB", "must be a JPEG, PNG, or WebP image"]
  }
}
```

**Notes:**

- Maximum 20 assets per user
- Maximum file size: 5MB
- Allowed types: JPEG, PNG, WebP

---

### DELETE /api/v1/profile_assets/:id

Delete a profile asset.

**Authentication:** Required + `can_customize_profile` ability

**URL Parameters:**

- `id` (required): The asset ID

**Response (200 OK):**

```json
{
  "message": "Asset deleted successfully"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "not_found",
  "message": "Asset not found"
}
```

---

### GET /api/v1/profiles/:username

Get a user's public profile with theme and hydrated section data. This is the public-facing profile endpoint.

**Authentication:** None required

**URL Parameters:**

- `username` (required): The user's username

**Response (200 OK):**

```json
{
  "data": {
    "user": {
      "id": 42,
      "username": "midnightpines",
      "email": "band@example.com",
      "about_me": "We are a band from Portland.",
      "profile_image_url": "https://...",
      "reviews_count": 15,
      "role": "band",
      "display_name": "The Midnight Pines",
      "location": "Portland, OR",
      "followers_count": 1200,
      "following_count": 50,
      "primary_band": {
        "id": 5,
        "slug": "midnight-pines",
        "name": "The Midnight Pines",
        "location": "Portland, OR",
        "profile_picture_url": "https://..."
      }
    },
    "theme": {
      "background_color": "#121212",
      "brand_color": "#6366f1",
      "font_color": "#f5f5f5",
      "header_font": "Inter",
      "body_font": "Inter"
    },
    "sections": [
      {
        "type": "hero",
        "order": 0,
        "content": {},
        "data": {
          "display_name": "The Midnight Pines",
          "profile_image_url": "https://...",
          "location": "Portland, OR",
          "band": {
            "id": 5,
            "slug": "midnight-pines",
            "name": "The Midnight Pines"
          }
        }
      },
      {
        "type": "music",
        "order": 1,
        "content": {},
        "data": {
          "band": { "...": "..." },
          "tracks": [{ "id": 1, "name": "Song Title", "...": "..." }],
          "bandcamp_embed": "<iframe>...</iframe>"
        }
      },
      {
        "type": "events",
        "order": 2,
        "content": {},
        "data": {
          "events": [
            {
              "id": 1,
              "name": "Live at The Fillmore",
              "event_date": "2026-04-15",
              "...": "..."
            }
          ]
        }
      },
      {
        "type": "posts",
        "order": 3,
        "content": {},
        "data": {
          "posts": [
            {
              "id": 1,
              "title": "New Album Announcement",
              "slug": "new-album",
              "...": "..."
            }
          ]
        }
      }
    ]
  }
}
```

**Response (404 Not Found):**

```json
{
  "error": "not_found",
  "message": "User not found"
}
```

**Notes:**

- Returns only visible sections
- Filters out sections the user's plan doesn't support (mailing_list, merch)
- Each section includes hydrated `data` with pre-fetched content
- Fan accounts return basic profile without customization
- If no theme exists, returns default sections based on user role

---

### Section Types Reference

| Section Type      | Description                               | Plan Availability     |
| ----------------- | ----------------------------------------- | --------------------- |
| `hero`            | Profile header with name, image, location | All paid plans        |
| `music`           | Band's tracks and music embeds            | All paid plans        |
| `events`          | Upcoming events list                      | All paid plans        |
| `posts`           | Blog posts list                           | All paid plans        |
| `about`           | About text/bio section                    | All paid plans        |
| `recommendations` | User's song recommendations/reviews       | All paid plans        |
| `custom_text`     | Custom text blocks (up to 3)              | All paid plans        |
| `mailing_list`    | Newsletter signup form                    | Band Pro, Blogger Pro |
| `merch`           | Merchandise links                         | Band Pro only         |

---

### Approved Fonts

Inter, Space Grotesk, DM Sans, Plus Jakarta Sans, Outfit, Sora, Manrope, Rubik, Work Sans, Nunito Sans, Lora, Merriweather, Playfair Display, Source Serif 4, Libre Baskerville, IBM Plex Mono, JetBrains Mono
