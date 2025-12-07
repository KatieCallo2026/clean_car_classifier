# CleanCar Classifier Project - PRODUCTION DEPLOYMENT ✅

## Project Overview
Full-stack web application for classifying car make/model from uploaded photos and checking California Clean Cars 4 All tax benefit eligibility using deep learning.

## Technology Stack

### Frontend (Vercel)
- React 18 with Vite
- Tailwind CSS (custom beige/green/coffee color scheme)
- Lucide React icons
- Tab-based UI (file upload + URL input)
- **Deployed**: cleancarclassifier-git-main-katie-callos-projects.vercel.app

### Backend (Railway)
- Python FastAPI server
- TensorFlow 2.20.0 / Keras model (MobileNetV2)
- CSV-based eligibility lookup (429 vehicles, 39 eligible)
- Custom CORS middleware for Vercel domains
- **Deployed**: cleancarclassifier-production.up.railway.app

### Model
- MobileNetV2 transfer learning (Cars196 dataset)
- 196 car classes
- Input: 224x224 RGB images
- Preprocessing: normalize to [-1, 1]
- Output: car make/model + eligibility status

## Deployment Status

### ✅ Completed Tasks
- [x] React frontend with Vite
- [x] FastAPI backend with Keras model
- [x] CSV eligibility checking (429 vehicles, 39 eligible)
- [x] Tab-based UI (file upload + URL input)
- [x] CORS fix for URL fetching
- [x] Reset button with animation
- [x] Git repository setup
- [x] Vercel frontend deployment
- [x] Railway backend deployment (in progress)
- [x] Environment variables configured
- [x] TensorFlow 2.20.0 compatibility

### 🔧 Current Focus
- Railway deployment with TensorFlow 2.20.0
- Production testing

## Key Files

### Frontend
- `src/App.jsx` - Main component with tabs and v2.0 badge
- `src/services/modelService.js` - API client with environment variable
- `vercel.json` - Cache control and deployment config

### Backend
- `backend/app.py` - FastAPI server with custom CORS
- `backend/clean_car_tax_break_final_model/` - Model files (26MB)
- `backend/clean_vehicle_dataset_2015_2025.csv` - Eligibility data
- `requirements.txt` - Python dependencies (TensorFlow 2.20.0)

## Environment Variables
- **Vercel**: `VITE_BACKEND_URL=https://cleancarclassifier-production.up.railway.app`
- **Railway**: `PORT` (auto-set by Railway)

## Color Palette
- **Beige**: #ede7d9 (beige-200), #f5f0e6 (beige-100)
- **Coffee**: #cb8966 (coffee-500), #a67352 (coffee-600), #41241a (coffee-950)
- **Green**: #084b3f (green-700), #4d7c52 (green-600), #e5f3ef (green-50)

## API Endpoints
- `GET /` - Health check
- `POST /predict` - Upload file classification
- `POST /predict-url` - URL-based classification
- `GET /model-info` - Model metadata
- `GET /classes` - All car classes
- `GET /eligible-cars` - Eligible vehicles only

## Development Commands

### Frontend (Local)
```bash
npm run dev          # Start Vite dev server (port 3005)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend (Local - Mac)
```bash
cd backend
source venv/bin/activate
pip install -r requirements-macos.txt  # Mac with Apple Silicon
python app.py        # Start on port 8000
```

## Recent Updates
- TensorFlow upgraded to 2.20.0 (latest stable, 2.15.0 deprecated)
- Railway deployment configured with proper build settings
- CORS middleware handles all Vercel preview URLs dynamically
- Model files (26MB) copied to backend directory
- Requirements split: `requirements.txt` (Railway/Linux), `requirements-macos.txt` (local Mac)
