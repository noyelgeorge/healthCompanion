# Firebase Setup Guide

To get the app working, especially the **Login**, **Social Feed**, and **Recipe Book** features, you need to set up Firebase.

## Option A: Use Your Own Firebase Project (Recommended)

If you haven't created a project yet:

1.  **Create Project**: Go to [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g., "CalorieTracker").
2.  **Enable Authentication**:
    *   Go to **Build/Authentication** > **Get Started**.
    *   Enable **Email/Password** provider.
3.  **Enable Firestore**:
    *   Go to **Build/Firestore Database** > **Create Database**.
    *   Start in **Test Mode** (easiest for dev) or **Production Mode** (requires setting rules below).
    *   Choose a location near you.
4.  **Get Configuration**:
    *   Go to **Project Settings** (gear icon).
    *   Scroll to "Your apps" > Add app (**</> Web**).
    *   Copy the `firebaseConfig` object.
5.  **Update Code**:
    *   Open `src/lib/firebase.ts` in your code.
    *   Replace the `firebaseConfig` variable with your new config.

## Option B: Configure Existing Project

If you already have the project (ID: `calorietracking-d41e8` in `firebase.ts`) and just need to enable features:

### 1. Firestore Security Rules (CRITICAL)

For the **Social Feed** to work, you must allow users to read/write posts.

1.  Go to **Firestore Database** > **Rules** tab.
2.  Replace the rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. Social Feed: Everyone can read, Authenticated users can post
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      // Allow author to edit everything, OR allow anyone to update 'likes'/'likedBy'
      allow update: if request.auth != null && (
        request.auth.token.email == resource.data.authorId || 
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'likedBy'])
      );
      allow delete: if request.auth != null && request.auth.token.email == resource.data.authorId;
    }


    // 2. User Data (Profiles, Logs, Recipe Book)
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
    }
    
    // 3. Shared Settings (Optional AI Key)
    match /settings/ai {
      allow read: if true;
    }
  }
}
```

3.  Click **Publish**.

### 2. Indexes (Optional)

If the Feed doesn't load and you see an error in the console about "indexes", click the link in the error log to auto-create it.
Based on our query `orderBy("timestamp", "desc")`, Firestore usually handles this automatically.

## Shared AI Key (Optional)

To enable the AI scanner for friends without them needing a key:
1.  In Firestore, create a collection `settings`.
2.  Create a document `ai`.
3.  Add field `apiKey` (string) with your Gemini API key.

## 4. Storage Security Rules (For Photo Uploads)

To allow users to upload recipe photos:
1. Go to the **Storage** tab in Firebase Console.
2. Click the **Rules** tab.
3. **Delete everything** there and **paste** this instead (do not keep the old rules):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Allow anyone to see images (public read)
    match /post_images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024; // Max 5MB
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```
