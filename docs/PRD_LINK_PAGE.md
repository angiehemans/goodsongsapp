# PRD: Link Page (Linktree Alternative) — Frontend Implementation

## Overview

Bands and bloggers want a linktree-style page showing their profile info, social/streaming links, and custom links — all styled with their existing profile theme. The API is already built. This PRD covers the frontend work: site builder integration (managing links + page settings) and public link page rendering.

**API endpoints are live and documented in `API_DOCUMENTATION.md` in this repo.**

---

## Goals

1. Let bands/bloggers add, edit, reorder, and delete custom links from the site builder
2. Let them configure link page settings (heading, description, layout, which link types to show)
3. Render a public link page at `/bands/:slug/links` and `/users/:username/links` with full theming
4. Integrate the link page into the site builder's page tabs and preview system

---

## User Stories

- **As a band**, I want a single shareable link (goodsongs.app/bands/my-band/links) I can put in my Instagram bio that shows all my streaming platforms, socials, and custom links (merch, Patreon, etc.)
- **As a blogger**, I want a link page styled with my profile theme that I can share anywhere
- **As a band/blogger**, I want to manage my custom links in the site builder with drag-and-drop reorder
- **As a band/blogger**, I want to control which social/streaming links appear on my link page
- **As a visitor**, I want to see a clean, themed page with clickable links

---

## Architecture

### How It Fits Into the Existing System

The site builder already has a **page tabs** concept in the EditorPanel (`SegmentedControl` with Main Page / Posts / Events). The link page adds a new tab: **Links**.

```
EditorPanel tabs:  [Main Page] [Posts] [Events] [Links ← NEW]
```

The data model mirrors sections:

- **Sections** config → stored in `profile_themes.sections` / `draft_sections`
- **Pages** config → stored in `profile_themes.pages` / `draft_pages` (NEW)
- **Custom links** → stored in `profile_links` table (separate CRUD, like profile_assets)

Pages follow the same draft/publish workflow as sections — editing page settings saves to `draft_pages`, publishing promotes to `pages`.

Custom links (the actual link items) are **not** part of the draft system — they're managed via direct CRUD endpoints and are immediately visible once created/updated.

---

## Implementation Plan

### 1. Types — `lib/site-builder/types.ts`

Add the following types:

```typescript
// Page types
export type PageType = "links";
export type LinkPageLayout = "list" | "grid";

// Link page settings (stored in pages[].settings)
export interface LinkPageSettings {
  heading?: string; // max 120 chars
  description?: string; // max 500 chars
  show_social_links?: boolean; // default true
  show_streaming_links?: boolean; // default true
  layout?: LinkPageLayout; // default 'list'
}

// A page in the profile theme
export interface ProfilePage {
  type: PageType;
  slug: string;
  visible: boolean;
  settings?: LinkPageSettings;
}

// Custom link from profile_links table
export interface ProfileLink {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  icon?: string;
  position: number;
  visible: boolean;
  thumbnail_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Public link page response
export interface LinkPageResponse {
  data: {
    user: PublicProfileResponse["data"]["user"];
    theme: ProfileTheme | null;
    page_settings: LinkPageSettings;
    profile: {
      display_name: string;
      about?: string;
      profile_image_url?: string;
      location?: string;
    };
    custom_links: Array<{
      id: number;
      title: string;
      url: string;
      icon?: string;
      description?: string | null;
      position: number;
      thumbnail_url?: string | null;
    }>;
    social_links: Record<string, string>;
    streaming_links: Record<string, string>;
  };
}
```

Update `ProfileThemeResponse` to include new fields:

```typescript
// In ProfileThemeResponse.data, add:
pages: ProfilePage[];
draft_pages: ProfilePage[] | null;

// In ProfileThemeConfig, add:
page_types: PageType[];
page_schemas: Record<string, unknown>;

// In ProfileSourceData, add:
profile_links?: Array<{
  id: number;
  title: string;
  description?: string | null;
  url: string;
  icon?: string;
  position: number;
  thumbnail_url?: string | null;
}>;
```

---

### 2. API Functions — `lib/site-builder/api.ts`

Add these functions:

```typescript
// --- Profile Links CRUD ---

export async function getProfileLinks(): Promise<{ data: ProfileLink[] }> {
  return apiClient.request("/api/v1/profile_links");
}

export async function createProfileLink(link: {
  title: string;
  url: string;
  icon?: string;
  position?: number;
  visible?: boolean;
  thumbnail?: File;
}): Promise<{ data: ProfileLink }> {
  // Use FormData when a thumbnail file is included, JSON otherwise
  if (link.thumbnail) {
    const formData = new FormData();
    formData.append("title", link.title);
    formData.append("url", link.url);
    if (link.icon) formData.append("icon", link.icon);
    if (link.position !== undefined) formData.append("position", String(link.position));
    if (link.visible !== undefined) formData.append("visible", String(link.visible));
    formData.append("thumbnail", link.thumbnail);
    return apiClient.formRequest("/api/v1/profile_links", formData);
  }
  const { thumbnail, ...jsonBody } = link;
  return apiClient.request("/api/v1/profile_links", {
    method: "POST",
    body: JSON.stringify(jsonBody),
  });
}

export async function updateProfileLink(
  id: number,
  updates: Partial<
    Pick<ProfileLink, "title" | "url" | "icon" | "position" | "visible">
  > & { thumbnail?: File; remove_thumbnail?: boolean },
): Promise<{ data: ProfileLink }> {
  // Use FormData when a thumbnail file is included or being removed
  if (updates.thumbnail || updates.remove_thumbnail) {
    const formData = new FormData();
    if (updates.title) formData.append("title", updates.title);
    if (updates.url) formData.append("url", updates.url);
    if (updates.icon !== undefined) formData.append("icon", updates.icon || "");
    if (updates.position !== undefined) formData.append("position", String(updates.position));
    if (updates.visible !== undefined) formData.append("visible", String(updates.visible));
    if (updates.thumbnail) formData.append("thumbnail", updates.thumbnail);
    if (updates.remove_thumbnail) formData.append("remove_thumbnail", "true");
    // formRequest always uses POST — the API accepts POST on /profile_links/:id for FormData updates
    return apiClient.formRequest(`/api/v1/profile_links/${id}`, formData);
  }
  const { thumbnail, remove_thumbnail, ...jsonBody } = updates;
  return apiClient.request(`/api/v1/profile_links/${id}`, {
    method: "PUT",
    body: JSON.stringify(jsonBody),
  });
}

export async function deleteProfileLink(
  id: number,
): Promise<{ message: string }> {
  return apiClient.request(`/api/v1/profile_links/${id}`, {
    method: "DELETE",
  });
}

export async function reorderProfileLinks(
  linkIds: number[],
): Promise<{ data: ProfileLink[] }> {
  return apiClient.request("/api/v1/profile_links/reorder", {
    method: "PUT",
    body: JSON.stringify({ link_ids: linkIds }),
  });
}

// --- Public Link Page ---

export async function getBandLinkPage(
  bandSlug: string,
): Promise<LinkPageResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
  const response = await fetch(
    `${apiUrl}/api/v1/profiles/bands/${bandSlug}/links`,
    {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    },
  );
  if (!response.ok) return null;
  return response.json();
}

export async function getUserLinkPage(
  username: string,
): Promise<LinkPageResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
  const response = await fetch(
    `${apiUrl}/api/v1/profiles/users/${username}/links`,
    {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    },
  );
  if (!response.ok) return null;
  return response.json();
}
```

---

### 3. Store Updates — `lib/site-builder/store.ts`

Extend the Zustand store to track pages and links:

**New state fields:**

```typescript
// In BuilderState:
pages: ProfilePage[];
profileLinks: ProfileLink[];

// In lastSaved snapshot:
lastSaved: {
  theme: ProfileTheme;
  sections: Section[];
  singlePostLayout: SinglePostLayout;
  pages: ProfilePage[];    // ← add
} | null;
```

**New actions:**

```typescript
// In BuilderActions:
setPages: (pages: ProfilePage[]) => void;
updatePageSettings: (pageType: PageType, settings: Partial<LinkPageSettings>) => void;
togglePageVisibility: (pageType: PageType) => void;
setProfileLinks: (links: ProfileLink[]) => void;
```

**Update `activePage` type:**

```typescript
// Current:
activePage: "main" | "posts" | "events";

// New:
activePage: "main" | "posts" | "events" | "links";
```

**Update `initialize`:**

```typescript
initialize: (data: {
  // ...existing fields...
  pages?: ProfilePage[];
  draftPages?: ProfilePage[] | null;
  profileLinks?: ProfileLink[];
}) => void;
```

The `initialize` action should set `pages` from `draftPages || pages` (same pattern as sections). Profile links come from `source_data.profile_links`.

**Update `computeHasUnsavedChanges`:**

```typescript
function computeHasUnsavedChanges(state: BuilderState): boolean {
  if (!state.lastSaved) return false;
  return (
    !isEqual(state.theme, state.lastSaved.theme) ||
    !isEqual(state.sections, state.lastSaved.sections) ||
    !isEqual(state.singlePostLayout, state.lastSaved.singlePostLayout) ||
    !isEqual(state.pages, state.lastSaved.pages) // ← add
  );
}
```

**Update `markAsSaved` and `restoreFromSaved`** to include `pages`.

---

### 4. EditorPanel Updates — `components/SiteBuilder/Builder/EditorPanel.tsx`

**Add "Links" tab to the SegmentedControl:**

```tsx
<SegmentedControl
  data={[
    { value: "main", label: "Main Page" },
    { value: "posts", label: "Posts" },
    { value: "events", label: "Events" },
    { value: "links", label: "Links" }, // ← new
  ]}
/>
```

**Add the links editor panel when `activePage === 'links'`:**

```tsx
{activePage === 'links' ? (
  <div className="builder-editor__section">
    <div className="builder-editor__section-title">Link Page</div>
    <LinksEditor />
  </div>
) : activePage === 'events' ? (
  // ...existing...
```

**Update `handleSave`** to include pages in the save payload:

```typescript
await updateProfileTheme({
  ...theme,
  sections,
  single_post_layout: singlePostLayout,
  pages, // ← add
});
```

---

### 5. LinksEditor Component — `components/SiteBuilder/Builder/LinksEditor.tsx` (NEW)

This is the main editor for the Links tab. It has two sub-sections: **Page Settings** and **Custom Links**.

#### Page Settings

Controls for the link page configuration:

| Control              | Type             | Maps to                                          |
| -------------------- | ---------------- | ------------------------------------------------ |
| Page visible toggle  | Switch           | `pages[links].visible`                           |
| Heading              | TextInput        | `pages[links].settings.heading` (max 120)        |
| Description          | Textarea         | `pages[links].settings.description` (max 500)    |
| Show social links    | Switch           | `pages[links].settings.show_social_links`        |
| Show streaming links | Switch           | `pages[links].settings.show_streaming_links`     |
| Layout               | SegmentedControl | `pages[links].settings.layout` (`list` / `grid`) |

These controls update the store via `updatePageSettings('links', { ... })`. Changes are part of the draft/publish workflow.

#### Custom Links

A sortable list of custom links, managed via direct API calls (not draft system).

**UI structure:**

```
┌─────────────────────────────────────────┐
│  Page Settings                          │
│  ┌─ Visible: [ON]                       │
│  ├─ Heading: [My Links___________]      │
│  ├─ Description: [________________]     │
│  ├─ Show social links: [ON]             │
│  ├─ Show streaming links: [ON]          │
│  └─ Layout: [List] [Grid]              │
├─────────────────────────────────────────┤
│  Custom Links              [+ Add Link] │
│  ┌──────────────────────────────────┐   │
│  │ ⠿ My Website          ✏️  🗑️  👁️ │   │
│  │ ⠿ Merch Store          ✏️  🗑️  👁️ │   │
│  │ ⠿ Patreon              ✏️  🗑️  👁️ │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Link item actions:**

- **Drag handle** (⠿) — dnd-kit sortable, calls `reorderProfileLinks()` on drop
- **Edit** (✏️) — opens inline edit or modal with title, URL, icon fields
- **Delete** (🗑️) — confirmation modal, calls `deleteProfileLink()`
- **Visibility toggle** (👁️) — calls `updateProfileLink(id, { visible: !visible })`

**Add Link** — opens a modal/inline form:

- Title (required, max 100 chars)
- Description (optional, max 200 chars — short subtitle shown below the title)
- URL (required, must start with http:// or https://)
- Icon (optional dropdown: link, music, shop, video, heart, star, globe, mail)
- Thumbnail (optional image upload — JPEG, PNG, or WebP, max 2MB)
- Calls `createProfileLink()` on submit (uses FormData when thumbnail is attached)

**Thumbnail upload:**
- Uses the same `apiClient.formRequest()` pattern as profile assets / blog images
- Shows a small image preview in the link card when a thumbnail is set
- Edit modal shows current thumbnail with a "Remove" button that sends `remove_thumbnail: true`
- Accepted formats: JPEG, PNG, WebP. Max size: 2MB
- Thumbnails are optional — links without thumbnails show the icon (or default link icon)

**Drag and drop reorder:**

- Use `@dnd-kit/sortable` (already installed, used by SectionList)
- On drag end, collect new order of IDs and call `reorderProfileLinks(newOrder)`
- Update local state optimistically, revert on error

**Link CRUD is immediate (not draft).** When you add/edit/delete a link, it hits the API directly. The preview updates by refreshing `profileLinks` in the store. This matches how social links work in the hero section (save via `apiClient.updateProfile()`, update store sourceData).

---

### 6. PreviewPanel Updates — `components/SiteBuilder/Builder/PreviewPanel.tsx`

Add a link page preview when `activePage === 'links'`:

```tsx
{activePage === 'links' ? (
  <LinkPagePreview
    theme={theme}
    pages={pages}
    sourceData={sourceData}
    profileLinks={profileLinks}
  />
) : activePage === 'posts' ? (
  // ...existing...
```

---

### 7. LinkPagePreview Component — `components/SiteBuilder/LinkPagePreview.tsx` (NEW)

A preview component that renders the link page in the builder's preview panel. Uses the same theme CSS variables as `ProfilePage`.

**Props:**

```typescript
interface LinkPagePreviewProps {
  theme: ProfileTheme;
  pages: ProfilePage[];
  sourceData: ProfileSourceData | null;
  profileLinks: ProfileLink[];
}
```

**Renders:**

1. **Profile header** — avatar, display name, location, description (from sourceData + page settings)
2. **Custom links** — styled cards/buttons for each visible link, in list or grid layout
3. **Social links** — icon row (if `show_social_links` is true in settings)
4. **Streaming links** — icon row (if `show_streaming_links` is true in settings)

All styled with theme colors/fonts via CSS custom properties (same approach as ProfilePage).

If the links page is not visible (toggled off), show a dimmed state with a message: "Link page is hidden. Toggle visibility in settings to make it live."

---

### 8. Public Link Page — `app/bands/[slug]/links/page.tsx` and `app/users/[username]/links/page.tsx` (NEW)

Server-rendered Next.js pages that fetch and render the public link page.

#### `app/bands/[slug]/links/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { getBandLinkPage } from '@/lib/site-builder/api';
import { LinkPage } from '@/components/SiteBuilder/LinkPage';
import { FontPreload } from '@/components/SiteBuilder/FontPreload';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getBandLinkPage(slug);
  if (!data) return { title: 'Not Found' };

  return {
    title: `${data.data.profile.display_name} - Links`,
    description: data.data.page_settings.description || `Links for ${data.data.profile.display_name}`,
  };
}

export default async function BandLinksPage({ params }) {
  const { slug } = await params;
  const data = await getBandLinkPage(slug);
  if (!data) notFound();

  return (
    <>
      {data.data.theme && (
        <FontPreload fonts={[data.data.theme.header_font, data.data.theme.body_font]} />
      )}
      <LinkPage data={data.data} />
    </>
  );
}
```

#### `app/users/[username]/links/page.tsx`

Same pattern, using `getUserLinkPage(username)`.

---

### 9. LinkPage Component — `components/SiteBuilder/LinkPage.tsx` (NEW)

The actual rendered link page, used by both the public routes and the preview.

**Props:**

```typescript
interface LinkPageProps {
  data: LinkPageResponse["data"];
  isPreview?: boolean;
}
```

**Layout:**

```
┌─────────────────────────────────┐
│                                 │
│         [Profile Image]         │
│          Display Name           │
│            Location             │
│                                 │
│    Heading (from settings)      │
│   Description (from settings)   │
│                                 │
│  ┌───────────────────────────┐  │
│  │   🔗  My Website          │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │   🛒  Merch Store         │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │   ❤️  Patreon             │  │
│  └───────────────────────────┘  │
│                                 │
│     🎵  🍎  ▶️  (streaming)     │
│     📷  🐦  🎵  (social)       │
│                                 │
│        Powered by GoodSongs     │
└─────────────────────────────────┘
```

**Styling approach:**

- Set CSS custom properties from theme (same as ProfilePage):
  - `--gs-profile-bg` → `theme.background_color`
  - `--gs-profile-brand` → `theme.brand_color`
  - `--gs-profile-font` → `theme.font_color`
  - `--gs-profile-header-font` → `theme.header_font`
  - `--gs-profile-body-font` → `theme.body_font`
- Link cards use `brand_color` for hover/active states
- Card backgrounds use `card_background_color` + `card_background_opacity` if set
- Max width centered layout (narrower than main profile — suggest 600-680px)
- Full viewport height, centered content

**Layout modes:**

- **List** (default) — full-width stacked link cards
- **Grid** — 2-column grid of link cards

**Link cards:**

- Clickable `<a>` tags with `target="_blank" rel="noopener noreferrer"`
- Show thumbnail image (if set) on the left side of the card, or icon (if set), or default link icon
- Thumbnail renders as a small square image (~40-48px) with rounded corners
- Title to the right of the thumbnail/icon
- Description (if set) renders as smaller, muted text below the title
- Hover effect using brand color
- In preview mode (`isPreview`), links should not navigate (use `onClick={e => e.preventDefault()}`)

**Social/streaming link rows:**

- Reuse the SVG icon approach from HeroSection
- Only render if the corresponding `show_social_links` / `show_streaming_links` setting is true
- Only show links that actually have values (filter empty)

**Footer:**

- Small "Powered by GoodSongs" text with link to goodsongs.app (skip in preview mode)

---

### 10. SiteBuilderClient Updates — `app/site-builder/SiteBuilderClient.tsx`

Update the `loadTheme` function to pass pages and profile links to the store:

```typescript
initialize({
  // ...existing fields...
  pages: data.pages, // ← add
  draftPages: data.draft_pages, // ← add
  profileLinks: data.source_data?.profile_links, // ← add
});
```

---

### 11. Constants Updates — `lib/site-builder/constants.ts`

Add link page defaults:

```typescript
export const DEFAULT_LINK_PAGE: ProfilePage = {
  type: "links",
  slug: "links",
  visible: true,
  settings: {
    show_social_links: true,
    show_streaming_links: true,
    layout: "list",
  },
};

export const LINK_ICON_OPTIONS = [
  { value: "link", label: "Link" },
  { value: "music", label: "Music" },
  { value: "shop", label: "Shop" },
  { value: "video", label: "Video" },
  { value: "heart", label: "Heart" },
  { value: "star", label: "Star" },
  { value: "globe", label: "Globe" },
  { value: "mail", label: "Email" },
] as const;

export const CHAR_LIMITS = {
  // ...existing...
  link_page_heading: 120,
  link_page_description: 500,
  link_title: 100,
  link_description: 200,
};
```

---

## File Summary

### New files

| File                                             | Purpose                                                |
| ------------------------------------------------ | ------------------------------------------------------ |
| `components/SiteBuilder/Builder/LinksEditor.tsx` | Editor panel for links tab (page settings + link CRUD) |
| `components/SiteBuilder/LinkPagePreview.tsx`     | Preview component for site builder                     |
| `components/SiteBuilder/LinkPage.tsx`            | Rendered link page (shared by public + preview)        |
| `app/bands/[slug]/links/page.tsx`                | Public band link page route                            |
| `app/users/[username]/links/page.tsx`            | Public user link page route                            |

### Modified files

| File                                              | Changes                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `lib/site-builder/types.ts`                       | Add `ProfilePage`, `ProfileLink`, `LinkPageResponse`, update `ProfileThemeResponse` |
| `lib/site-builder/api.ts`                         | Add link CRUD functions + public link page fetchers                                 |
| `lib/site-builder/store.ts`                       | Add `pages`, `profileLinks` state; update dirty detection; add page actions         |
| `lib/site-builder/constants.ts`                   | Add link page defaults, icon options, char limits                                   |
| `components/SiteBuilder/Builder/EditorPanel.tsx`  | Add "Links" tab, include pages in save payload                                      |
| `components/SiteBuilder/Builder/PreviewPanel.tsx` | Add link page preview branch                                                        |
| `app/site-builder/SiteBuilderClient.tsx`          | Pass pages + profile links to store initialize                                      |

---

## Design Considerations

### Link cards

Link cards should feel tappable and substantial on mobile. Suggested minimum height: 56px. Use rounded corners consistent with the theme's card style. The brand color should appear on hover/focus as a border or background tint.

### Icon system

Start with Tabler Icons (already in the project) mapped to the icon string values. The icon field is optional — links without an icon show a default link icon.

Suggested mapping:

- `link` → `IconLink`
- `music` → `IconMusic`
- `shop` → `IconShoppingBag`
- `video` → `IconVideo`
- `heart` → `IconHeart`
- `star` → `IconStar`
- `globe` → `IconWorld`
- `mail` → `IconMail`

### Mobile-first

The link page is primarily shared on mobile (Instagram bio, etc.). Design mobile-first:

- Single column on mobile, optional 2-col grid on desktop (when `layout: 'grid'`)
- Large touch targets (min 44px)
- Fast loading — minimal JS, server-rendered

### Empty states

- No custom links yet → "Add your first link in the site builder"
- No social links configured → hide the social links section entirely (don't show empty row)
- Link page disabled (visible: false) → 404 from API (already handled)

### SEO

The public link page should have:

- `<title>` → "{display_name} - Links"
- `<meta name="description">` → page description setting, or fallback
- Open Graph tags with profile image
- `noindex` is NOT set — link pages should be indexable

---

## API Reference

All endpoints are documented in `API_DOCUMENTATION.md` in the API repo. Quick reference:

| Endpoint                                 | Method | Auth | Purpose                                  |
| ---------------------------------------- | ------ | ---- | ---------------------------------------- |
| `/api/v1/profile_links`                  | GET    | Yes  | List user's custom links                 |
| `/api/v1/profile_links`                  | POST   | Yes  | Create a custom link                     |
| `/api/v1/profile_links/:id`              | PUT    | Yes  | Update a custom link                     |
| `/api/v1/profile_links/:id`              | DELETE | Yes  | Delete a custom link                     |
| `/api/v1/profile_links/reorder`          | PUT    | Yes  | Batch reorder links                      |
| `/api/v1/profile_theme`                  | PUT    | Yes  | Update theme (now accepts `pages` array) |
| `/api/v1/profiles/bands/:slug/links`     | GET    | No   | Public band link page                    |
| `/api/v1/profiles/users/:username/links` | GET    | No   | Public user link page                    |

---

## Implementation Order

1. **Types + API functions** — foundation, no UI impact
2. **Store updates** — extend state with pages/links
3. **SiteBuilderClient** — pass new data to store
4. **EditorPanel** — add Links tab (can show placeholder initially)
5. **LinksEditor** — page settings controls + link CRUD with dnd-kit
6. **LinkPage component** — the actual rendered page (shared)
7. **LinkPagePreview** — wire into PreviewPanel
8. **Public routes** — `app/bands/[slug]/links/page.tsx` + `app/users/[username]/links/page.tsx`
9. **Polish** — empty states, loading states, error handling, mobile testing

Steps 1-4 can be done in one pass. Steps 5-6 are the bulk of the work. Steps 7-8 are straightforward wiring once the LinkPage component exists.

---

## Verification Checklist

- [ ] Types compile with no errors
- [ ] Store tracks pages + links, dirty detection works with pages changes
- [ ] Save draft includes pages in payload
- [ ] Publish promotes draft_pages to pages
- [ ] Discard draft restores pages from last saved
- [ ] Links tab appears in site builder for band/blogger users
- [ ] Can create a custom link with title + URL
- [ ] Can edit a custom link's title, URL, icon
- [ ] Can delete a custom link with confirmation
- [ ] Can drag-and-drop reorder custom links
- [ ] Can toggle link visibility
- [ ] Page settings (heading, description, layout, social/streaming toggles) save correctly
- [ ] Preview panel shows link page when Links tab is active
- [ ] Preview updates live as settings/links change
- [ ] Public link page renders at `/bands/:slug/links`
- [ ] Public link page renders at `/users/:username/links`
- [ ] Public link page returns 404 when page is disabled or user doesn't exist
- [ ] Theme colors/fonts apply correctly to public link page
- [ ] Link cards are clickable and open in new tab
- [ ] Mobile layout is usable (large touch targets, single column)
- [ ] Social/streaming links respect show/hide settings
- [ ] Empty states render cleanly
- [ ] Fan users cannot access link management (403 from API, no Links tab shown)
