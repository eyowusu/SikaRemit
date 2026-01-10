# SikaRemit Mobile App

A modern, cross-platform mobile application for SikaRemit - a comprehensive financial technology platform for payments, remittances, and bill payments.

## 🚀 Features

- **Authentication**
  - Email/Password login and registration
  - Biometric authentication (Face ID / Fingerprint)
  - Password reset functionality
  - Two-factor authentication support

- **Dashboard**
  - Real-time wallet balance
  - Quick action shortcuts
  - Recent transactions overview
  - Promotional banners

- **Payments**
  - Send money to contacts
  - Request money
  - Bill payments (Electricity, Water, Internet, TV, Insurance, Education)
  - International remittance
  - Mobile top-up
  - QR code payments

- **Transactions**
  - Full transaction history
  - Filter by transaction type
  - Transaction details

- **Profile & Settings**
  - Profile management
  - KYC verification
  - Security settings (Password, 2FA, Biometrics)
  - Theme customization (Light/Dark mode)
  - Notification preferences

## 📱 Tech Stack

- **Framework**: React Native 0.72.6 with Expo SDK 49
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Animations**: React Native Reanimated
- **UI Components**: Custom components with Expo Vector Icons
- **Secure Storage**: Expo SecureStore
- **Biometrics**: Expo Local Authentication

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **Expo Go** app on your mobile device (for testing)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

For development builds:
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)

## 🛠️ Installation

1. **Navigate to the mobile app directory**:
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   or with yarn:
   ```bash
   yarn install
   ```

3. **Configure environment** (optional):
   Update the API base URL in `src/constants/api.ts` if needed:
   ```typescript
   export const API_CONFIG = {
     BASE_URL: 'https://api.sikaremit.com',
     // ... other config
   };
   ```

## 🚀 Running the App

### Development Mode

1. **Start the Expo development server**:
   ```bash
   npx expo start
   ```

2. **Run on your device**:
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator

### Platform-Specific Commands

```bash
# Run on Android
npx expo start --android

# Run on iOS (macOS only)
npx expo start --ios

# Run on web
npx expo start --web
```

### Development Build (for native features)

```bash
# Create development build for Android
npx expo run:android

# Create development build for iOS
npx expo run:ios
```

## 📁 Project Structure

```
mobile-app/
├── App.tsx                 # Root component
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
├── babel.config.js        # Babel configuration
└── src/
    ├── components/        # Reusable UI components
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Input.tsx
    │       ├── Card.tsx
    │       └── index.ts
    ├── constants/         # App constants
    │   ├── api.ts         # API endpoints
    │   └── theme.ts       # Theme configuration
    ├── context/           # React contexts
    │   └── ThemeContext.tsx
    ├── navigation/        # Navigation configuration
    │   ├── RootNavigator.tsx
    │   ├── AuthNavigator.tsx
    │   └── MainNavigator.tsx
    ├── screens/           # Screen components
    │   ├── auth/
    │   │   ├── WelcomeScreen.tsx
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── ForgotPasswordScreen.tsx
    │   ├── home/
    │   │   ├── DashboardScreen.tsx
    │   │   └── NotificationsScreen.tsx
    │   ├── payments/
    │   │   ├── PaymentsHomeScreen.tsx
    │   │   ├── SendMoneyScreen.tsx
    │   │   ├── BillPaymentScreen.tsx
    │   │   └── RemittanceScreen.tsx
    │   ├── transactions/
    │   │   └── TransactionHistoryScreen.tsx
    │   └── profile/
    │       ├── ProfileHomeScreen.tsx
    │       ├── SettingsScreen.tsx
    │       ├── SecurityScreen.tsx
    │       └── KYCVerificationScreen.tsx
    ├── services/          # API services
    │   ├── api.ts         # Axios instance
    │   ├── authService.ts
    │   └── paymentService.ts
    ├── store/             # Zustand stores
    │   ├── authStore.ts
    │   └── walletStore.ts
    └── types/             # TypeScript types
        └── index.ts
```

## 🎨 Theming

The app supports both light and dark themes. Theme configuration is in `src/constants/theme.ts`.

To toggle theme programmatically:
```typescript
import { useTheme } from '../context/ThemeContext';

const { setThemeMode } = useTheme();
setThemeMode('dark'); // 'light' | 'dark' | 'system'
```

## 🔐 Security

- JWT tokens stored securely using Expo SecureStore
- Automatic token refresh on expiration
- Biometric authentication support
- Secure password handling

## 🔗 API Integration

The app integrates with the SikaRemit backend API. Key endpoints:

- **Authentication**: `/api/v1/accounts/`
- **Payments**: `/api/v1/payments/`
- **Users**: `/api/v1/users/`
- **KYC**: `/api/v1/kyc/`
- **Notifications**: `/api/v1/notifications/`

## 📦 Building for Production

### Android APK/AAB

```bash
# Build APK
npx expo build:android -t apk

# Build AAB (for Play Store)
npx expo build:android -t app-bundle
```

### iOS IPA

```bash
npx expo build:ios
```

### EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler cache issues**:
   ```bash
   npx expo start --clear
   ```

2. **Node modules issues**:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **iOS pod issues** (macOS):
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Android build issues**:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

## 📄 License

This project is proprietary software owned by SikaRemit.

## 👥 Support

For support, contact the SikaRemit development team or open an issue in the repository.

---

Built with ❤️ by the SikaRemit Team
