# ApnaGhr Mobile App Build Guide

## 📱 Publishing to iOS App Store & Google Play Store

Your web app is ready to be packaged as a native mobile app using **Capacitor**.

---

## 🛠️ Prerequisites (On Your Mac/PC)

### For Both Platforms:
- Node.js 18+ installed
- Git installed

### For Android:
- **Android Studio** - Download from https://developer.android.com/studio
- Java JDK 17+ (comes with Android Studio)
- Android SDK (install via Android Studio)

### For iOS (Mac only):
- **Xcode 15+** - Download from Mac App Store
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account ($99/year) - https://developer.apple.com

---

## 📦 Step 1: Download & Build the Project

```bash
# 1. Clone/Download your project from Emergent
# Use "Save to Github" feature, then clone

# 2. Navigate to frontend folder
cd frontend

# 3. Install dependencies
yarn install

# 4. Build the web app
yarn build

# 5. Initialize Capacitor native projects
npx cap add android
npx cap add ios

# 6. Sync web assets to native projects
npx cap sync
```

---

## 🤖 Step 2: Build Android APK/AAB

```bash
# Open Android Studio
npx cap open android
```

### In Android Studio:
1. Wait for Gradle sync to complete
2. Go to **Build → Generate Signed Bundle / APK**
3. Select **Android App Bundle (AAB)** for Play Store
4. Create a new keystore or use existing
5. Build the release version

### Keystore Info (SAVE THIS SECURELY):
```
Keystore file: apnaghr-release.jks
Keystore password: [create strong password]
Key alias: apnaghr
Key password: [create strong password]
```

### Output Location:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🍎 Step 3: Build iOS IPA (Mac Only)

```bash
# Open Xcode
npx cap open ios
```

### In Xcode:
1. Select your Team (Apple Developer Account)
2. Update Bundle Identifier: `com.apnaghr.app`
3. Go to **Product → Archive**
4. Click **Distribute App**
5. Select **App Store Connect** for App Store submission

---

## 🏪 Step 4: Submit to Stores

### Google Play Store:
1. Go to https://play.google.com/console
2. Create Developer Account ($25 one-time)
3. Create new app "ApnaGhr"
4. Upload your AAB file
5. Fill in store listing:
   - App name: ApnaGhr
   - Short description: Book property visits in 60+ Indian cities
   - Full description: (see below)
   - Screenshots (phone + tablet)
   - Feature graphic (1024x500)
   - App icon (512x512)

### Apple App Store:
1. Go to https://appstoreconnect.apple.com
2. Create new app "ApnaGhr"
3. Upload build via Xcode or Transporter app
4. Fill in app information
5. Submit for review

---

## 📝 Store Listing Content

### App Name:
```
ApnaGhr - Property Visits
```

### Short Description (80 chars):
```
Book property visits in 60+ Indian cities. Find verified flats & homes.
```

### Full Description:
```
ApnaGhr makes finding your perfect home easy!

🏠 FIND PROPERTIES
• Browse verified listings in 60+ cities
• Filter by BHK, rent, furnishing
• View real photos and videos

📅 BOOK VISITS
• Schedule property visits instantly
• Professional riders guide you
• Visit multiple properties in one trip

✅ VERIFIED LISTINGS
• All properties are pre-verified
• No broker fees
• Transparent pricing

💰 EARN MONEY
• Become a Property Rider
• Earn ₹2000+ per day
• Flexible hours, instant payments

📍 CITIES COVERED
Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Chandigarh, Mohali, and 50+ more cities!

Download ApnaGhr today and find your dream home!
```

### Keywords:
```
property, rental, flat, apartment, house, rent, buy, real estate, home, visit, India, booking
```

### Category:
- Primary: Lifestyle
- Secondary: Business

---

## 🎨 Required Assets

### App Icon:
- 1024x1024 PNG (no transparency for iOS)
- Use your ApnaGhr logo with green (#04473C) background

### Screenshots (Required):
- Phone: 1290x2796 (iPhone 15 Pro Max) - 5 screenshots
- Tablet: 2048x2732 (iPad Pro 12.9") - 5 screenshots

### Feature Graphic (Android):
- 1024x500 PNG/JPG

### Screenshots to Capture:
1. Home screen with property listings
2. Property detail page
3. Visit booking flow
4. Rider earning page
5. Profile/Dashboard

---

## 🔐 Important Files to Keep Safe

```
1. android/app/apnaghr-release.jks (Android keystore)
2. Keystore passwords
3. Apple Developer certificates
4. Google Play signing key (if using Play App Signing)
```

---

## 🚀 Quick Commands Reference

```bash
# Build web app
yarn build

# Sync to native projects
npx cap sync

# Open Android Studio
npx cap open android

# Open Xcode
npx cap open ios

# Run on Android device/emulator
npx cap run android

# Run on iOS simulator
npx cap run ios

# Live reload during development
npx cap run android --livereload --external
npx cap run ios --livereload --external
```

---

## ❓ Common Issues

### Android: "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### iOS: "No signing certificate"
- Open Xcode → Preferences → Accounts
- Add your Apple Developer account
- Let Xcode manage signing

### Build fails after code changes
```bash
yarn build && npx cap sync
```

---

## 📞 Support

If you face any issues, share the error message and I'll help you fix it!
