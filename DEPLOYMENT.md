# Deployment Guide for CleanCar Classifier

## Current Status ✅
- ✅ Code pushed to GitHub: `KatieCallo2026/clean_car_classifier`
- ✅ Frontend connected to Vercel
- ⚠️ Backend needs deployment

## Frontend Deployment (Vercel) - DONE ✅

Your frontend is already connected to Vercel and auto-deploys on every push to `main`.

**Current URL**: `cleancarclassifier-git-main-katie-callos-projects.vercel.app`

### To Update Vercel Deployment:

1. **Set Environment Variable** (IMPORTANT!)
   - Go to your Vercel project dashboard
   - Navigate to: Settings → Environment Variables
   - Add: `VITE_BACKEND_URL` = `your-backend-url-here`
   - Click "Save"
   - Go to Deployments → Latest Deployment → ... → Redeploy

## Backend Deployment - TODO ⚠️

Your backend needs to be deployed separately. Here are the easiest options:

### Option 1: Railway (Recommended - Easiest)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `KatieCallo2026/clean_car_classifier`
5. Railway will detect Python and prompt for settings:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
6. Add environment variables in Railway dashboard:
   - (None required currently, but you may add CORS origins)
7. Railway will provide a URL like: `https://your-app.railway.app`
8. Copy this URL

### Option 2: Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect `KatieCallo2026/clean_car_classifier`
5. Configure:
   - **Name**: cleancar-backend
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
6. Click "Create Web Service"
7. Copy the provided URL

### Option 3: Google Cloud Run

1. Install Google Cloud CLI
2. Run:
   ```bash
   cd backend
   gcloud run deploy cleancar-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```
3. Copy the provided URL

## After Backend Deployment

1. **Update Vercel Environment Variable**:
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Update `VITE_BACKEND_URL` to your backend URL (e.g., `https://your-app.railway.app`)
   - Save and redeploy

2. **Test the Full Stack**:
   - Visit your Vercel URL
   - Check that "Backend connected ✓" shows in green
   - Upload a car image or use URL input
   - Verify classification works

## Quick Deploy Commands (After Setup)

### Update Frontend:
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys
```

### Update Backend:
```bash
git add .
git commit -m "Update backend"
git push origin main
# Railway/Render auto-deploys if connected to GitHub
```

## Environment Variables Summary

### Vercel (Frontend):
- `VITE_BACKEND_URL`: Your deployed backend URL

### Railway/Render (Backend):
- `PORT`: Auto-provided by platform
- (Optional) `ALLOWED_ORIGINS`: Custom CORS origins

## Monitoring

- **Vercel Logs**: Vercel Dashboard → Deployments → [deployment] → Logs
- **Railway Logs**: Railway Dashboard → Your Service → Logs
- **Render Logs**: Render Dashboard → Your Service → Logs

## Troubleshooting

### Frontend shows "Backend connection error"
- Check that `VITE_BACKEND_URL` is set correctly in Vercel
- Verify backend is running (visit backend URL in browser)
- Check backend logs for errors

### Backend fails to start
- Check backend logs
- Verify `requirements.txt` is complete
- Ensure start command is correct

### CORS errors
- Backend should allow your Vercel domain in CORS origins
- Update `backend/app.py` CORS settings if needed

## Cost Estimate

- **Vercel**: Free (Hobby plan)
- **Railway**: Free tier with $5/month credit (backend uses ~$5-10/month)
- **Render**: Free tier (limited, may sleep after inactivity)
- **Total**: $0-10/month depending on usage
