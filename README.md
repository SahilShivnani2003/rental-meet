# RentalMeet

> A modern, full-featured React Native mobile application for venue discovery, booking, and management. RentalMeet connects venue owners with customers, enabling seamless booking experiences with integrated payment processing, real-time chat, and comprehensive venue management.

![React Native](https://img.shields.io/badge/React%20Native-0.83.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-%5E5.0-3178c6)
![License](https://img.shields.io/badge/License-MIT-green)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)
- [Key Features Documentation](#key-features-documentation)
- [API Integration](#api-integration)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## 🎯 Overview

RentalMeet is a comprehensive mobile platform built with React Native that revolutionizes the venue rental industry. The application provides a dual-role experience for both customers seeking venues and vendors managing their properties. With features including advanced search, real-time chat, secure payment processing via Razorpay, and comprehensive booking management, RentalMeet delivers an enterprise-grade solution for the venue booking ecosystem.

### Key Highlights
- **Cross-Platform**: Native support for both Android and iOS
- **TypeScript**: Fully typed codebase for enhanced reliability
- **Real-Time Communication**: Integrated chat system for vendor-customer interaction
- **Secure Payments**: PCI-compliant payment processing with Razorpay integration
- **State Management**: Modern state management with Zustand and TanStack Query
- **Responsive Design**: Optimized UI components for all device sizes

---

## ✨ Features

### User Features
- **Authentication & Authorization**
  - Secure login/signup system
  - Role-based access control (Customer/Vendor)
  - Session management with async storage

- **Venue Discovery**
  - Advanced search and filtering by type, location, amenities
  - Featured venue cards and recommendations
  - Venue ratings and reviews
  - Photo galleries and detailed venue information

- **Booking Management**
  - Real-time availability checking
  - Flexible booking customization
  - Booking history and status tracking
  - Cancellation and modification capabilities

- **Communication**
  - Real-time chat with venue owners
  - Message persistence
  - Notification system

- **Payment Processing**
  - Secure checkout with Razorpay
  - Multiple payment methods support
  - Invoice generation
  - Coupon and discount application

- **User Profile & Preferences**
  - Favorite venues (wishlist)
  - Booking history
  - Profile management
  - Device preferences

### Vendor Features
- **Venue Management**
  - Create and manage venue listings
  - Inventory and availability management
  - Pricing and discount management
  - Document and certificate uploads

- **Booking Dashboard**
  - Real-time booking requests
  - Customer communication
  - Booking confirmation and management

- **Analytics & Reporting**
  - Revenue tracking
  - Booking statistics
  - Customer ratings and reviews management

---

## 🛠️ Tech Stack

### Frontend
- **React Native** (v0.83.1) - Cross-platform mobile framework
- **TypeScript** - Strongly typed JavaScript
- **React Navigation** - Navigation & routing
  - Native Stack Navigator
  - Bottom Tab Navigator
- **TanStack Query (React Query)** - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client for API communication

### UI & UX
- **React Native Vector Icons** - Icon library
- **React Native Safe Area Context** - Safe area handling
- **React Native Screens** - Native screen navigation
- **React Native Community Date Time Picker** - Date/time selection
- **React Native Image Picker** - Media selection
- **React Native Document Picker** - File uploads

### Native Modules & Services
- **Razorpay** - Payment processing
- **Geolocation** - Location services
- **Permissions** - Native permissions handling
- **Device Info** - Device information
- **Async Storage** - Local data persistence
- **React Native Config** - Environment configuration

### Development & Testing
- **Jest** - Unit testing framework
- **Babel** - JavaScript transpiler
- **Metro** - React Native bundler
- **ESLint** - Code quality & linting

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) or **Yarn** (v3 or higher)
- **Git** - [Download](https://git-scm.com/)

### For Android Development
- **Android Studio** (v2024.1 or higher) - [Download](https://developer.android.com/studio)
- **JDK 17** or higher
- **Android SDK** with:
  - Minimum SDK: Android 6.0 (API 23)
  - Target SDK: Latest stable

### For iOS Development
- **Xcode** (v14 or higher) - [Download](https://developer.apple.com/xcode/)
- **CocoaPods** (v1.13 or higher) - Run `sudo gem install cocoapods`
- **macOS** 12 or higher

### Optional
- **Watchman** - Recommended for improved development experience
  - On macOS: `brew install watchman`
  - On Windows: Not required, but optional

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rental-meet.git
cd rental-meet
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# OR using Yarn
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with required configuration:

```env
# API Configuration
API_BASE_URL=https://api.rentalmeet.com
API_TIMEOUT=30000

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# App Configuration
APP_ENV=development
LOG_LEVEL=debug
```

Refer to `.env.example` for a complete template.

---

## 🚀 Development Setup

### Quick Start

The fastest way to get the app running:

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run on Android or iOS (in new terminal)
npm run android    # For Android
# OR
npm run ios        # For iOS
```

### Android Setup

```bash
# Install dependencies (if not done via npm install)
npm install

# Run on Android device/emulator
npm run android

# Or build APK for testing
./gradlew assembleDebug
```

### iOS Setup

```bash
# Install CocoaPods dependencies (required first time only)
cd ios
bundle install
bundle exec pod install
cd ..

# Run on iOS simulator
npm run ios

# Or open Xcode for development
open ios/RentalMeet.xcworkspace
```

**Note**: Always use the `.xcworkspace` file in Xcode, not the `.xcodeproj` file.

### Starting Metro Dev Server

The Metro dev server provides hot reloading and fast refresh:

```bash
npm start
```

Options:
- Press `a` to open Android emulator
- Press `i` to open iOS simulator
- Press `r` to reload the app
- Press `m` to open the dev menu
- Press `q` to quit

---

## 📁 Project Structure

```
rental-meet/
├── src/
│   ├── assets/                 # Images, fonts, and static assets
│   ├── components/             # Reusable UI components
│   │   ├── customAlert.tsx
│   │   ├── not-authenticated.tsx
│   │   ├── booking/           # Booking-related components
│   │   ├── bottomTab/         # Bottom navigation components
│   │   ├── landing/           # Landing screen components
│   │   ├── registerType/      # Registration flow components
│   │   ├── UI/                # Shared UI components
│   │   └── venues/            # Venue display components
│   ├── context/                # React Context for state
│   ├── features/               # Feature-based modules
│   │   ├── auth/              # Authentication
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── service/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   └── data/
│   │   ├── booking/           # Booking management
│   │   ├── chat/              # Real-time messaging
│   │   ├── coupon/            # Discount codes
│   │   ├── dashboard/         # User dashboard
│   │   ├── favorite/          # Favorites/Wishlist
│   │   ├── profile/           # User profile
│   │   ├── quotation/         # Quotations
│   │   ├── review/            # Reviews & ratings
│   │   ├── vendor/            # Vendor management
│   │   ├── venue/             # Venue details
│   │   └── venueType/         # Venue categories
│   ├── hooks/                  # Custom React hooks
│   ├── navigations/            # Navigation configuration
│   ├── screens/                # Root screens
│   ├── service/                # API & external services
│   │   ├── apiClient.ts
│   │   └── queryClient.ts
│   ├── store/                  # Zustand stores
│   ├── theme/                  # Theme & styling
│   ├── types/                  # TypeScript type definitions
│   └── Data/                   # Static data
├── android/                    # Android native code
├── ios/                        # iOS native code
├── __tests__/                  # Test files
├── App.tsx                     # Root component
├── app.json                    # App configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── metro.config.js             # Metro bundler config
├── babel.config.js             # Babel config
└── jest.config.js              # Jest test config
```

### Feature-Based Architecture

Each feature module follows this structure:

```
feature/
├── screens/          # Screen components
├── components/       # Feature-specific components
├── service/         # API calls and business logic
├── hooks/           # Custom hooks for the feature
├── types/           # TypeScript types & interfaces
├── data/            # Static data & constants
└── store/           # Zustand stores (if needed)
```

---

## ▶️ Running the Application

### Development Mode

```bash
# 1. Start Metro dev server
npm start

# 2. In another terminal, run on your target platform:

# Android
npm run android

# iOS
npm run ios
```

### Running on Physical Devices

#### Android Device
1. Enable USB debugging on your device
2. Connect via USB
3. Run: `npm run android`

#### iOS Device
1. Connect device via USB
2. In Xcode: Select your device in the scheme selector
3. Press Play or use: `npm run ios`

### Development Menu

Access the dev menu by:
- **Android**: Press `Ctrl + M` (Windows) or `Cmd + M` (macOS)
- **iOS**: Press `Cmd + D`

From the dev menu, you can:
- Enable Debug Mode
- Show Inspector
- Toggle Performance Monitor
- Reload JS
- Start Profiling

---

## 🏗️ Building for Production

### Android APK/AAB Build

```bash
cd android

# Build APK for testing
./gradlew assembleRelease

# Build App Bundle for Google Play
./gradlew bundleRelease

cd ..
```

Output files:
- APK: `android/app/build/outputs/apk/release/`
- AAB: `android/app/build/outputs/bundle/release/`

### iOS Build for App Store

```bash
# Option 1: Using Xcode
open ios/RentalMeet.xcworkspace
# Then use Product > Archive

# Option 2: Using command line
cd ios
xcodebuild -workspace RentalMeet.xcworkspace \
  -scheme RentalMeet \
  -configuration Release \
  -archivePath ./build/RentalMeet.xcarchive \
  archive
cd ..
```

### Build Configuration

Update version and build number in:
- `app.json` - App metadata
- `android/app/build.gradle` - Android versioning
- `ios/RentalMeet.xcodeproj` - iOS versioning

---

## 🎨 Key Features Documentation

### Authentication Flow
- Located in `src/features/auth/`
- Supports email/password and social login
- Token-based session management with AsyncStorage
- Automatic token refresh and logout on expiration

### Venue Booking System
- Located in `src/features/booking/`
- Real-time availability checking
- Multi-step booking process with validation
- Booking state management via Zustand

### Real-Time Chat
- Located in `src/features/chat/`
- WebSocket-based messaging
- Message persistence
- Notification integration

### Payment Integration
- Razorpay integration for secure payments
- PCI compliant checkout flow
- Multiple payment method support
- Receipt and invoice generation

### State Management
- **Zustand**: Client-side state (auth, user preferences)
- **TanStack Query**: Server state (API data, caching)
- **React Context**: UI state (alerts, modals)

---

## 🔗 API Integration

### API Client Setup

The API client is configured in `src/service/apiClient.ts`:

```typescript
// Example API call
import { apiClient } from '@/service/apiClient';

const getVenues = async () => {
  const response = await apiClient.get('/venues');
  return response.data;
};
```

### Environment Variables

Create `.env.development` and `.env.production` for environment-specific configurations:

```env
API_BASE_URL=https://dev-api.example.com    # Development
API_BASE_URL=https://api.example.com        # Production
```

### Query Client Configuration

Configured in `src/service/queryClient.ts` with:
- Default cache time: 5 minutes
- Stale time: 1 minute
- Retry on failure: 3 attempts
- Request timeout: 30 seconds

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with clear commits
4. Write tests for new functionality
5. Submit a pull request

### Code Standards
- **TypeScript**: No `any` types without justification
- **Naming**: Use camelCase for variables/functions, PascalCase for components
- **Components**: Functional components with hooks preferred
- **Comments**: Add JSDoc comments for complex logic
- **Testing**: Maintain >80% test coverage

### Commit Convention
```
feat: add new booking feature
fix: resolve payment issue
docs: update API documentation
style: format code
test: add booking tests
chore: update dependencies
```

### Running Tests
```bash
npm test
npm test -- --coverage    # With coverage report
```

---

## 🐛 Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
npm start -- --reset-cache

# Kill existing Metro process and restart
npm start
```

#### Android Build Issues
```bash
# Clean Gradle cache
cd android
./gradlew clean
./gradlew cleanBuildCache
cd ..

# Rebuild
npm run android
```

#### iOS Build Issues
```bash
# Clean pods
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install
cd ..

# Clear Xcode cache
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

#### Dependency Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# OR
yarn install --frozen-lockfile
```

#### Hot Reload Not Working
1. Enable Debug Mode from dev menu
2. Press `Cmd + D` (iOS) or `Ctrl + M` (Android)
3. Select "Enable Hot Reload"

### Debug Mode

Enable detailed logging:
```bash
npm start -- --verbose
```

### Performance Profiling
- Use React DevTools: Download React DevTools Extension
- Use Android Studio Profiler for native performance
- Use Xcode Instruments for iOS performance

---

## 📞 Support

For support, issues, or feature requests:

- **GitHub Issues**: [Report a bug](https://github.com/yourusername/rental-meet/issues)
- **Email**: support@rentalmeet.com
- **Documentation**: [Full documentation](https://docs.rentalmeet.com)
- **Community Forum**: [Discussions](https://github.com/yourusername/rental-meet/discussions)

### Getting Help
1. Check existing [GitHub Issues](https://github.com/yourusername/rental-meet/issues)
2. Review [documentation](https://docs.rentalmeet.com)
3. Ask in [Community Discussions](https://github.com/yourusername/rental-meet/discussions)
4. Contact support team for urgent issues

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- React Native community for excellent framework and tools
- TanStack for React Query management
- Zustand for state management
- Razorpay for secure payment processing

---

**Last Updated**: June 2026  
**Version**: 1.0.0  
**Maintainers**: RentalMeet Development Team
