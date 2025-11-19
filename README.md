# GolfGun Web

Next.js web application for GolfGun - a social golf scoring app.

## Project Structure

- `/app/[locale]` - Next.js app router with internationalization
- `/lib/models` - TypeScript models (app_user, course, round, scorecard, etc.)
- `/lib/services` - Firebase services (user, round, course, friend, etc.)
- `/lib/firebase` - Firebase configuration
- `/components` - React components
- `/messages` - i18n translation files (en.json, th.json)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Create a `.env.local` file in the root directory
   - Add your LINE LIFF ID:
   ```
   NEXT_PUBLIC_LIFF_ID=your-liff-id-here
   ```
   - To get your LIFF ID:
     1. Go to [LINE Developers Console](https://developers.line.biz/console/)
     2. Select your channel
     3. Go to the "LIFF" tab
     4. Create a new LIFF app or use an existing one
     5. Copy the LIFF ID and paste it in `.env.local`

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Deploy to Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```

## Features

- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Internationalization (i18n) with Next.js
- Tailwind CSS for styling
- TypeScript for type safety

## Ported from Flutter

This is a port of the Flutter GolfGun app to Next.js. All models, services, and business logic have been preserved and adapted for web.
