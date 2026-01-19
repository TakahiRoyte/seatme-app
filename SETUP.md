# SeatMe MVP - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Firestore Database**
   - Go to Firestore Database → Create database
   - Start in **test mode** (for development)
   - Choose a location (e.g., us-central)

4. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Add web app
   - Copy the config values

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase credentials:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Seed Sample Data

Open the browser console and run:

```javascript
import { seedRestaurants } from './src/lib/seedData';
seedRestaurants();
```

Or add this temporarily to `src/main.tsx`:

```typescript
import { seedRestaurants } from './lib/seedData';

// Run once to seed data
if (import.meta.env.DEV) {
  // Uncomment to seed data:
  // seedRestaurants();
}
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📱 Features

### Customer View (`/`)
- Real-time restaurant list
- Status indicators (🟢 Open, 🟡 Busy, 🔴 Full)
- Wait time display
- Click to view details

### Restaurant Detail (`/restaurant/:id`)
- Individual restaurant information
- Last updated timestamp
- Restaurant info (seat type, smoking, parking)

### Staff Dashboard (`/staff`)
- Manage all restaurants
- Quick status toggle (Open/Busy/Full)
- Add new restaurants
- Edit restaurant details

---

## 🚢 Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase (if not already done):
```bash
firebase init
```

Select:
- ✅ Firestore
- ✅ Hosting

Configuration:
- Build directory: `dist`
- Single-page app: `Yes`
- Automatic builds: `No`

4. Build and deploy:
```bash
npm run build
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

---

## 🔒 Security (Production)

The current Firestore rules allow public read/write for MVP testing. For production:

1. Add Firebase Authentication
2. Update `firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /restaurants/{restaurant} {
      // Anyone can read
      allow read: if true;
      
      // Only authenticated staff can write
      allow write: if request.auth != null;
    }
  }
}
```

3. Protect `/staff` route with authentication

---

## 📊 Free Tier Limits

Firebase Free Tier (Spark Plan):
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ 1GB storage
- ✅ 10GB hosting/month

Expected usage for 10 active users:
- ~100 reads/day
- ~10 writes/day

**Well within free limits!** 🎉

---

## 🛠️ Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Real-time**: Firestore real-time listeners (<1s latency)
- **Styling**: Vanilla CSS with design system

---

## 📝 Next Steps

1. ✅ Test locally with seed data
2. ✅ Deploy to Firebase Hosting
3. 🔜 Add Firebase Authentication for staff access
4. 🔜 Add analytics to track usage
5. 🔜 Add QR code generation for restaurant links
6. 🔜 Add push notifications for wait time updates
