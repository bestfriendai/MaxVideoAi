# Quick Start Guide - Firebase Backend + Vercel Frontend

## Setup Complete! ✅

Your MaxVideoAI project has been configured for Firebase backend (Cloud Functions) and Vercel frontend deployment.

## What Was Configured

### 1. Firebase Functions Backend
- ✅ Created `functions/` directory with TypeScript Cloud Functions
- ✅ Set up API endpoints:
  - `/engines` - GET list of available video generation engines
  - `/preflight` - POST validate and price video generation requests
  - `/generate` - POST initiate video generation
  - `/jobs` - GET list user jobs
  - `/healthz` - GET health check endpoint
- ✅ Configured CORS for all endpoints
- ✅ Created `firebase.json` configuration
- ✅ Set up TypeScript build pipeline

### 2. Vercel Frontend
- ✅ Updated `vercel.json` to proxy API requests to Firebase Functions
- ✅ Configured build settings for Next.js frontend
- ✅ Set up environment variable templates

### 3. Environment Configuration
- ✅ Created `frontend/.env.local.example` with Firebase config
- ✅ Created `functions/.runtimeconfig.json` for Firebase function secrets
- ✅ Updated root `package.json` with deployment scripts

## Next Steps

### Step 1: Create Firebase Project
```bash
firebase login
cd /Users/letsmakemillions/Downloads/MaxVideoAi
firebase init
```
Follow prompts to create/select a Firebase project

### Step 2: Set Firebase Environment Variables
Edit `functions/.runtimeconfig.json` with your actual keys
Or use Firebase CLI:
```bash
firebase functions:config:set stripe.secret_key="your_key"
```

### Step 3: Deploy Firebase Functions
```bash
npm run firebase:deploy
```

### Step 4: Configure Vercel
```bash
vercel login
vercel link
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL` = `https://us-central1-{PROJECT_ID}.cloudfunctions.net`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = your Firebase project ID
- All other variables from `frontend/.env.local.example`

### Step 5: Deploy to Vercel
```bash
vercel --prod
```

## Development

### Start Firebase Emulator (local testing)
```bash
npm run firebase:serve
```
Functions available at: `http://localhost:5001`

### Start Frontend (local development)
```bash
cd frontend && npm run dev
```
Frontend available at: `http://localhost:3000`

## Deployment Commands

- `npm run firebase:build` - Build Firebase Functions
- `npm run firebase:deploy` - Deploy Functions to Firebase
- `npm run firebase:logs` - View Function logs
- `vercel --prod` - Deploy frontend to Vercel
- `npm run deploy:all` - Deploy both Firebase and Vercel

## Configuration Files

- `firebase.json` - Firebase project configuration
- `vercel.json` - Vercel deployment configuration  
- `functions/src/index.ts` - Firebase Functions code
- `functions/tsconfig.json` - TypeScript configuration
- `functions/package.json` - Functions dependencies
- `frontend/.env.local.example` - Environment variable template

## API Endpoints

After deployment, your APIs will be available at:

Firebase Functions (Backend):
- `https://us-central1-{PROJECT_ID}.cloudfunctions.net/engines`
- `https://us-central1-{PROJECT_ID}.cloudfunctions.net/preflight`
- `https://us-central1-{PROJECT_ID}.cloudfunctions.net/generate`
- `https://us-central1-{PROJECT_ID}.cloudfunctions.net/jobs`
- `https://us-central1-{PROJECT_ID}.cloudfunctions.net/healthz`

Vercel (Frontend):
- `https://your-app.vercel.app` - Your deployed frontend

API proxy configured to route `/api/*` requests to Firebase Functions.

## Documentation

Full deployment guide available in `DEPLOYMENT_SETUP.md`

## Need Help?

- Firebase Documentation: https://firebase.google.com/docs
- Vercel Documentation: https://vercel.com/docs
- Project README.md for general information