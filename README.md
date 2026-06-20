# YourTube

YourTube is a YouTube-inspired academic web application built with Next.js Pages Router, React, TypeScript and Tailwind CSS.

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Implemented Demo Flows

- Google-style demo login with IP location lookup through `https://ipapi.co/json/`
- OTP routing: South Indian states use email, other states use phone
- Location-aware theme: South India between 10:00 AM and 11:59 AM IST uses light theme, all other cases use dark theme
- Homepage renders image thumbnails only, with no video tags in the grid
- Watch page renders the HTML video player
- Gesture player: single center tap, double left/right tap, triple left/center/right tap
- Smart comments with translation demo, city display, like/dislike and auto-delete at 2 dislikes
- Download limit for free users and unlimited download behavior after premium upgrade
- Free, Bronze, Silver and Gold plan selection with simulated Razorpay success and invoice email logging
- VoIP demo page using `getUserMedia`, screen sharing through `getDisplayMedia`, and local `MediaRecorder` download

## Production Services To Connect

For final deployment, connect the simulated flows to:

- MongoDB Atlas collections: `users`, `videofiles`, `comments`, `likes`, `histories`, `watchlaters`, `downloads`
- Express + Socket.IO backend for WebRTC signaling
- Razorpay test mode order and payment verification APIs
- Resend API for invoice emails
- SMS provider such as Twilio, MSG91 or Fast2SMS for phone OTP

Frontend deployment target: Vercel.

Backend deployment target: Render or Railway.
