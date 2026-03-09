# Deployment Tasks - ESCAPE Room Placement Cell Game

## Status: IN PROGRESS

### Step 1: Deploy Backend to Render.com ✅ (Ready)

- Repository: https://github.com/Daksha003/ESCAPE
- Root Directory: `backend`
- Build Command: (leave empty)
- Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Step 2: Configure Backend Environment Variables ⚠️ (Needed)

Required:

- MONGO_URL=your_mongodb_connection_string
- DB_NAME=escaperoom
- GEMINI_API_KEY=your_google_gemini_api_key
- CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000

### Step 3: Get Deployed Backend URL 🔄 (Pending)

### Step 4: Update frontend/vercel.json 🔄 (Pending)

Update rewrites destination with actual backend URL after deployment.

### Step 5: Deploy Frontend to Vercel 🔄 (Pending)

---

## Manual Steps Required:

**User needs to do:**

1. Go to https://render.com → New Web Service → Connect GitHub repo "Daksha003/ESCAPE"
2. Set root directory = "backend"
3. Add environment variables from .env file
4. Wait for deployment, get the backend URL (e.g., https://escape-room-backend.onrender.com)
5. Update that URL in vercel.json below, then redeploy frontend on Vercel

**After getting backend URL:**

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-BACKEND.onrender.com/api/:path*"
    }
  ]
}
```
