# Push Notifications Setup Guide

This guide covers setting up push notifications for the GoodSongs mobile app using Firebase Cloud Messaging (FCM) and Ruby on Rails.

## Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Rails API  │────▶│   Firebase  │────▶│  Mobile App │
│  (sender)   │     │     FCM     │     │  (receiver) │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. Mobile app registers with FCM and receives a device token
2. App sends the token to Rails backend (stored in Postgres)
3. When events occur (new follower, like, comment), Rails sends notification to FCM
4. FCM delivers the push notification to the device

---

## Part 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "GoodSongs" (or similar)
4. Disable Google Analytics (optional, not needed for push notifications)
5. Click "Create project"

### 1.2 Add Android App to Firebase

1. In Firebase Console, click "Add app" → Android icon
2. Enter package name: `com.goodsongs.mobile` (check `android/app/build.gradle` for exact name)
3. Enter app nickname: "GoodSongs Android"
4. Click "Register app"
5. Download `google-services.json`
6. Place it in `apps/mobile/android/app/google-services.json`

### 1.3 Get Server Key for Rails

1. In Firebase Console → Project Settings → Cloud Messaging tab
2. If "Cloud Messaging API (Legacy)" is disabled, click the three dots and enable it
3. Copy the **Server Key** - you'll need this for Rails

---

## Part 2: Android App Setup

### 2.1 Install Dependencies

```bash
cd apps/mobile
pnpm add @react-native-firebase/app @react-native-firebase/messaging
```

### 2.2 Configure Android

**android/build.gradle** - Add Google services plugin:

```gradle
buildscript {
    dependencies {
        // ... existing dependencies
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

**android/app/build.gradle** - Apply plugin at bottom:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 2.3 Add Firebase Messaging to App

Create `apps/mobile/src/utils/pushNotifications.ts`:

```typescript
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { apiClient } from './api';

export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  return enabled;
}

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Push notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    // Send token to backend
    await apiClient.registerDeviceToken(token, Platform.OS);

    return token;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return null;
  }
}

export function setupNotificationHandlers() {
  // Handle notification when app is in foreground
  messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground notification:', remoteMessage);
    // You can show an in-app alert or update the notification badge
  });

  // Handle notification tap when app is in background
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened app:', remoteMessage);
    // Navigate to relevant screen based on notification data
  });

  // Handle notification tap when app was closed
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened from notification:', remoteMessage);
        // Navigate to relevant screen
      }
    });

  // Listen for token refresh
  messaging().onTokenRefresh(async (token) => {
    await apiClient.registerDeviceToken(token, Platform.OS);
  });
}
```

### 2.4 Add API Method for Device Token

Add to `apps/mobile/src/utils/api.ts`:

```typescript
async registerDeviceToken(token: string, platform: string): Promise<void> {
  return this.request('/device_tokens', {
    method: 'POST',
    body: JSON.stringify({
      device_token: {
        token,
        platform,
      },
    }),
  });
}

async unregisterDeviceToken(token: string): Promise<void> {
  return this.request('/device_tokens', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
}
```

### 2.5 Initialize in App

In `apps/mobile/src/navigation/AppNavigator.tsx`, add after authentication:

```typescript
import { registerForPushNotifications, setupNotificationHandlers } from '@/utils/pushNotifications';

// Inside AppNavigator component, after user is authenticated:
useEffect(() => {
  if (isAuthenticated) {
    registerForPushNotifications();
    setupNotificationHandlers();
  }
}, [isAuthenticated]);
```

---

## Part 3: Rails Backend Setup

### 3.1 Install FCM Gem

Add to `Gemfile`:

```ruby
gem 'fcm'
```

Run `bundle install`

### 3.2 Create Device Tokens Table

```bash
rails generate migration CreateDeviceTokens
```

Edit the migration:

```ruby
class CreateDeviceTokens < ActiveRecord::Migration[7.0]
  def change
    create_table :device_tokens do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token, null: false
      t.string :platform, null: false  # 'ios' or 'android'
      t.datetime :last_used_at
      t.timestamps
    end

    add_index :device_tokens, :token, unique: true
    add_index :device_tokens, [:user_id, :platform]
  end
end
```

Run `rails db:migrate`

### 3.3 Create DeviceToken Model

`app/models/device_token.rb`:

```ruby
class DeviceToken < ApplicationRecord
  belongs_to :user

  validates :token, presence: true, uniqueness: true
  validates :platform, presence: true, inclusion: { in: %w[ios android] }

  scope :active, -> { where('last_used_at > ?', 30.days.ago) }
end
```

Add to `app/models/user.rb`:

```ruby
has_many :device_tokens, dependent: :destroy
```

### 3.4 Create Device Tokens Controller

`app/controllers/api/v1/device_tokens_controller.rb`:

```ruby
module Api
  module V1
    class DeviceTokensController < ApplicationController
      before_action :authenticate_user!

      def create
        token = current_user.device_tokens.find_or_initialize_by(
          token: device_token_params[:token]
        )
        token.platform = device_token_params[:platform]
        token.last_used_at = Time.current

        if token.save
          render json: { message: 'Device registered' }, status: :ok
        else
          render json: { errors: token.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        token = current_user.device_tokens.find_by(token: params[:token])
        token&.destroy
        render json: { message: 'Device unregistered' }, status: :ok
      end

      private

      def device_token_params
        params.require(:device_token).permit(:token, :platform)
      end
    end
  end
end
```

Add route in `config/routes.rb`:

```ruby
namespace :api do
  namespace :v1 do
    resources :device_tokens, only: [:create, :destroy]
  end
end
```

### 3.5 Create Push Notification Service

`app/services/push_notification_service.rb`:

```ruby
class PushNotificationService
  def initialize
    @fcm = FCM.new(
      ENV['FIREBASE_SERVER_KEY'],
      # For FCM v1 API (recommended):
      # json_key_path: Rails.root.join('config', 'firebase-service-account.json'),
      # project_name: 'your-project-id'
    )
  end

  def send_to_user(user, title:, body:, data: {})
    tokens = user.device_tokens.active.pluck(:token)
    return if tokens.empty?

    send_to_tokens(tokens, title: title, body: body, data: data)
  end

  def send_to_tokens(tokens, title:, body:, data: {})
    return if tokens.empty?

    notification = {
      title: title,
      body: body
    }

    response = @fcm.send_v1(
      tokens,
      notification: notification,
      data: data.transform_values(&:to_s)
    )

    handle_response(response)
  end

  private

  def handle_response(response)
    # Remove invalid tokens
    if response[:not_registered_ids].present?
      DeviceToken.where(token: response[:not_registered_ids]).destroy_all
    end

    response
  end
end
```

### 3.6 Add Environment Variable

Add to your environment (`.env` or Rails credentials):

```
FIREBASE_SERVER_KEY=your_server_key_here
```

### 3.7 Send Notifications from Models/Jobs

Create a job for sending notifications:

`app/jobs/send_push_notification_job.rb`:

```ruby
class SendPushNotificationJob < ApplicationJob
  queue_as :default

  def perform(user_id, title:, body:, data: {})
    user = User.find_by(id: user_id)
    return unless user

    PushNotificationService.new.send_to_user(
      user,
      title: title,
      body: body,
      data: data
    )
  end
end
```

### 3.8 Trigger Notifications on Events

Update your notification creation logic to also send push notifications.

Example in a callback or service:

```ruby
# When creating a follow notification
def notify_new_follower(follower, followed_user)
  # Create in-app notification (existing logic)
  notification = followed_user.notifications.create!(
    notification_type: 'new_follower',
    actor: follower,
    message: "#{follower.username} started following you"
  )

  # Send push notification
  SendPushNotificationJob.perform_later(
    followed_user.id,
    title: 'New Follower',
    body: "#{follower.username} started following you",
    data: {
      type: 'new_follower',
      notification_id: notification.id.to_s,
      actor_username: follower.username
    }
  )
end

# When someone likes a review
def notify_review_like(liker, review)
  return if liker.id == review.user_id  # Don't notify self

  notification = review.user.notifications.create!(
    notification_type: 'review_like',
    actor: liker,
    review: review,
    message: "#{liker.username} liked your recommendation"
  )

  SendPushNotificationJob.perform_later(
    review.user_id,
    title: 'New Like',
    body: "#{liker.username} liked your recommendation of #{review.song_name}",
    data: {
      type: 'review_like',
      notification_id: notification.id.to_s,
      review_id: review.id.to_s
    }
  )
end

# When someone comments on a review
def notify_review_comment(commenter, comment)
  review = comment.review
  return if commenter.id == review.user_id  # Don't notify self

  notification = review.user.notifications.create!(
    notification_type: 'review_comment',
    actor: commenter,
    review: review,
    comment: comment,
    message: "#{commenter.username} commented on your recommendation"
  )

  SendPushNotificationJob.perform_later(
    review.user_id,
    title: 'New Comment',
    body: "#{commenter.username}: \"#{comment.body.truncate(50)}\"",
    data: {
      type: 'review_comment',
      notification_id: notification.id.to_s,
      review_id: review.id.to_s,
      comment_id: comment.id.to_s
    }
  )
end
```

---

## Part 4: Testing

### 4.1 Test FCM Connection

In Rails console:

```ruby
fcm = FCM.new(ENV['FIREBASE_SERVER_KEY'])
# Use a real device token from your database
token = DeviceToken.last.token
response = fcm.send_v1(
  [token],
  notification: { title: 'Test', body: 'Hello from Rails!' }
)
puts response
```

### 4.2 Test from Mobile App

1. Build and run the app: `pnpm android`
2. Log in and check Metro logs for "FCM Token: ..."
3. Verify token is saved in database: `DeviceToken.last`
4. Send a test notification from Rails console

---

## Part 5: iOS Setup (Optional)

For iOS, you'll also need:

1. Apple Developer account ($99/year)
2. Create APNs key in Apple Developer portal
3. Upload APNs key to Firebase Console
4. Add `@react-native-firebase/messaging` iOS configuration
5. Update `ios/Podfile` and run `pod install`

See: https://rnfirebase.io/messaging/usage/ios-setup

---

## Troubleshooting

### Token not registering
- Check that `google-services.json` is in the correct location
- Ensure the package name matches your Firebase app

### Notifications not arriving
- Verify the server key is correct
- Check if the device token is valid (not expired)
- Test with Firebase Console's "Cloud Messaging" → "Send test message"

### Background notifications not working
- Android: Check battery optimization settings
- Ensure the app has notification permissions

---

## Security Considerations

1. **Never expose the Firebase Server Key** in client code
2. **Validate user ownership** before sending notifications
3. **Rate limit** notification sending to prevent abuse
4. **Clean up old tokens** periodically (tokens expire/change)

---

## Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/messaging/usage)
- [FCM Ruby Gem](https://github.com/decision-labs/fcm)
