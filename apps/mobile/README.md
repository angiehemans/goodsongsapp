# Good Songs Mobile App

React Native mobile app for Good Songs (Android).

## Prerequisites

- Node.js 18+
- pnpm
- Android Studio with Android SDK
- Java 17 (JDK)

## Setup

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Navigate to mobile app
cd apps/mobile
```

## Development

```bash
# Start Metro bundler
pnpm start

# Run on Android emulator/device
pnpm android
```

## Building a Test APK (Android)

### Option 1: Debug APK (Fastest)

Build a debug APK that can be installed directly on your Android phone:

```bash
cd apps/mobile/android

# Build debug APK
./gradlew assembleDebug
```

The APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: Release APK (Optimized)

Build an optimized release APK (smaller, faster):

```bash
cd apps/mobile/android

# Build release APK
./gradlew assembleRelease
```

The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Installing on Your Android Phone

**Method 1: USB Transfer**
1. Connect your phone via USB
2. Copy the APK file to your phone
3. On your phone, open a file manager and tap the APK
4. Enable "Install from unknown sources" if prompted
5. Install the app

**Method 2: ADB Install**
```bash
# Make sure USB debugging is enabled on your phone
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or for release:
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Method 3: Share via Cloud/Email**
1. Upload the APK to Google Drive, Dropbox, or send via email
2. Download it on your phone
3. Tap to install

### Troubleshooting Android

```bash
# Clean build if you encounter issues
pnpm clean
# or
cd android && ./gradlew clean && cd ..

# Check connected devices
adb devices

# View build logs
cd android && ./gradlew assembleDebug --info
```

## Environment Configuration

The app connects to the API based on build configuration:

- **Debug**: Uses development API (configure in `src/utils/api.ts`)
- **Release**: Uses production API

To change the API URL, edit `apps/mobile/src/utils/api.ts`.

## Common Commands

```bash
# Start Metro bundler
pnpm start

# Start with cache clear
pnpm start --reset-cache

# Run Android
pnpm android

# Build release APK
pnpm build:android

# Clean Android build
pnpm clean

# Lint code
pnpm lint

# Type check
pnpm typecheck
```

## Project Structure

```
apps/mobile/
├── android/          # Android native code
├── src/
│   ├── components/   # Reusable UI components
│   ├── screens/      # Screen components
│   ├── navigation/   # React Navigation setup
│   ├── context/      # Zustand stores
│   ├── utils/        # API client, helpers
│   └── theme/        # Colors, fonts, spacing
├── assets/           # Images, fonts
└── index.js          # App entry point
```
