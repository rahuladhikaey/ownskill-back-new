# Google OAuth Setup for Android App

## Overview
To enable Google Sign-In for your Android app, you need to configure Google OAuth in the Google Cloud Console. This is a manual step that must be completed by you.

## Steps to Configure Google OAuth

### 1. Get Your Android App Details

**Package Name:** Check your `app/build.gradle.kts` file for the applicationId
**SHA-1 Fingerprint:** Run this command in your terminal:
```bash
cd "c:/Ownskill Back New"
.\gradlew signingReport
```

### 2. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (or create a new one)
3. Go to: APIs & Services → Credentials

### 3. Configure OAuth Consent Screen
1. Click "OAuth consent screen" in the left sidebar
2. Choose "External" (for testing) or "Internal" (for organization)
3. Fill in required information:
   - App name: "OwnSkill"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
5. Save and continue

### 4. Create OAuth 2.0 Client ID for Android
1. Click "Create Credentials" → "OAuth 2.0 Client ID"
2. Application type: "Android"
3. Package name: (from step 1)
4. SHA-1 certificate fingerprint: (from step 1)
5. Click "Create"

### 5. Add Authorized Redirect URI
1. After creating the Android client, edit it
2. Add this redirect URI: `ownskill://auth/callback`
3. Save

### 6. Update Supabase Google Provider
1. Go to your Supabase project dashboard
2. Navigate to: Authentication → Providers → Google
3. Enable Google provider
4. Add your Google Client ID and Client Secret
5. Set Redirect URL to: `ownskill://auth/callback`
6. Save

## Testing

Once configured:
1. Install the updated APK
2. Click "Google Sign In" button
3. It should open the browser for Google authentication
4. After successful auth, it will redirect back to the app using the deep link

## Troubleshooting

**Error 403: disallowed_useragent**
- This means Google OAuth is not configured for Android
- Make sure you added the Android client with correct package name and SHA-1
- Verify the redirect URI matches exactly: `ownskill://auth/callback`

**Deep link not working**
- Ensure the AndroidManifest.xml has the intent-filter for `ownskill://` scheme
- Check that the MainActivity is exported
- Test the deep link using: `adb shell am start -W -a android.intent.action.VIEW -d "ownskill://auth/callback" com.ownskill.app/.MainActivity`

## Current Configuration

**Deep Link Scheme:** `ownskill://`
**Redirect URI:** `ownskill://auth/callback`
**Android Manifest:** Updated with deep linking intent-filter
**AuthScreen:** Configured to use deep link for OAuth redirect
