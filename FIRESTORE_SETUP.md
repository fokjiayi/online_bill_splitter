# Firestore Setup Guide

## Issue: Documents Not Being Created

If you're seeing the error "Failed to share session" or documents aren't appearing in Firestore, the most common cause is **Firestore Security Rules blocking access**.

## Fix: Set Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **bill-splitter**
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read/write to session and expense collections
    // ⚠️ WARNING: These rules are public. Use proper authentication for production!
    match /session/{document=**} {
      allow read, write;
    }
    match /expense/{document=**} {
      allow read, write;
    }
  }
}
```

5. Click **Publish**

## For Production (with Authentication)

If you want to secure this with authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can create/modify sessions
    match /session/{sessionId} {
      allow read: if true;  // Anyone can read
      allow create, update, delete: if request.auth != null;
    }
    match /expense/{expenseId} {
      allow read: if true;  // Anyone can read
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

## Checking if It Works

Open the browser's Developer Tools (F12) and check the Console:
- ✅ If you see "Firestore is accessible", security rules are correct
- ⚠️ If you see "Firestore connection test failed", update the security rules
- ❌ If you see "Firestore connection error", check your config and API key

## Database Structure

Your Firestore should have:
- **Collection: `session`**
  - Fields: `title`, `participants`, `type`, `parent`, `createdAt`
  
- **Collection: `expense`**
  - Fields: `name`, `amount`, `gst`, `paid_by`, `split_by`, `session_id`, `createdAt`

These are created automatically by the app when you create sessions and expenses.
