# CLAUDE.md

## Getting Started

- Always check `API_DOCUMENTATION.md` in this directory for API reference and usage details before making changes.
- This is a **Turborepo monorepo** using **pnpm** (v9.15.0) as the package manager.
- Run `pnpm dev` from the root to start all apps, or `pnpm --filter @goodsongs/web dev` / `pnpm --filter @goodsongs/mobile dev` for individual apps.
- Copy `apps/web/.env.example` to `apps/web/.env.local` and configure before running.

## Monorepo Structure

```
apps/
  web/          → Next.js 15 (App Router) — runs on port 3001
  mobile/       → React Native (bare, not Expo)
packages/
  api-client/   → Shared API types & Zod schemas
  tokens/       → Shared design tokens (colors, typography, spacing)
  config/       → Shared TypeScript configs
```

## Web App (`apps/web`) — Best Practices

- **Routing**: Use the App Router (`/app` directory) only. Do not create Pages Router files.
- **UI Components**: Use **Mantine v8** components. Do not introduce other component libraries.
- **Styling**: Use **CSS Modules** with the Mantine PostCSS preset. No Tailwind.
- **State Management**: Use **Zustand** for global/client state and **SWR** for server data fetching.
- **Icons**: Use **Tabler Icons** (`@tabler/icons-react`). Do not add other icon libraries.
- **Forms**: Use `@mantine/form` for form handling.
- **Rich Text**: TipTap is used for rich text editing.
- **Drag & Drop**: `@dnd-kit` is the drag-and-drop solution.
- **Testing**: Jest + React Testing Library.

## Mobile App (`apps/mobile`) — Best Practices

- **Navigation**: Use **React Navigation v7** (native-stack and bottom-tabs).
- **Styling**: Use React Native **StyleSheet API**. No external styling libraries.
- **State Management**: Use **Zustand** (same as web) with **AsyncStorage** for persistence.
- **Icons**: Use **Tabler Icons** (`@tabler/icons-react-native`).
- **Images**: Use `react-native-fast-image` for performant image loading.
- **Push Notifications**: Firebase Messaging (`@react-native-firebase`).

## Shared Packages — Best Practices

- **Design Tokens**: Import colors, typography, spacing, and radii from `@goodsongs/tokens`. Do not hardcode design values.
- **API Types & Validation**: Import types and Zod schemas from `@goodsongs/api-client`. Keep API contracts in sync here.
- **TypeScript Config**: Extend from `@goodsongs/config` presets (`base`, `nextjs`, or `react-native`).

## General Rules

- Turbo tasks (`build`, `lint`, `test`, `typecheck`) depend on upstream package builds — always run from root or let Turbo handle ordering.
- Keep shared logic in `packages/` when used by both apps. App-specific code stays in its respective `apps/` directory.
- Use TypeScript everywhere. No plain JavaScript files.
