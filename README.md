# VecelCam 📷

A Next.js camera analyzer with AI-powered image recognition using the Vercel AI Gateway.

## Setup Local

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Create `.env.local`** and add your API key:
   ```
   AI_GATEWAY_API_KEY=your_api_key_here
   ```
   
   Get your key from: [Vercel AI Gateway](https://vercel.com/docs/ai/ai-gateway-getting-started)

3. **Run dev server**:
   ```bash
   pnpm dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Step 1: Connect to Vercel
```bash
npm install -g vercel
vercel
```

### Step 2: Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
- Add `AI_GATEWAY_API_KEY` with your key

### Step 3: Push to GitHub & Auto-Deploy
Once connected, every push to `main` triggers automatic deployment.

## Features
- 📸 Real-time camera capture
- 🤖 AI image analysis with GPT-4V
- 🎨 Dark/Light theme support
- 📊 Detailed recommendations
