# Railway Deployment Guide

## 🚂 Quick Start

This project is configured for automatic deployment to Railway with the following structure:

```
CleanCars/
├── requirements.txt          # Python dependencies (Railway uses this)
├── railway.toml              # Railway configuration
├── nixpacks.toml             # Build configuration
└── backend/
    ├── app.py                # FastAPI application
    ├── clean_car_tax_break_final_model/
    │   └── clean_car_eligibility_model.keras (26MB)
    └── clean_vehicle_dataset_2015_2025.csv
```

## ⚙️ Required Manual Configuration in Railway

After pushing code to GitHub, configure these settings in Railway Dashboard:

### 1. Custom Start Command
**Location**: Railway → Your Service → Settings → Deploy → Custom Start Command

**Value**:
```bash
cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT --workers 1
```

### 2. Healthcheck Path
**Location**: Railway → Settings → Deploy → Healthcheck Path

**Value**:
```
/health
```

### 3. Root Directory (Optional)
**Location**: Railway → Settings → Source → Root Directory

**Value**: Leave empty or set to `/`

## 🔍 Verification Steps

### Step 1: Check Build Logs
After deployment starts, watch for:
```
✅ Installing tensorflow==2.20.0
✅ Installing fastapi, uvicorn, pandas...
✅ Build complete
```

### Step 2: Check Deploy Logs
```
🔄 Loading model from backend/clean_car_tax_break_final_model/...
✅ Model loaded successfully
✅ Loaded 429 clean vehicle entries
📊 Built eligibility lookup with 39 eligible vehicles
🚀 Starting server on port [PORT]
INFO: Uvicorn running on http://0.0.0.0:[PORT]
```

### Step 3: Test Endpoints

**Health Check**:
```bash
curl https://cleancarclassifier-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "csv_loaded": true,
  "eligible_vehicles": 39
}
```

**API Info**:
```bash
curl https://cleancarclassifier-production.up.railway.app/
```

Expected response:
```json
{
  "service": "CleanCar Classifier API",
  "status": "running",
  "model_loaded": true,
  "num_classes": 196,
  "eligible_count": 39,
  "csv_entries": 429,
  "version": "1.0.0"
}
```

## 📦 Dependencies

- **Python**: 3.10
- **TensorFlow**: 2.20.0 (latest stable)
- **FastAPI**: 0.104.1
- **Uvicorn**: 0.24.0
- **Pandas**: 2.2.0
- **NumPy**: 1.26.4

## 🔧 Troubleshooting

### Build Fails
- Check that `requirements.txt` is in the root directory
- Verify TensorFlow 2.20.0 is specified (not 2.15.0 or 2.16.2)

### Deployment Crashes
- Verify Custom Start Command is set correctly
- Check Deploy logs for Python errors
- Ensure model file exists in `backend/clean_car_tax_break_final_model/`

### Health Check Fails
- Set Healthcheck Path to `/health`
- Verify server started on correct PORT
- Check logs for model loading errors

## 📊 Expected Deployment Timeline

1. **Build**: 3-5 minutes (installing TensorFlow)
2. **Deploy**: 1-2 minutes (starting server)
3. **Total**: ~5-7 minutes for first deployment

## 🎯 Success Indicators

✅ Build shows "Successfully installed tensorflow-2.20.0"  
✅ Deploy logs show "Model loaded successfully"  
✅ Healthcheck returns 200 status  
✅ Service status shows "Active" (green)  

## 🔗 Endpoints

- `GET /` - Service info and status
- `GET /health` - Health check (for Railway)
- `POST /predict` - Upload image for classification
- `POST /predict-url` - Classify image from URL
- `GET /model-info` - Model metadata
- `GET /classes` - All 196 car classes
- `GET /eligible-cars` - Eligible vehicles only

## 🌐 CORS Configuration

The backend automatically handles CORS for:
- All Vercel preview URLs containing "katie-callos-projects"
- Localhost (ports 3000, 3004, 3005, 5173)
- Any domain containing "cleancarclassifier"

## 📝 Environment Variables

Railway automatically sets:
- `PORT` - Dynamic port assignment
- `RAILWAY_ENVIRONMENT` - Deployment environment

No manual environment variables needed!

## 🚀 Post-Deployment

Once Railway shows "Active":

1. **Update Vercel Environment Variable**:
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Add `VITE_BACKEND_URL` = `https://cleancarclassifier-production.up.railway.app`
   - Redeploy Vercel

2. **Test Full Stack**:
   - Visit your Vercel frontend
   - Should show "Backend connected" (green)
   - Try uploading a car image
   - Verify classification and eligibility checking works

## 📞 Support

If deployment fails after following all steps, check:
1. Railway build logs (full output)
2. Railway deploy logs (Python errors)
3. Healthcheck endpoint response
4. GitHub Actions (if enabled)

---

**Last Updated**: December 7, 2025  
**TensorFlow Version**: 2.20.0  
**Python Version**: 3.10
