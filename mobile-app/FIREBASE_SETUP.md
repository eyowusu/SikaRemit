# Firebase Configuration Guide

## Steps to Configure Firebase for Push Notifications

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select existing project
3. Enable Cloud Messaging (FCM)

### 2. Add Mobile App to Firebase
#### For Android:
1. In Firebase Console, go to Project Settings
2. Click "Add app" → Android
3. Package name: `com.sikaremit.app`
4. Download `google-services.json`
5. Place in `mobile-app/android/app/`

#### For iOS:
1. In Firebase Console, go to Project Settings  
2. Click "Add app" → iOS
3. Bundle ID: `com.sikaremit.app`
4. Download `GoogleService-Info.plist`
5. Place in `mobile-app/ios/`

### 3. Update app.json
Add Firebase configuration to your app.json:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#7C3AED",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### 4. Update .env File
Replace the placeholder values in .env:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your-actual-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-actual-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# Expo Project ID (get from Expo Dashboard)
EXPO_PROJECT_ID=your-actual-expo-project-id
```

### 5. Test Push Notifications
After configuration, test notifications:

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Test on device (notifications only work on physical devices)
```

### 6. Backend Integration
Ensure your backend can send push notifications via FCM:

```javascript
// Example backend notification payload
{
  "to": "exponent_push_token[...]",
  "title": "Payment Received",
  "body": "You received GHS 100.00",
  "data": {
    "type": "transaction",
    "transaction_id": "tx_123456"
  },
  "sound": "default",
  "priority": "high"
}
```

## Security Notes
- Never expose Firebase private keys in client code
- Use Firebase Cloud Functions for secure notification sending
- Validate notification content on backend before sending
- Implement proper user consent for notifications

## Troubleshooting
- Notifications only work on physical devices, not simulators
- Check Firebase project settings for correct bundle/package IDs
- Verify notification permissions are granted
- Check Expo dashboard for correct project ID
