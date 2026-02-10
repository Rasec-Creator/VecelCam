# VecelCam 📷

A Next.js camera analyzer with AI-powered image recognition using OpenAI.

## Setup Local

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env.local`** and add your API key:
   ```
   OPENAI_API_KEY=sk-xxxxx
   ```
   
   Get your key from: [OpenAI API Keys](https://platform.openai.com/api-keys)

3. **Run dev server**:
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Step 1: Connect to Vercel
Push to GitHub and open [vercel.com](https://vercel.com):
1. Click "Add New → Project"
2. Select your `VecelCam` repository
3. Click "Import"

### Step 2: Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
- Add `OPENAI_API_KEY` with your key from OpenAI

### Step 3: Auto-Deploy
Every push to `main` triggers automatic deployment.

## Features
- 📸 Real-time camera capture
- 🤖 AI image analysis with GPT-4 Vision
- 🎨 Dark/Light theme support
- 📊 Detailed recommendations
- 🚀 Serverless API with Next.js

