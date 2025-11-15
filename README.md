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

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Deploy to Firebase Hosting:
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
