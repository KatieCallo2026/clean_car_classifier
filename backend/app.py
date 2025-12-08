"""
CleanCar Classifier Backend API - Railway Production Version
With startup event for lazy model loading and proper health checks
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import tensorflow as tf
import numpy as np
import pandas as pd
from PIL import Image
import json
import io
import os
from pathlib import Path
import logging
import requests
from pydantic import BaseModel
import sys

# Setup logging with explicit stdout for Railway
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Pydantic model for URL request
class ImageURLRequest(BaseModel):
    url: str

app = FastAPI(
    title="CleanCar Classifier API",
    description="Classify car images and check Clean Cars 4 All eligibility",
    version="2.0.0"
)

# Custom CORS middleware for Vercel + Railway
class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info(f"Request: {request.method} {request.url.path} from {request.client.host if request.client else 'unknown'}")
        
        origin = request.headers.get("origin", "")
        host = request.headers.get("host", "")
        
        # Patterns to allow (includes Railway healthcheck)
        allowed_patterns = [
            "localhost",
            "127.0.0.1",
            "katie-callos-projects.vercel.app",
            "cleancarclassifier",
            "healthcheck.railway.app",
            "railway.app"
        ]
        
        is_allowed = any(pattern in origin for pattern in allowed_patterns) or any(pattern in host for pattern in allowed_patterns)
        
        response = await call_next(request)
        
        if is_allowed or not origin:
            response.headers["Access-Control-Allow-Origin"] = origin or "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        
        return response

app.add_middleware(CustomCORSMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# GLOBAL STATE
# ============================================
model = None
clean_vehicles_df = None
eligibility_lookup = {}
class_names = []
config = {}
MODEL_LOADING = False
MODEL_LOADED = False

# ============================================
# STARTUP EVENT
# ============================================
@app.on_event("startup")
async def startup_event():
    """Load model and data on startup - keeps import fast for health checks"""
    global model, clean_vehicles_df, eligibility_lookup, class_names, config
    global MODEL_LOADING, MODEL_LOADED
    
    MODEL_LOADING = True
    
    logger.info("=" * 80)
    logger.info("🚀 CleanCar Classifier API - Starting Up")
    logger.info("=" * 80)
    logger.info(f"🐍 Python: {sys.version}")
    logger.info(f"📦 TensorFlow: {tf.__version__}")
    logger.info(f"📁 Working Directory: {Path.cwd()}")
    logger.info(f"🌐 PORT: {os.environ.get('PORT', 'not set')}")
    
    # Find model
    BACKEND_DIR = Path(__file__).parent
    MODEL_DIR_OPTIONS = [
        BACKEND_DIR / "clean_car_tax_break_final_model",
        BACKEND_DIR.parent / "src" / "services" / "clean_car_tax_break_final_model",
    ]
    
    MODEL_PATH = None
    MODEL_DIR = None
    for model_dir in MODEL_DIR_OPTIONS:
        potential_path = model_dir / "clean_car_eligibility_model.keras"
        abs_path = potential_path.absolute()
        logger.info(f"🔍 Checking: {abs_path} - exists={potential_path.exists()}")
        if potential_path.exists():
            MODEL_PATH = potential_path
            MODEL_DIR = model_dir
            logger.info(f"✅ Found model at: {abs_path}")
            break
    
    if MODEL_PATH is None:
        logger.error("❌ Model file not found!")
        logger.error(f"   Tried: {[str(p) for p in MODEL_DIR_OPTIONS]}")
        logger.error(f"   Current directory contents: {list(Path('.').iterdir())}")
        MODEL_LOADING = False
        return
    
    # Load model
    try:
        logger.info(f"🔄 Loading TensorFlow/Keras model ({MODEL_PATH.stat().st_size / 1024 / 1024:.1f} MB)...")
        model = tf.keras.models.load_model(MODEL_PATH)
        logger.info(f"✅ Model loaded! Input: {model.input_shape}, Output: {model.output_shape}")
        MODEL_LOADED = True
    except Exception as e:
        logger.error(f"❌ Model loading failed: {e}", exc_info=True)
        MODEL_LOADING = False
        return
    
    # Load CSV
    CSV_PATH = BACKEND_DIR / "clean_vehicle_dataset_2015_2025.csv"
    if CSV_PATH.exists():
        try:
            logger.info(f"🔄 Loading eligibility data...")
            clean_vehicles_df = pd.read_csv(CSV_PATH)
            logger.info(f"✅ Loaded CSV with {len(clean_vehicles_df)} entries")
        except Exception as e:
            logger.error(f"❌ CSV loading failed: {e}", exc_info=True)
    else:
        logger.warning(f"⚠️  CSV not found at {CSV_PATH}")
        clean_vehicles_df = pd.DataFrame()
    
    # Load class names
    class_names_path = MODEL_DIR / "class_names.json"
    if class_names_path.exists():
        try:
            with open(class_names_path, "r") as f:
                class_names = json.load(f)
            logger.info(f"✅ Loaded {len(class_names)} class names")
        except Exception as e:
            logger.warning(f"⚠️  Class names failed: {e}")
            class_names = [f"Car Model {i}" for i in range(196)]
    else:
        class_names = [f"Car Model {i}" for i in range(196)]
    
    # Load config
    CONFIG_PATH = MODEL_DIR / "model_config.json"
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r") as f:
                config = json.load(f)
            logger.info(f"✅ Loaded model config")
        except Exception as e:
            logger.warning(f"⚠️  Config failed: {e}")
    
    # Build eligibility lookup
    if clean_vehicles_df is not None and not clean_vehicles_df.empty:
        for _, row in clean_vehicles_df.iterrows():
            make = str(row['Make']).lower().strip()
            model_name = str(row['Model']).lower().strip()
            eligible = str(row['Eligible_CC4A_DCAP']).strip().upper() == 'YES'
            eligibility_lookup[(make, model_name)] = eligible
        
        eligible_count = sum(1 for v in eligibility_lookup.values() if v)
        logger.info(f"📊 Eligibility lookup: {len(eligibility_lookup)} vehicles, {eligible_count} eligible")
    
    MODEL_LOADING = False
    logger.info("=" * 80)
    logger.info("✅ Startup Complete - Ready to serve!")
    logger.info("=" * 80)

# ============================================
# HEALTH CHECK ENDPOINTS
# ============================================
@app.get("/")
async def root(request: Request):
    """Root endpoint - basic status check"""
    logger.info(f"Root endpoint called from {request.client.host if request.client else 'unknown'}")
    return {
        "service": "CleanCar Classifier API",
        "status": "running",
        "version": "2.0.0",
        "model_loaded": MODEL_LOADED
    }

@app.get("/health")
async def health(request: Request):
    """
    Railway healthcheck endpoint
    Must return 200 status code when ready
    """
    logger.info(f"Health check from {request.client.host if request.client else 'unknown'} - host: {request.headers.get('host')}")
    
    if MODEL_LOADING:
        logger.warning("Health check: Model still loading...")
        raise HTTPException(
            status_code=503, 
            detail="Service starting up - model loading in progress"
        )
    
    if not MODEL_LOADED or model is None:
        logger.error("Health check: Model not loaded!")
        raise HTTPException(
            status_code=503,
            detail="Model failed to load"
        )
    
    health_data = {
        "status": "healthy",
        "model_loaded": MODEL_LOADED,
        "csv_loaded": clean_vehicles_df is not None and not clean_vehicles_df.empty,
        "num_classes": len(class_names),
        "eligible_vehicles": len([v for v in eligibility_lookup.values() if v]),
        "total_vehicles": len(eligibility_lookup),
        "tensorflow_version": tf.__version__,
        "python_version": sys.version.split()[0]
    }
    
    logger.info(f"✅ Health check passed: {health_data}")
    return health_data

# ============================================
# ELIGIBILITY CHECKING
# ============================================
def check_eligibility(predicted_class_name: str):
    """Parse Cars196 class name and check CSV eligibility"""
    tokens = predicted_class_name.split()
    
    if len(tokens) < 2:
        return False, "Unable to parse car make/model"
    
    make = tokens[0].lower().strip()
    
    body_types = {'sedan', 'coupe', 'suv', 'convertible', 'hatchback', 
                  'wagon', 'minivan', 'pickup', 'van', 'cab', 'truck'}
    model_tokens = []
    
    for token in tokens[1:]:
        if token.lower() in body_types or token.isdigit():
            break
        model_tokens.append(token)
    
    if not model_tokens:
        return False, "Unable to extract model name"
    
    model_name = " ".join(model_tokens).lower().strip()
    
    logger.info(f"Checking eligibility for: make='{make}', model='{model_name}'")
    
    if (make, model_name) in eligibility_lookup:
        is_eligible = eligibility_lookup[(make, model_name)]
        if is_eligible:
            return True, f"✅ {make.title()} {model_name.title()} is eligible for Clean Cars 4 All"
        else:
            return False, f"❌ {make.title()} {model_name.title()} is not eligible"
    else:
        return False, f"❌ {make.title()} {model_name.title()} not found in database"

# ============================================
# IMAGE PREPROCESSING
# ============================================
def preprocess_image(image: Image.Image) -> np.ndarray:
    """Preprocess image for MobileNetV2"""
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    image = image.resize((224, 224), Image.BILINEAR)
    img_array = np.array(image, dtype=np.float32)
    img_array = img_array / 127.5 - 1.0  # Normalize to [-1, 1]
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

# ============================================
# PREDICTION ENDPOINTS
# ============================================
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Classify car image from file upload"""
    if not MODEL_LOADED or model is None:
        raise HTTPException(503, "Model not loaded - service starting up")
    
    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(400, "File must be an image")
        
        image_bytes = await file.read()
        
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(400, "Image file too large (max 5MB)")
        
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Received image: {image.size}, mode: {image.mode}")
        
        processed_image = preprocess_image(image)
        predictions = model.predict(processed_image, verbose=0)
        
        predicted_class = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_class]) * 100
        
        car_name = class_names[predicted_class]
        qualified, eligibility_reason = check_eligibility(car_name)
        
        logger.info(f"Prediction: {car_name} ({confidence:.1f}% confidence)")
        logger.info(f"Eligibility: {eligibility_reason}")
        
        return {
            "name": car_name,
            "qualified": qualified,
            "confidence": round(confidence, 1),
            "class_index": predicted_class,
            "eligibility_reason": eligibility_reason
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Prediction failed: {str(e)}")

@app.post("/predict-url")
async def predict_url(data: ImageURLRequest):
    """Classify car image from URL"""
    if not MODEL_LOADED or model is None:
        raise HTTPException(503, "Model not loaded - service starting up")
    
    try:
        logger.info(f"Fetching image from URL: {data.url}")
        
        response = requests.get(
            data.url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'image/*',
            },
            timeout=10,
            stream=True
        )
        response.raise_for_status()
        
        content_type = response.headers.get('content-type', '')
        if not content_type.startswith('image/'):
            raise HTTPException(400, f"URL does not point to an image (got {content_type})")
        
        image_bytes = response.content
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(400, "Image too large (max 5MB)")
        
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Fetched image: {image.size}, mode: {image.mode}")
        
        processed_image = preprocess_image(image)
        predictions = model.predict(processed_image, verbose=0)
        
        predicted_class = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_class]) * 100
        
        car_name = class_names[predicted_class]
        qualified, eligibility_reason = check_eligibility(car_name)
        
        logger.info(f"Prediction: {car_name} ({confidence:.1f}% confidence)")
        logger.info(f"Eligibility: {eligibility_reason}")
        
        return {
            "name": car_name,
            "qualified": qualified,
            "confidence": round(confidence, 1),
            "class_index": predicted_class,
            "eligibility_reason": eligibility_reason
        }
        
    except HTTPException:
        raise
    except requests.RequestException as e:
        logger.error(f"Failed to fetch URL: {str(e)}")
        raise HTTPException(400, f"Failed to fetch image from URL: {str(e)}")
    except Exception as e:
        logger.error(f"URL prediction error: {e}", exc_info=True)
        raise HTTPException(500, f"URL prediction error: {str(e)}")

# ============================================
# INFO ENDPOINTS
# ============================================
@app.get("/model-info")
async def model_info():
    """Get model metadata"""
    if not MODEL_LOADED or model is None:
        raise HTTPException(503, "Model not loaded")
    
    return {
        "model_loaded": MODEL_LOADED,
        "num_classes": len(class_names),
        "classes": class_names[:10],
        "total_csv_entries": len(clean_vehicles_df) if clean_vehicles_df is not None else 0,
        "model_type": "MobileNetV2 Transfer Learning",
        "input_size": [224, 224, 3],
        "tensorflow_version": tf.__version__
    }

@app.get("/classes")
async def get_classes():
    """Get all class names"""
    if not MODEL_LOADED:
        raise HTTPException(503, "Model not loaded")
    return {"classes": class_names, "count": len(class_names)}

@app.get("/eligible-cars")
async def get_eligible_cars():
    """Get list of eligible cars"""
    if clean_vehicles_df is None or clean_vehicles_df.empty:
        raise HTTPException(503, "CSV data not loaded")
    
    eligible_cars = []
    for _, row in clean_vehicles_df.iterrows():
        eligible_cars.append({
            "make": row["Make"],
            "model": row["Model"],
            "year": row["Year"] if "Year" in row else "N/A"
        })
    
    return {"eligible_cars": eligible_cars, "count": len(eligible_cars)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"🚀 Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
