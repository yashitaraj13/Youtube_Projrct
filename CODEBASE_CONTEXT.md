 # YourTube Codebase Context

## Project Summary

YourTube is a YouTube-inspired academic web application built as a frontend-first demo. It uses Next.js Pages Router, React, TypeScript, Tailwind CSS, and Context API.

The current implementation simulates backend/database behavior with `localStorage` through a small storage helper. This was done so the project can demonstrate required flows locally without needing MongoDB, Express, Razorpay, Resend, or SMS credentials during development.

## Tech Stack

- Next.js Pages Router
- React
- TypeScript
- Tailwind CSS
- Context API
- `localStorage` persistence via `lib/storage.ts`
- Lucide React icons

## Run Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

Local app URL:

```text
http://localhost:3000
```

## Important Architecture Notes

The homepage must render thumbnails only. Do not render `<video>` elements in the homepage grid. The actual video player belongs only on the watch page.

Current persistence is local-only. The project does not yet have a real Express/MongoDB backend wired in. The storage helper is intentionally centralized so it can later be replaced by API calls.

## Main Files

### App Shell

- `pages/_app.tsx`
  - Wraps the app in `AuthProvider`.

- `components/Layout.tsx`
  - Main header/navigation.
  - Shows login/signup flow when logged out.
  - Shows profile/logout when logged in.
  - Includes video call navigation.

- `styles/globals.css`
  - Tailwind setup.
  - Global dark/light theme handling.
  - Gesture tap-zone CSS for the video player.

### Data and Types

- `lib/types.ts`
  - Shared TypeScript types:
    - `User`
    - `Video`
    - `Comment`
    - `DownloadRecord`
    - `Transaction`
    - `Plan`

- `lib/videos.ts`
  - Static demo video data.
  - Includes thumbnail URLs and video URLs.
  - Helpers:
    - `getVideo(id)`
    - `getNextVideo(id)`

- `lib/plans.ts`
  - Subscription plan definitions:
    - Free
    - Bronze
    - Silver
    - Gold
  - Stores price, watch limit, and download rules.

- `lib/storage.ts`
  - Central local persistence helper.
  - Stores:
    - users
    - current session
    - comments
    - downloads
    - transactions
    - selected translation language
  - Replace this file or wrap it with API calls when adding a real backend.

### Authentication

- `context/AuthContext.tsx`
  - Provides:
    - `user`
    - `setUser`
    - `logout`
    - `loginWithGoogleDemo`
    - `login`
    - `register`
    - `otpMessage`
    - `isLightTheme`
    - `isReady`
    - `selectedLanguage`
    - `setSelectedLanguage`
  - Auth state persists in `localStorage`.
  - Login/signup users are saved in `yourtube-users`.
  - Current session is saved in `yourtube-user`.
  - Location is detected with `https://ipapi.co/json/`.
  - If location lookup fails, fallback is Bengaluru, Karnataka.
  - OTP delivery is simulated with UI messages and console logs.

### Pages

- `pages/index.tsx`
  - Homepage video grid.
  - Uses `VideoCard`.
  - Important: thumbnails only, no video players.

- `pages/login.tsx`
  - Login form.
  - Uses saved users from local storage.
  - Includes Google demo login button.

- `pages/signup.tsx`
  - Sign-up form.
  - Registers local user.
  - Detects location and stores city/state.

- `pages/watch/[id].tsx`
  - Watch page with real HTML video player.
  - Gesture support:
    - Single tap center: play/pause
    - Double tap left: seek back 10 seconds
    - Double tap right: seek forward 10 seconds
    - Triple tap center: next video
    - Triple tap left: scroll/open comments
    - Triple tap right: close website fallback
  - Enforces plan viewing limits:
    - Free: 5 minutes
    - Bronze: 7 minutes
    - Silver: 10 minutes
    - Gold: unlimited
  - Handles downloads:
    - Requires login
    - Free users get 1 download per day
    - Premium users get unlimited downloads
    - Download history persists per user
    - Uses an `<a download>` flow and blob fallback

- `pages/profile.tsx`
  - Displays profile details.
  - Shows app language setting for comment translation.
  - Shows subscription plans.
  - Simulates Razorpay test checkout:
    - Payment success
    - Payment failure
  - On successful payment:
    - Saves transaction
    - Updates user plan
    - Simulates invoice email via console log
  - Shows downloads library per user.
  - Shows payment history per user.

- `pages/call.tsx`
  - VoIP demo page.
  - Uses:
    - `navigator.mediaDevices.getUserMedia`
    - `navigator.mediaDevices.getDisplayMedia`
    - `MediaRecorder`
  - Supports local camera preview, screen sharing, recording, and downloading `recording.webm`.
  - Socket.IO signaling is not implemented yet.

### Components

- `components/VideoCard.tsx`
  - Thumbnail card for homepage.
  - Links to `/watch/[id]`.

- `components/CommentSystem.tsx`
  - Per-video comments.
  - Comments persist in `localStorage`.
  - Requires login to post/vote.
  - Blocks special characters with:
    - `/^[a-zA-Z0-9\s]+$/`
  - Saves city from the user profile at comment creation time.
  - Vote rules:
    - One user can like or dislike, not both
    - Clicking the same vote removes it
    - Votes persist after refresh
    - Comments auto-delete when dislikes reach 2
  - Translation:
    - Uses selected app language from auth context/settings
    - Translation is generated on demand by clicking Translate
    - Original comment text is never modified
    - Demo dictionary exists for Hindi, Tamil, Kannada, English

## Current Persistence Keys

Stored in browser `localStorage`:

```text
yourtube-users
yourtube-user
yourtube-comments
yourtube-download-history
yourtube-transactions
yourtube-language
```

## Known Simulation Areas

These are currently mocked/simulated and should be replaced for production:

- Google authentication
- OTP email/SMS delivery
- MongoDB persistence
- Express backend API
- Razorpay checkout/order verification
- Resend invoice email delivery
- Socket.IO signaling for WebRTC
- Real translation API

## Recommended Backend Migration Path

1. Add Express API routes for users, comments, downloads, transactions, and subscriptions.
2. Replace `lib/storage.ts` method internals with API calls.
3. Add MongoDB/Mongoose models matching the current TypeScript shapes.
4. Move Razorpay payment creation and verification to backend.
5. Move invoice email sending to backend after verified payment success.
6. Implement Socket.IO signaling server for WebRTC calls.

## Validation Checklist

After changes, verify:

- Signup works.
- Login works.
- User remains logged in after refresh.
- Logout clears only session, not saved account data.
- Comments persist after page reload.
- Comment city is displayed.
- Comment translate button works.
- Like/dislike cannot both be active for same user/comment.
- Repeated voting does not inflate counts.
- Download starts without opening a new tab.
- Free user second download on same day is blocked.
- Download history appears in profile after logout/login.
- Plan upgrade changes user plan.
- Watch limits are enforced by plan.
- Gold plan has unlimited viewing.
- Payment success/failure states work.
- Invoice details are logged after successful payment.
- Homepage still uses thumbnails only.

## Notes For Future Changes

Keep changes scoped. Reuse `AuthContext`, `storage`, `plans`, and shared types before adding new parallel state systems.

If adding a real backend, avoid changing the UI behavior first. Keep the local UI working and swap persistence behind `lib/storage.ts` or introduce a service layer with the same method names.
