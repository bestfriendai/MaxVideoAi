# MaxVideoAI Deployment Setup Guide

This guide will help you set up MaxVideoAI with Firebase Backend (Cloud Functions) and Vercel Frontend.

## Prerequisites

- Node.js 18 or higher
- Firebase CLI installed: `npm install -g firebase-tools`
- Vercel CLI installed: `npm install -g vercel`
- A Firebase project: https://console.firebase.google.com/
- A Vercel account: https://vercel.com/signup

## 1. Firebase Backend Setup

### 1.1 Login to Firebase

```bash
firebase login
```

### 1.2 Initialize Firebase Project

```bash
cd /Users/letsmakemillions/Downloads/MaxVideoAi
firebase init
```

When prompted:
- Select: **Functions** and **Firestore**
- Use an existing project or create a new one
- Language: **TypeScript**
- ESLint: **Yes**
- Install dependencies: **Yes**

### 1.3 Configure Firebase Environment Variables

Create `functions/.runtimeconfig.json`:

```json
{
  "stripe": {
    "secret_key": "your_stripe_secret_key",
    "webhook_secret": "your_webhook_secret"
  },
  "supabase": {
    "url": "your_supabase_url",
    "service_role_key": "your_service_role_key"
  },
  "fal": {
    "key": "your_fal_key",
    "api_key": "your_fal_api_key"
  }
}
```

### 1.4 Build and Deploy Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

Your Firebase Functions will be available at:
- `https://us-central1-{PROJECT_ID}.cloudfunctions.net/engines`
- `https://us-central1-{PROJECT_ID}.cloudfunctions.net/preflight`
- `https://us-central1-{PROJECT_ID}.cloudfunctions.net/generate`
- `https://us-central1-{PROJECT_ID}.cloudfunctions.net/jobs`
- `https://us-central1-{PROJECT_ID}.cloudfunctions.net/healthz`

## 2. Vercel Frontend Setup

### 2.1 Login to Vercel

```bash
vercel login
```

### 2.2 Link Project to Vercel

```bash
cd /Users/letsmakemillions/Downloads/MaxVideoAi
vercel link
```

Follow the prompts:
- Link to existing project or create new one
- Scope: **Personal** or your team
- Root directory: `./` (current directory)

### 2.3 Configure Environment Variables

Set these in Vercel dashboard (Settings > Environment Variables) or via CLI:

```bash
# Firebase Configuration
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID

# Firebase Functions URL
vercel env add NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL production

# API Configuration
vercel env add NEXT_PUBLIC_API_BASE production
vercel env add NEXT_PUBLIC_API_BASE preview
vercel env add NEXT_PUBLIC_API_BASE development

# Add all other environment variables from frontend/.env.local.example
```

### 2.4 Deploy to Vercel

```bash
vercel --prod
```

## 3. Environment Variables Reference

### Required Firebase Config

Get these from Firebase Console > Project Settings > General:

- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Project ID + `.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Project ID + `.appspot.com`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Sender ID from Firebase
- `NEXT_PUBLIC_FIREBASE_APP_ID` - App ID from Firebase

### Firebase Functions URL

Format: `https://us-central1-{PROJECT_ID}.cloudfunctions.net`

### Other Required Variables

See `frontend/.env.local.example` for complete list including:
- Stripe keys
- Supabase configuration
- S3 storage settings
- FAL AI configuration
- Email service settings

## 4. Local Development

### 4.1 Start Firebase Emulator

```bash
cd /Users/letsmakemillions/Downloads/MaxVideoAi/functions
npm run serve
```

This will start:
- Functions emulator on port 5001
- Firestore emulator on port 8080

### 4.2 Start Next.js Frontend

In another terminal:

```bash
cd /Users/letsmakemillions/Downloads/MaxVideoAi/frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 5. Testing

### Test Firebase Functions

```bash
# Health check
curl https://us-central1-{PROJECT_ID}.cloudfunctions.net/healthz

# Get engines
curl https://us-central1-{PROJECT_ID}.cloudfunctions.net/engines

# Preflight check
curl -X POST https://us-central1-{PROJECT_ID}.cloudfunctions.net/preflight \
  -H "Content-Type: application/json" \
  -d '{"engine":"veo3","mode":"t2v","durationSec":5}'
```

### Test Vercel Deployment

Visit your Vercel URL and check:
- Homepage loads correctly
- API routes work (check network tab)
- Authentication flows work
- Video generation interface loads

## 6. CI/CD Integration

### GitHub Actions (for Firebase)

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy Firebase Functions
on:
  push:
    branches: [main]
    paths: ['functions/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd functions && npm ci
      - run: cd functions && npm run build
      - uses: firebase/firebase-tools-actions@v2
        with:
          args: deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

### Vercel Deployment

Vercel handles deployment automatically on git push. Configure:
- Build Command: `pnpm --filter frontend... build`
- Output Directory: `frontend/.next`
- Install Command: `pnpm install --frozen-lockfile`

## 7. Monitoring

### Firebase Monitoring

- Firebase Console > Functions > Logs
- Firebase Console > Firestore
- Firebase Console > Monitoring

### Vercel Monitoring

- Vercel Dashboard > Analytics
- Vercel Dashboard > Logs
- Vercel Dashboard > Speed Insights (if configured)

## 8. Common Issues

### Functions timeout
- Increase timeout in `firebase.json`
- Optimize function code
- Use Cloud Tasks for long-running operations

### CORS errors
- Functions already include CORS headers
- Check Vercel rewrites in `vercel.json`

### Environment variables missing
- Verify all variables are set in Firebase and Vercel
- Run `firebase functions:config:get` to check Firebase config
- Check Vercel dashboard environment variables

### Build failures
- Check Node.js version (requires 18+)
- Verify all dependencies are installed
- Check TypeScript errors: `cd functions && npm run build`

## Support

- Firebase Documentation: https://firebase.google.com/docs
- Vercel Documentation: https://vercel.com/docs
- Firebase Functions Reference: https://firebase.google.com/docs/functions
- Vercel Deployment Guide: https://vercel.com/docs/deployments/overview