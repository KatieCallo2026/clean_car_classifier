# 🚀 Quick Start Guide - CleanCar Classifier with Backend

## ✅ What's Been Set Up

Your project now uses your trained Keras model directly through a Python backend - **no conversion needed**!

### Files Created:
- ✅ `backend/app.py` - FastAPI server that loads your `.keras` model
- ✅ `backend/requirements.txt` - Python dependencies
- ✅ `backend/README.md` - Detailed backend documentation
- ✅ Updated `src/services/modelService.js` - Connects to backend API
- ✅ Updated `src/App.jsx` - Shows backend status and error handling

## 📋 Setup Steps

### Step 1: Export Metadata from Google Colab (REQUIRED)

In your Google Colab notebook, run this code:

```python
import json

# Save class names (list of 196 car model names)
with open('/content/drive/MyDrive/class_names.json', 'w') as f:
    json.dump(class_names, f, indent=2)

# Save eligibility map (list of 196 integers: 0 or 1)
with open('/content/drive/MyDrive/eligibility_map.json', 'w') as f:
    json.dump(eligibility_map.tolist(), f, indent=2)

print("✅ Files saved to Google Drive")
```

**Download these files** and place them in:
```
/CleanCars/src/services/clean_car_tax_break_final_model/
├── clean_car_eligibility_model.keras  ✅
├── model_config.json                   ✅  
├── training_history.npy                ✅
├── class_names.json                    ⬅️ ADD THIS
└── eligibility_map.json                ⬅️ ADD THIS
```

### Step 2: Install Python Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Mac/Linux
# venv\Scripts\activate  # On Windows

pip install -r requirements.txt
```

### Step 3: Start the Backend Server

```bash
python app.py
```

You should see:
```
==================================================
🚗 Starting CleanCar Classifier Backend
==================================================
Model: clean_car_eligibility_model.keras
Classes: 196
Eligible: XX
==================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal open!**

### Step 4: Start the React App (in a NEW terminal)

```bash
# In a new terminal window
cd /Users/katiecallo/CleanCars
npm run dev
```

### Step 5: Test the Application

1. Open http://localhost:3000 in your browser
2. You should see a green dot 🟢 indicating "Backend connected"
3. Upload a car image
4. Click "Analyze Car for Eligibility"
5. See real predictions from your model!

## 🔍 Troubleshooting

### Backend not connecting?

**Check 1:** Is the backend running?
```bash
# In backend terminal, you should see:
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Check 2:** Test backend directly
```bash
curl http://localhost:8000/
```

Should return:
```json
{"service":"CleanCar Classifier API","status":"running","model_loaded":true}
```

### Missing metadata warning?

If you see this in backend logs:
```
⚠️ class_names.json not found
⚠️ eligibility_map.json not found
```

The backend will work but use placeholder data. Export the files from Colab (Step 1).

### Port 8000 already in use?

```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

### TensorFlow installation issues?

**For Apple Silicon (M1/M2 Mac):**
```bash
pip uninstall tensorflow
pip install tensorflow-macos==2.15.0
pip install tensorflow-metal==1.1.0
```

**For other systems:**
```bash
pip install tensorflow==2.15.0
```

## 📊 Testing Your Model

### Test API Directly

```bash
# Test with a car image
curl -X POST "http://localhost:8000/predict" \
  -F "file=@path/to/your/car_image.jpg"
```

### View API Documentation

Open http://localhost:8000/docs for interactive Swagger UI

### Check Model Info

```bash
curl http://localhost:8000/model-info
```

## 🎯 What Happens Next

1. **Backend receives image** → Preprocesses to 224x224 RGB
2. **Model predicts** → Returns class index (0-195)
3. **Maps to car name** → From `class_names.json`
4. **Checks eligibility** → From `eligibility_map.json`
5. **Returns result** → To React frontend

## 🚀 Next Steps

- ✅ Export metadata from Colab
- ✅ Start backend server
- ✅ Test with real car images
- 📝 Update eligibility rules if needed
- 🌐 Deploy to production (see deployment guide)

## 📞 Need Help?

Check the detailed documentation:
- `backend/README.md` - Backend setup and API docs
- Main `README.md` - Full project documentation

---

**Your model is ready to use!** Just export the metadata files from Colab and start the backend. 🚗⚡
