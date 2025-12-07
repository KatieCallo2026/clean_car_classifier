# CleanCar Classifier Backend

Python FastAPI backend for serving your trained Keras MobileNetV2 model.

## ✅ No Model Conversion Needed!

This backend uses your `.keras` file directly - no TensorFlow.js conversion required.

## Setup

### 1. Create Python Virtual Environment

```bash
cd backend
python3 -m venv venv
```

### 2. Activate Virtual Environment

**On Mac/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- FastAPI (web framework)
- TensorFlow (to load your .keras model)
- Pillow (image processing)
- Uvicorn (ASGI server)

### 4. Add Metadata Files (IMPORTANT!)

You need to export these from your Google Colab notebook:

**In your Colab, run:**

```python
import json

# 1. Save class names (list of 196 car model strings)
with open('/content/drive/MyDrive/class_names.json', 'w') as f:
    json.dump(class_names, f, indent=2)

# 2. Save eligibility map (list of 196 integers: 0 or 1)
with open('/content/drive/MyDrive/eligibility_map.json', 'w') as f:
    json.dump(eligibility_map.tolist(), f, indent=2)
```

**Then download these files and place them in:**
```
/CleanCars/src/services/clean_car_tax_break_final_model/
├── clean_car_eligibility_model.keras  ✅ (already here)
├── model_config.json                   ✅ (already here)
├── training_history.npy                ✅ (already here)
├── class_names.json                    ⚠️ (ADD THIS)
└── eligibility_map.json                ⚠️ (ADD THIS)
```

**Note:** The backend will work without these files, but will use placeholder data (all cars marked as ineligible).

### 5. Run the Server

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

The API will be available at **http://localhost:8000**

## API Endpoints

### `GET /`
Health check and basic info
```json
{
  "service": "CleanCar Classifier API",
  "status": "running",
  "model_loaded": true,
  "num_classes": 196,
  "eligible_count": 25
}
```

### `POST /predict`
Classify a car image

**Request:** Upload image file as `multipart/form-data`

**Response:**
```json
{
  "name": "Tesla Model 3 Sedan 2017",
  "qualified": true,
  "confidence": 94.3,
  "class_index": 123
}
```

### `GET /model-info`
Get detailed model metadata

### `GET /classes`
Get all car classes with eligibility status

### `GET /eligible-cars`
Get only eligible car models

## Testing the API

### Using cURL:
```bash
curl -X POST "http://localhost:8000/predict" \
  -F "file=@path/to/car_image.jpg"
```

### Using Python:
```python
import requests

with open('car.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/predict',
        files={'file': f}
    )
    print(response.json())
```

### Using the React App:
Just start the React dev server and it will automatically connect to this backend!

## Troubleshooting

### Port 8000 already in use
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

### TensorFlow installation issues
If you have Apple Silicon (M1/M2 Mac), use:
```bash
pip install tensorflow-macos==2.15.0
pip install tensorflow-metal==1.1.0
```

### Model not found
Make sure the path in `app.py` correctly points to your `.keras` file.

### CORS errors
The backend is configured to allow requests from `localhost:3000` and `localhost:5173` (Vite default ports).

## Development

### Run with auto-reload:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### View API docs:
Open http://localhost:8000/docs for interactive Swagger UI documentation

## Production Deployment

For production, you can deploy this to:
- **Google Cloud Run** (recommended for TensorFlow)
- **AWS Lambda** (with custom container)
- **Heroku** with Docker
- **Railway** or **Render**

See deployment guides in the main README.
