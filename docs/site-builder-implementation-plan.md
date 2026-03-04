# Site Builder Implementation Plan

## Overview

This plan covers the frontend implementation of the profile customization feature for GoodSongs. The site builder allows paid band and blogger accounts to customize their public profiles with theming, sections, and layout ordering.

---

## Phase 1: Foundation - Profile Renderer Components

**Goal:** Create the section components and public profile renderer that will be shared between the builder preview and public profiles.

### 1.1 Core Types & API Integration

**Files to create:**
- `lib/site-builder/types.ts` - TypeScript interfaces for theme, sections, and API responses
- `lib/site-builder/api.ts` - API client methods for profile theme endpoints
- `lib/site-builder/fonts.ts` - Approved fonts list and Google Fonts utilities
- `lib/site-builder/constants.ts` - Section types, defaults, plan restrictions

**Types to define:**
```typescript
interface ProfileTheme {
  background_color: string;
  brand_color: string;
  font_color: string;
  header_font: string;
  body_font: string;
}

interface Section {
  type: SectionType;
  visible: boolean;
  order: number;
  content: SectionContent;
  settings?: SectionSettings;
  data?: SectionData;
}

type SectionType = 'hero' | 'music' | 'events' | 'posts' | 'about' |
                   'recommendations' | 'mailing_list' | 'merch' | 'custom_text';
```

### 1.2 Section Components

**Directory:** `components/SiteBuilder/sections/`

| Component | File | Description |
|-----------|------|-------------|
| HeroSection | `HeroSection.tsx` | Full-width header with headline, subtitle, CTA, background image |
| MusicSection | `MusicSection.tsx` | Bandcamp/Spotify/Apple Music embeds, release grid |
| EventsSection | `EventsSection.tsx` | Upcoming/past events cards |
| PostsSection | `PostsSection.tsx` | Blog posts grid with excerpts |
| AboutSection | `AboutSection.tsx` | Markdown body with sanitized rendering |
| RecommendationsSection | `RecommendationsSection.tsx` | Grid/list of song recommendations |
| MailingListSection | `MailingListSection.tsx` | Email signup form (native or external) |
| MerchSection | `MerchSection.tsx` | Merch heading + external link CTA |
| CustomTextSection | `CustomTextSection.tsx` | Custom heading + markdown body |

**Shared components:**
- `components/SiteBuilder/ProfileSection.tsx` - Wrapper with CSS custom properties for overrides
- `components/SiteBuilder/SectionRenderer.tsx` - Switch component to render correct section type
- `components/SiteBuilder/ProfileHead.tsx` - Google Fonts preload links
- `components/SiteBuilder/ProfileFooter.tsx` - "Powered by GoodSongs" footer

### 1.3 CSS Theming System

**File:** `components/SiteBuilder/profile-theme.css`

```css
.profile-page {
  --gs-bg: #121212;
  --gs-brand: #6366f1;
  --gs-font: #f5f5f5;
  --gs-header-font: "Inter", sans-serif;
  --gs-body-font: "Inter", sans-serif;
}

.profile-section {
  --gs-section-bg: var(--gs-bg);
  --gs-section-font: var(--gs-font);
}
```

### 1.4 Public Profile Route

**File:** `app/[username]/page.tsx` (or update existing)

- Server component that fetches `GET /api/v1/profiles/:username`
- Renders themed profile if `published_at` exists, else default layout
- Sets cache headers: `s-maxage=300, stale-while-revalidate=600`
- Generates meta tags for social sharing

---

## Phase 2: Builder Core

**Goal:** Create the site builder UI with editor panel, live preview, and save/publish workflow.

### 2.1 State Management

**File:** `lib/site-builder/store.ts`

Use Zustand for builder state:

```typescript
interface BuilderState {
  globals: ProfileTheme;
  sections: Section[];
  lastSaved: { globals: ProfileTheme; sections: Section[] } | null;
  expandedSectionIndex: number | null;
  isSaving: boolean;
  isPublishing: boolean;
  hasUnsavedChanges: boolean;

  // Actions
  setGlobals: (globals: Partial<ProfileTheme>) => void;
  setSections: (sections: Section[]) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  updateSection: (index: number, updates: Partial<Section>) => void;
  addSection: (type: SectionType) => void;
  removeSection: (index: number) => void;
  toggleSectionVisibility: (index: number) => void;
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
  discardChanges: () => Promise<void>;
}
```

### 2.2 Builder Layout

**Files:**
- `app/site-builder/page.tsx` - Main builder page
- `app/site-builder/layout.tsx` - Minimal layout (no app navigation)
- `components/SiteBuilder/BuilderLayout.tsx` - Two-panel layout component

**Layout structure:**
```
BuilderLayout
├── EditorPanel (380px fixed)
│   ├── BuilderTopBar (Save/Publish/Discard)
│   ├── GlobalThemeEditor
│   └── SectionsList (drag-and-drop)
└── PreviewPanel (fluid)
    ├── PreviewToolbar (Desktop/Mobile toggle)
    └── PreviewFrame (scaled profile renderer)
```

### 2.3 Editor Panel Components

**Directory:** `components/SiteBuilder/editor/`

| Component | Description |
|-----------|-------------|
| `BuilderTopBar.tsx` | Save Draft, Publish, Discard buttons, unsaved indicator |
| `GlobalThemeEditor.tsx` | Color pickers, font selects |
| `SectionsList.tsx` | Drag-and-drop section cards using @dnd-kit |
| `SectionCard.tsx` | Individual section with drag handle, visibility toggle, expand/collapse |
| `AddSectionButton.tsx` | Button + popover with available section types |
| `ColorPicker.tsx` | Color picker with hex input and suggested palette |
| `FontSelect.tsx` | Dropdown with approved fonts |

### 2.4 Preview Panel

**Files:**
- `components/SiteBuilder/preview/PreviewPanel.tsx` - Preview container
- `components/SiteBuilder/preview/PreviewToolbar.tsx` - Desktop/Mobile toggle
- `components/SiteBuilder/preview/PreviewFrame.tsx` - Scaled profile renderer

**Preview approach:**
- Use `transform: scale()` with `transform-origin: top left`
- Desktop: full width, Mobile: constrain to 390px
- Render same components as public profile

### 2.5 Data Flow

1. On mount: Fetch `GET /api/v1/profile_theme`
2. Load `draft_sections` if exists, else `sections`
3. Edits update Zustand store → preview re-renders
4. Save Draft: `PUT /api/v1/profile_theme` with current state
5. Publish: `POST /api/v1/profile_theme/publish`
6. Discard: `POST /api/v1/profile_theme/discard_draft`

### 2.6 Unsaved Changes Warning

- Compare current state vs `lastSaved` using deep equality
- Show browser `beforeunload` warning on navigation
- Show dot/badge indicator in top bar

---

## Phase 3: Section Editing & Assets

**Goal:** Add section-specific settings forms, appearance overrides, and asset upload.

### 3.1 Section Settings Forms

**Directory:** `components/SiteBuilder/editor/sections/`

| Component | Fields |
|-----------|--------|
| `HeroSettings.tsx` | Headline (120 char), Subtitle (200 char), CTA text/URL |
| `MusicSettings.tsx` | Embed URLs, Number of releases (3-24) |
| `EventsSettings.tsx` | Number to show (3-12), Show past events toggle |
| `PostsSettings.tsx` | Number to show (3-12) |
| `AboutSettings.tsx` | Body textarea with markdown toolbar (5000 char) |
| `RecommendationsSettings.tsx` | Layout (Grid/List), Number to show (3-24) |
| `MailingListSettings.tsx` | Heading, Description, Provider select, External URL |
| `MerchSettings.tsx` | Heading, Provider select, External URL, Number of items |
| `CustomTextSettings.tsx` | Heading (120 char), Body with markdown (10000 char) |

### 3.2 Section Appearance Overrides

**Component:** `components/SiteBuilder/editor/SectionAppearance.tsx`

Collapsible "Appearance" sub-section in each section card:
- Background color (Use global / Custom toggle)
- Font color (Use global / Custom toggle)
- Background image (Pro only) - opens asset picker

### 3.3 Asset Upload Flow

**Components:**
- `components/SiteBuilder/assets/AssetPickerModal.tsx` - Modal with grid + upload
- `components/SiteBuilder/assets/AssetUploader.tsx` - Dropzone with progress
- `components/SiteBuilder/assets/AssetGrid.tsx` - Thumbnail grid of uploaded assets

**Flow:**
1. Click "Upload image" in section appearance
2. Modal shows existing assets from `GET /api/v1/profile_assets`
3. Select existing or upload new via `POST /api/v1/profile_assets`
4. On select, set `background_image_url` in section settings
5. Preview updates immediately

### 3.4 Markdown Editor

**Component:** `components/SiteBuilder/editor/MarkdownEditor.tsx`

Simple textarea with toolbar buttons:
- Bold, Italic, Link
- Character counter
- Use `react-markdown` for preview (restricted elements: p, strong, em, a, br)

### 3.5 Contrast Checker

**Component:** `components/SiteBuilder/editor/ContrastWarning.tsx`

- Check WCAG 2.1 AA contrast ratio between font and background colors
- Show warning icon with tooltip when contrast is insufficient
- Non-blocking (users can ignore)

---

## Phase 4: Plan Gating & Polish

**Goal:** Enforce plan restrictions, add mobile experience, and polish interactions.

### 4.1 Plan-Based Section Availability

**Logic in `AddSectionButton.tsx`:**
- Fetch section availability from API config
- Show lock icon + "Available on [Plan]" for unavailable types
- Disable "Already added" for singleton sections
- Show count for custom_text ("2 of 3 used")
- Click on locked section → upgrade prompt modal

### 4.2 Downgrade Handling

**Component:** `components/SiteBuilder/DowngradeBanner.tsx`

- Show banner when user has sections requiring higher plan
- "Some sections are hidden because they require a higher plan..."
- Sections preserved in database, hidden from builder

### 4.3 Mobile Builder Experience

**Breakpoint:** < 1024px

- Single-panel mode with Edit/Preview tabs
- Show banner suggesting desktop for best experience
- Tab toggle in header area

### 4.4 Responsive Preview Toggle

**In PreviewToolbar:**
- Desktop button (full width)
- Mobile button (390px constrained)
- Smooth transition between modes

### 4.5 Drag-and-Drop Polish

- Use `@dnd-kit/sortable` for section reordering
- Constrain to vertical axis
- Drop indicator line between cards
- Smooth animation on reorder

### 4.6 Toast Notifications

- Save success: "Draft saved"
- Save failure: "Couldn't save. Please try again."
- Publish success: "Your profile is now live!"
- Publish failure: "Couldn't publish. Please try again."
- Discard success: "Changes discarded"

---

## File Structure Summary

```
apps/web/
├── app/
│   ├── site-builder/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   └── [username]/
│       └── page.tsx (update for themed profiles)
├── components/
│   └── SiteBuilder/
│       ├── sections/
│       │   ├── HeroSection.tsx
│       │   ├── MusicSection.tsx
│       │   ├── EventsSection.tsx
│       │   ├── PostsSection.tsx
│       │   ├── AboutSection.tsx
│       │   ├── RecommendationsSection.tsx
│       │   ├── MailingListSection.tsx
│       │   ├── MerchSection.tsx
│       │   └── CustomTextSection.tsx
│       ├── editor/
│       │   ├── BuilderTopBar.tsx
│       │   ├── GlobalThemeEditor.tsx
│       │   ├── SectionsList.tsx
│       │   ├── SectionCard.tsx
│       │   ├── AddSectionButton.tsx
│       │   ├── ColorPicker.tsx
│       │   ├── FontSelect.tsx
│       │   ├── MarkdownEditor.tsx
│       │   ├── SectionAppearance.tsx
│       │   ├── ContrastWarning.tsx
│       │   └── sections/
│       │       ├── HeroSettings.tsx
│       │       ├── MusicSettings.tsx
│       │       └── ... (one per section type)
│       ├── preview/
│       │   ├── PreviewPanel.tsx
│       │   ├── PreviewToolbar.tsx
│       │   └── PreviewFrame.tsx
│       ├── assets/
│       │   ├── AssetPickerModal.tsx
│       │   ├── AssetUploader.tsx
│       │   └── AssetGrid.tsx
│       ├── ProfileSection.tsx
│       ├── SectionRenderer.tsx
│       ├── ProfileHead.tsx
│       ├── ProfileFooter.tsx
│       ├── BuilderLayout.tsx
│       ├── DowngradeBanner.tsx
│       └── profile-theme.css
└── lib/
    └── site-builder/
        ├── types.ts
        ├── api.ts
        ├── store.ts
        ├── fonts.ts
        └── constants.ts
```

---

## Dependencies to Add

```bash
npm install zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-markdown
```

---

## Implementation Order

### Week 1: Phase 1
- [ ] Create types and API client
- [ ] Build all section components with static props
- [ ] Create ProfileSection wrapper with CSS variables
- [ ] Create SectionRenderer switch component
- [ ] Create profile-theme.css
- [ ] Test sections render correctly with mock data

### Week 2: Phase 2
- [ ] Set up Zustand store
- [ ] Create builder layout (two-panel)
- [ ] Build GlobalThemeEditor with color pickers
- [ ] Build SectionsList with @dnd-kit
- [ ] Create preview panel with scaling
- [ ] Implement save/publish/discard workflow
- [ ] Add unsaved changes detection

### Week 3: Phase 3
- [ ] Build section settings forms for all types
- [ ] Add section appearance overrides
- [ ] Create asset picker modal
- [ ] Implement asset upload flow
- [ ] Add markdown editor with toolbar
- [ ] Add contrast checker

### Week 4: Phase 4
- [ ] Implement plan gating logic
- [ ] Add upgrade prompts
- [ ] Build mobile builder experience
- [ ] Add responsive preview toggle
- [ ] Polish drag-and-drop animations
- [ ] Add toast notifications
- [ ] Testing and bug fixes

---

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/profile_theme` | GET | Fetch theme config |
| `/api/v1/profile_theme` | PUT | Save draft |
| `/api/v1/profile_theme/publish` | POST | Publish draft |
| `/api/v1/profile_theme/discard_draft` | POST | Discard draft |
| `/api/v1/profile_theme/reset` | POST | Reset to defaults |
| `/api/v1/profile_assets` | GET | List uploaded assets |
| `/api/v1/profile_assets` | POST | Upload new asset |
| `/api/v1/profile_assets/:id` | DELETE | Delete asset |
| `/api/v1/profiles/:username` | GET | Public profile with theme |
