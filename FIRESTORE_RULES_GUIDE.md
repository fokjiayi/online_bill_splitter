# Firestore Security Rules Implementation Guide

## Generated Rules File
Located at: `firestore.rules`

## How to Deploy Rules to Firebase

### Option 1: Using Firebase CLI (Recommended)
```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy only the security rules
firebase deploy --only firestore:rules
```

### Option 2: Deploy via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy & paste the contents of `firestore.rules`
5. Click **Publish**

---

## Security Model Explained

### 🔓 **Public Access Model**
Since you're using **session ID-based access** with no authentication:
- Anyone who has the session link can read/write the data
- The session ID acts like a "password" (if you know it, you can access it)
- This is similar to a shared Google Doc link

### ✅ **What These Rules Allow**

| Action | Permission | Details |
|--------|------------|---------|
| Create Session | ✅ Anyone | Anyone can create a new session (get new ID) |
| Read Session | ✅ Anyone | Anyone can read if they know the session ID |
| Edit Session | ❌ Nobody | Sessions are immutable (no metadata changes) |
| Delete Session | ✅ Anyone | Anyone can delete a session |
| Create Expense | ✅ Anyone | Anyone can add an expense to a session they know |
| Read Expense | ✅ Anyone | Anyone can read expenses for a session |
| Edit Expense | ✅ Anyone | Anyone can edit expenses (but session_id stays same) |
| Delete Expense | ✅ Anyone | Anyone can delete expenses |
| List All Sessions | ❌ Nobody | Prevents discovering sessions (need ID) |
| List All Expenses | ❌ Nobody | Prevents discovering expenses (need session_id) |

### 🛡️ **What These Rules Prevent**

1. **No Session Discovery**
   - ❌ Cannot do `db.collection('session').get()` (would get all sessions)
   - ✅ Can only do `db.collection('session').doc(sessionId).get()`

2. **No Expense Discovery**
   - ❌ Cannot do `db.collection('expense').get()` (would get all expenses)
   - ✅ Can only do `db.collection('expense').where('session_id', '==', id).get()`

3. **Session Immutability**
   - ❌ Cannot modify session after creation (prevents malicious changes)
   - ✅ Can only create and delete sessions

4. **Expense Integrity**
   - ❌ Cannot change which session an expense belongs to
   - ✅ Can modify expense details while keeping session_id fixed

---

## Validation Rules

### Session Document Structure (Enforced)
```javascript
{
  title: string,           // ✅ Required
  participants: array,     // ✅ Required
  type: string,           // ✅ Required ('single' or 'multi')
  parent: string or null,  // ✅ Optional (null for parent sessions)
  createdAt: timestamp     // ✅ Recommended
}
```

### Expense Document Structure (Enforced)
```javascript
{
  session_id: string,     // ✅ REQUIRED - Must exist and be string
  name: string,           // ✅ REQUIRED
  amount: number,         // ✅ REQUIRED
  paid_by: string,        // ✅ REQUIRED
  split_by: array,        // ✅ REQUIRED
  gst: number,           // Optional
  createdAt: timestamp    // Recommended
}
```

If any required field is missing, Firestore will reject the write.

---

## Current App Compatibility

✅ Your `firestore.js` code works perfectly with these rules:

```javascript
// ✅ Works - Creating session with valid data
await window.firestoreSession.create({
  title: 'Dinner', 
  participants: ['Alice', 'Bob'],
  type: 'single'
});

// ✅ Works - Reading session by ID
await window.firestoreSession.read({ id: sessionId });

// ✅ Works - Querying expenses by session_id
await window.firestoreExpense.read({ session_id: sessionId });

// ✅ Works - Creating expense with all required fields
await window.firestoreExpense.create({
  name: 'Lunch',
  amount: 50,
  paid_by: 'Alice',
  split_by: ['Alice', 'Bob'],
  session_id: sessionId
});
```

---

## Security Considerations & Recommendations

### ⚠️ **Current Limitations (Expected for this model)**

1. **No User Identification**
   - Anyone with the link can impersonate anyone
   - No way to track "who" made changes
   - *Mitigation*: Add optional user names to track actions (future enhancement)

2. **No Rate Limiting**
   - Malicious actors could spam create/update/delete operations
   - *Mitigation*: Consider backend Cloud Functions with rate limiting

3. **No Data Encryption**
   - All data is visible if you know the session ID
   - *Mitigation*: Do not put sensitive payment data; only split amounts

4. **Session ID as "Password"**
   - Short session IDs might be guessable
   - *Mitigation*: Firebase auto-generates long IDs (cryptographically secure)

### 🚀 **Future Security Enhancements**

If you want more security later:
1. **Add Firebase Authentication** → Identify users
2. **Add Custom Claims** → Restrict who can edit expenses
3. **Add Timestamps** → Track who changed what and when
4. **Add Cloud Functions** → Implement server-side validation and logging
5. **Add Rate Limiting** → Prevent abuse via Cloud Tasks

---

## Testing Your Rules (Firebase Emulator)

To test locally before deploying:

```bash
# Install Firebase Emulator
firebase init emulator

# Run emulator
firebase emulators:start

# Your app will connect to local Firestore instead of production
```

---

## Monitoring & Alerts

Once deployed, monitor for:
- 📊 Spike in writes (potential abuse)
- 🔍 Failed writes (client bugs)
- 📈 Storage growth (expected for active sessions)

Set up in [Firebase Console](https://console.firebase.google.com) → **Monitoring**.

---

## Questions?

- Need rate limiting? → Use Cloud Functions
- Need user tracking? → Implement Firebase Auth first
- Need better privacy? → Consider encryption at application level
