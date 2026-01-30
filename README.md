# GoodSongs

A platform for music lovers to discover, review, and share songs with friends. GoodSongs connects fans with bands and creates a community around music discovery.

## Project Structure

This is a monorepo powered by [Turborepo](https://turbo.build/) and [pnpm](https://pnpm.io/).

```
goodsongs/
├── apps/
│   ├── web/                    # Next.js web application
│   └── mobile/                 # React Native mobile app (coming soon)
├── packages/
│   ├── tokens/                 # Shared design tokens (colors, typography, spacing)
│   ├── api-client/             # Shared API types, schemas, and utilities
│   └── config/                 # Shared TypeScript configurations
```

## Apps

### Web (`apps/web`)

The main GoodSongs web application built with:

- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [Mantine 8](https://mantine.dev/) - UI component library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [SWR](https://swr.vercel.app/) - Data fetching

**Features:**
- User authentication (fan and band accounts)
- Song reviews and recommendations
- Band profiles and management
- Event listings
- Last.fm integration for recently played tracks
- Social features (follow users, activity feed, notifications)
- Admin dashboard

### Mobile (`apps/mobile`)

React Native mobile app for Android, built with:

- [React Native](https://reactnative.dev/) 0.78+ with Hermes
- [React Navigation](https://reactnavigation.org/) - Navigation (stack + bottom tabs)
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [react-native-bootsplash](https://github.com/zoontek/react-native-bootsplash) - Splash screen

**Features:**
- User and band authentication
- Song recommendations and discovery feed
- Music scrobbling via Android notification listener (Spotify, YouTube Music, Tidal, Amazon Music, Apple Music)
- Background scrobble capture with sync-on-open
- Last.fm integration for recently played tracks
- Band profiles, events, and dashboards
- Push notifications
- Profile editing

## Shared Packages

### `@goodsongs/tokens`

Design system tokens shared across web and mobile:
- Color palettes (grape, blue, grey)
- Typography (fonts, sizes, weights)
- Spacing scale
- Border radii

### `@goodsongs/api-client`

Shared API layer:
- TypeScript interfaces for all API entities
- Zod validation schemas
- Utility functions

### `@goodsongs/config`

Shared configurations:
- TypeScript base config
- Next.js TypeScript config
- React Native TypeScript config

## Getting Started

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- pnpm 9+

```bash
# Install pnpm if you don't have it
npm install -g pnpm
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/goodsongsapp.git
cd goodsongsapp

# Install dependencies
pnpm install
```

### Environment Setup

Create a `.env.local` file in `apps/web/`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit the file with your API URL and other configuration.

## Development

### Run all apps

```bash
pnpm dev
```

### Run only the web app

```bash
pnpm dev --filter=@goodsongs/web

# Or from the web directory
cd apps/web
pnpm dev
```

The web app runs at [http://localhost:3001](http://localhost:3001)

### Run the mobile app on a tethered Android device

#### Prerequisites

1. **Enable Developer Options on your Android phone:**
   - Go to Settings > About Phone
   - Tap "Build number" 7 times to enable Developer Options

2. **Enable USB Debugging:**
   - Go to Settings > Developer Options
   - Enable "USB debugging"

3. **Install Android SDK and ADB:**
   - Install [Android Studio](https://developer.android.com/studio) or just the [command line tools](https://developer.android.com/studio#command-tools)
   - Ensure `adb` is in your PATH

#### Connect and run

```bash
# Connect your phone via USB and verify it's detected
adb devices

# You should see your device listed, e.g.:
# List of devices attached
# XXXXXXXXXX    device

# Navigate to the mobile app
cd apps/mobile

# Install dependencies (if not already done)
pnpm install

# Run on the connected Android device
pnpm android
```

#### Connecting to a local API server

If your Rails API is running locally and you need the phone to access it:

```bash
# Set up reverse port forwarding (replace 3000 with your API port)
adb reverse tcp:3000 tcp:3000

# Now the phone can access your local API at http://localhost:3000
```

#### Troubleshooting

- **Device not detected:** Try a different USB cable (some cables are charge-only). Also try `adb kill-server && adb start-server`
- **USB debugging prompt:** When you first connect, accept the "Allow USB debugging" prompt on your phone
- **Build errors:** Run `cd apps/mobile/android && ./gradlew clean` then try again

## Building

### Build all packages and apps

```bash
pnpm build
```

### Build only the web app

```bash
pnpm build --filter=@goodsongs/web
```

### Build the mobile app (Android)

#### Prerequisites

- Java Development Kit (JDK) 17
- Android SDK (via [Android Studio](https://developer.android.com/studio) or command-line tools)
- `ANDROID_HOME` environment variable set to your SDK path
- Android build tools and platform for API 35

#### Debug build

```bash
cd apps/mobile

# Install dependencies
pnpm install

# Build and install on a connected device or emulator
pnpm android
```

This starts Metro bundler and installs the debug APK. Make sure you have a device connected (`adb devices`) or an emulator running.

#### Release build

```bash
cd apps/mobile/android

# Generate a release APK
./gradlew assembleRelease

# The APK will be at:
# app/build/outputs/apk/release/app-release.apk
```

> **Note:** Release builds require a signing keystore. See the [React Native docs on signed APKs](https://reactnative.dev/docs/signed-apk-android) for setup.

#### Regenerating splash screen assets

If you update the splash logo, regenerate the native assets:

```bash
cd apps/mobile
npx react-native-bootsplash generate assets/images/loading.png \
  --platforms=android \
  --background='#0124B0' \
  --logo-width=88
```

## Testing

### Run all tests

```bash
pnpm test
```

### Run tests for the web app

```bash
pnpm test --filter=@goodsongs/web
```

### Individual test commands (from `apps/web/`)

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Jest tests
pnpm jest

# Jest in watch mode
pnpm jest:watch

# Prettier check
pnpm prettier:check

# Format with Prettier
pnpm prettier:write
```

## Other Commands

### Storybook

```bash
cd apps/web
pnpm storybook
```

Storybook runs at [http://localhost:6006](http://localhost:6006)

### Bundle Analysis

```bash
cd apps/web
pnpm analyze
```

### Clean

Remove all `node_modules` and build artifacts:

```bash
pnpm clean
```

## Deployment

### Vercel (Web)

The web app is configured for Vercel deployment. The `vercel.json` at the root handles the monorepo setup automatically.

**Manual Vercel configuration:**
- Root Directory: `apps/web`
- Build Command: `pnpm build --filter=@goodsongs/web`
- Install Command: `pnpm install`

## Tech Stack

| Category | Technology |
|----------|------------|
| Monorepo | Turborepo, pnpm workspaces |
| Web Framework | Next.js 15 (App Router) |
| Mobile Framework | React Native 0.78+ (Hermes) |
| UI Library | Mantine 8 (web) |
| Navigation | React Navigation (mobile) |
| State Management | SWR (web), Zustand (mobile) |
| Styling | PostCSS, CSS Modules |
| Language | TypeScript, Kotlin |
| Validation | Zod |
| Testing | Jest, React Testing Library |
| Storybook | Storybook 8 |
| Linting | ESLint, Stylelint, Prettier |

## License

See [LICENCE](./LICENCE) for details.
