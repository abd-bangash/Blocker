# React Native App & Website Blocker

A comprehensive React Native app with native Android integration that blocks apps and websites to help users maintain focus and productivity.

## Features

### Phase 1 - App Blocking ✅
- **Accessibility Service Integration**: Monitors foreground apps in real-time
- **Custom Blocking Screen**: Full-screen blocking interface with professional design  
- **React Native Bridge**: Native modules expose app blocking functionality
- **Dynamic Block List Management**: Add/remove apps via user-friendly UI
- **Permission Handling**: Automatic accessibility service permission requests

### Phase 2 - Website Blocking ✅
- **VPN Service Implementation**: Intercepts and filters network traffic
- **DNS/Network Filtering**: Blocks websites at the network level
- **Domain Management**: Add/remove blocked domains through React Native
- **VPN Permission Flow**: Seamless VPN permission request handling

### Phase 3 - Advanced Features ✅
- **Smart Scheduling**: Time-based blocking with customizable schedules
- **Detailed Analytics**: Comprehensive blocking statistics and reports
- **Security Protection**: PIN/password protection for blocker settings
- **Persistent Storage**: Secure data storage with react-native-keychain

## Tech Stack

- **Frontend**: React Native with TypeScript
- **Navigation**: Expo Router with tab-based architecture
- **State Management**: React Context API
- **Storage**: AsyncStorage + react-native-keychain for security
- **Native Integration**: Custom Native Modules (Java/Kotlin)
- **UI Design**: Modern Material Design principles

## Architecture

### React Native Layer
```
app/
├── (tabs)/
│   ├── index.tsx          # App blocking management
│   ├── websites.tsx       # Website blocking management  
│   ├── schedule.tsx       # Time-based scheduling
│   └── reports.tsx        # Analytics and statistics
└── services/
    ├── BlockerService.ts     # App blocking service
    ├── WebsiteBlockerService.ts # Website blocking service
    ├── ScheduleService.ts    # Scheduling management
    └── ReportsService.ts     # Analytics service
```

### Native Android Layer
```
android/app/src/main/java/com/boltexpo/
├── BlockerModule.java                    # App blocking native module
├── WebsiteBlockerModule.java             # Website blocking native module
├── BlockedAppsManager.java               # App blocking logic manager
├── BlockedWebsitesManager.java           # Website blocking logic manager
├── AppBlockerAccessibilityService.java   # Accessibility service
├── WebsiteBlockerVPNService.java         # VPN service implementation
└── AppBlockingActivity.java              # Custom blocking screen
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio
- Android SDK (API Level 26+)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository>
   cd react-native-app-blocker
   npm install
   ```

2. **Android Setup**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew build
   ```

3. **Run the App**
   ```bash
   npx react-native run-android
   ```

### Required Permissions

The app requires these critical permissions:

```xml
<uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
<uses-permission android:name="android.permission.BIND_VPN_SERVICE" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
```

## Usage Examples

### App Blocking
```javascript
// Add an app to the blocked list
await BlockerService.addBlockedApp('com.facebook.katana');

// Enable app blocking
await BlockerService.setBlockingEnabled(true);

// Check if accessibility permission is granted
const hasPermission = await BlockerService.checkAccessibilityPermission();
```

### Website Blocking  
```javascript
// Add a website to the blocked list
await WebsiteBlockerService.addBlockedWebsite('facebook.com');

// Enable website blocking (starts VPN service)
await WebsiteBlockerService.setWebsiteBlockingEnabled(true);
```

### Scheduling
```javascript
// Create a work hours blocking schedule
await ScheduleService.addSchedule({
  name: 'Work Hours',
  startTime: '09:00',
  endTime: '17:00', 
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  type: 'both', // blocks both apps and websites
  isActive: true
});
```

## Key Components

### Native Services

1. **AppBlockerAccessibilityService**
   - Monitors app launches using AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
   - Shows blocking screen when blocked apps are detected
   - Runs as a system-level service

2. **WebsiteBlockerVPNService** 
   - Implements local VPN to intercept network traffic
   - Filters DNS requests and HTTP/HTTPS traffic
   - Drops packets for blocked domains

3. **BlockedAppsManager & BlockedWebsitesManager**
   - Singleton pattern for managing blocked lists
   - Thread-safe operations
   - In-memory caching with persistent storage

### React Native Integration

- **Native Modules**: Seamless bridge between RN and Android services
- **Event Emitters**: Real-time communication from native to RN
- **Promise-based APIs**: Async operations with proper error handling
- **TypeScript**: Full type safety across the codebase

## Production Deployment

### Build Configuration
```bash
# Generate signed APK
cd android
./gradlew assembleRelease

# Generate Android App Bundle (recommended for Play Store)  
./gradlew bundleRelease
```

### Play Store Requirements
- Target SDK 33+ (Android 13)
- 64-bit architecture support
- Proper permission justifications for sensitive permissions
- Privacy policy for data collection

## Security Considerations

- **Accessibility Service**: Requires explicit user consent via system settings
- **VPN Service**: Local VPN only, no external traffic routing
- **Secure Storage**: Sensitive data encrypted using react-native-keychain
- **Permission Model**: Minimal permissions, clear user consent flows

## Performance Optimization

- **Efficient Packet Processing**: Minimal CPU overhead in VPN service
- **Battery Optimization**: Optimized background service management
- **Memory Management**: Proper lifecycle management for native services
- **Storage Efficiency**: Compressed data storage, automatic cleanup

This implementation provides a production-ready foundation for an app and website blocking solution with enterprise-grade native Android integration.