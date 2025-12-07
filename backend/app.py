"""
CleanCar Classifier Backend API
Uses your trained Keras MobileNetV2 model directly - no conversion needed!
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import keras
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

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic model for URL request
class ImageURLRequest(BaseModel):
    url: str

app = FastAPI(
    title="CleanCar Classifier API",
    description="Classify car images and check Clean Cars 4 All eligibility",
    version="1.0.0"
)

# Custom CORS middleware to handle Vercel wildcard domains
class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        
        # List of allowed origins
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:3004",
            "http://localhost:3005",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3004",
            "http://127.0.0.1:3005",
            "http://127.0.0.1:5173",
        ]
        
        # Check if origin matches allowed patterns
        is_allowed = False
        if origin:
            # Check exact matches
            if origin in allowed_origins:
                is_allowed = True
            # Check Vercel domains (katie-callos-projects.vercel.app)
            elif origin.endswith(".vercel.app") and "katie-callos-projects" in origin:
                is_allowed = True
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            if is_allowed and origin:
                return Response(
                    status_code=200,
                    headers={
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": "*",
                        "Access-Control-Allow-Credentials": "true",
                    }
                )
            else:
                return Response(status_code=403)
        
        # Process actual request
        response = await call_next(request)
        
        # Add CORS headers if origin is allowed
        if is_allowed and origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
        
        return response

# Add custom CORS middleware
app.add_middleware(CustomCORSMiddleware)

# ============================================
# LOAD MODEL AND METADATA
# ============================================
# Try multiple paths for model (local dev vs Railway deployment)
BACKEND_DIR = Path(__file__).parent
MODEL_DIR_OPTIONS = [
    BACKEND_DIR.parent / "src" / "services" / "clean_car_tax_break_final_model",  # Local dev
    BACKEND_DIR / "clean_car_tax_break_final_model",  # Railway (if copied)
]

MODEL_PATH = None
for model_dir in MODEL_DIR_OPTIONS:
    potential_path = model_dir / "clean_car_eligibility_model.keras"
    if potential_path.exists():
        MODEL_PATH = potential_path
        MODEL_DIR = model_dir
        break

if MODEL_PATH is None:
    logger.error("Model file not found in any expected location!")
    logger.error(f"Tried: {[str(p) for p in MODEL_DIR_OPTIONS]}")
    raise FileNotFoundError("Model file not found")

CSV_PATH = Path(__file__).parent / "clean_vehicle_dataset_2015_2025.csv"

logger.info(f"Loading model from: {MODEL_PATH}")

if not MODEL_PATH.exists():
    logger.error(f"Model file not found at: {MODEL_PATH}")
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

try:
    model = keras.models.load_model(MODEL_PATH)
    logger.info("✅ Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    raise

# Load clean vehicle CSV for eligibility checking
logger.info(f"Loading clean vehicle data from: {CSV_PATH}")
if not CSV_PATH.exists():
    logger.error(f"CSV file not found at: {CSV_PATH}")
    raise FileNotFoundError(f"CSV not found: {CSV_PATH}")

try:
    clean_vehicles_df = pd.read_csv(CSV_PATH)
    logger.info(f"✅ Loaded {len(clean_vehicles_df)} clean vehicle entries")
    logger.info(f"   CSV columns: {list(clean_vehicles_df.columns)}")
except Exception as e:
    logger.error(f"Failed to load CSV: {e}")
    raise

# Load configuration if available
CONFIG_PATH = MODEL_DIR / "model_config.json"
if CONFIG_PATH.exists():
    with open(CONFIG_PATH, "r") as f:
        config = json.load(f)
    logger.info("✅ Model config loaded")
else:
    config = {}
    logger.warning("⚠️ No model_config.json found")

# Load class names if available
CLASS_NAMES_PATH = MODEL_DIR / "class_names.json"
ELIGIBILITY_PATH = MODEL_DIR / "eligibility_map.json"

if CLASS_NAMES_PATH.exists():
    with open(CLASS_NAMES_PATH, "r") as f:
        class_names = json.load(f)
    logger.info(f"✅ Loaded {len(class_names)} class names")
else:
    # Placeholder for Cars196 dataset
    NUM_CLASSES = 196
    class_names = [f"Car Model {i}" for i in range(NUM_CLASSES)]
    logger.warning(f"⚠️ class_names.json not found. Using placeholders for {NUM_CLASSES} classes")
    logger.warning("   Please export from Colab: json.dump(class_names, open('class_names.json', 'w'))")

if ELIGIBILITY_PATH.exists():
    with open(ELIGIBILITY_PATH, "r") as f:
        eligibility_map = json.load(f)
    eligible_count = sum(eligibility_map)
    logger.info(f"✅ Loaded eligibility map: {eligible_count} eligible cars")
else:
    # Placeholder - all ineligible until you provide real data
    eligibility_map = [0] * len(class_names)
    logger.warning("⚠️ eligibility_map.json not found. Using placeholder (all ineligible)")
    logger.warning("   Please export from Colab: json.dump(eligibility_map.tolist(), open('eligibility_map.json', 'w'))")

NUM_CLASSES = len(class_names)
logger.info(f"📊 Model ready: {NUM_CLASSES} classes, {sum(eligibility_map)} eligible")

# ============================================
# BUILD ELIGIBILITY LOOKUP FROM CSV
# ============================================
def create_eligibility_lookup():
    """
    Build dictionary mapping (make, model) to eligibility status
    from the clean vehicle CSV
    """
    lookup = {}
    for _, row in clean_vehicles_df.iterrows():
        make = str(row['Make']).lower().strip()
        model = str(row['Model']).lower().strip()
        # Vehicle is eligible if Eligible_CC4A_DCAP is 'Yes'
        eligible = str(row['Eligible_CC4A_DCAP']).strip().upper() == 'YES'
        lookup[(make, model)] = eligible
    return lookup

eligibility_lookup = create_eligibility_lookup()
eligible_count_csv = sum(1 for v in eligibility_lookup.values() if v)
logger.info(f"📊 Built eligibility lookup with {len(eligibility_lookup)} unique vehicle entries")
logger.info(f"   {eligible_count_csv} eligible vehicles in CSV")

def check_eligibility_from_csv(predicted_class_name: str):
    """
    Parse Cars196 class name and check against CSV eligibility.
    
    Cars196 format: "Make Model BodyType Year"
    Example: "Tesla Model S Sedan 2012"
    
    Returns: (is_eligible: bool, reason: str)
    """
    # Parse the class name
    tokens = predicted_class_name.split()
    
    if len(tokens) < 2:
        return False, "Unable to parse car make/model from prediction"
    
    # Extract make (first token)
    make = tokens[0].lower().strip()
    
    # Extract model (tokens between make and body type/year)
    body_types = {'sedan', 'coupe', 'suv', 'convertible', 'hatchback', 
                  'wagon', 'minivan', 'pickup', 'van', 'cab', 'truck'}
    model_tokens = []
    
    for token in tokens[1:]:
        if token.lower() in body_types or token.isdigit():
            break
        model_tokens.append(token)
    
    if not model_tokens:
        return False, f"Unable to extract model name from: {predicted_class_name}"
    
    model = ' '.join(model_tokens).lower().strip()
    
    # Check eligibility in CSV
    key = (make, model)
    
    if key in eligibility_lookup:
        is_eligible = eligibility_lookup[key]
        if is_eligible:
            return True, f"✅ {make.title()} {model.title()} is eligible for Clean Cars 4 All"
        else:
            return False, f"❌ {make.title()} {model.title()} does not meet Clean Cars 4 All eligibility requirements"
    else:
        # Not in CSV database
        return False, f"❌ {make.title()} {model.title()} not found in Clean Cars 4 All eligible vehicle database"

# ============================================
# PREPROCESSING (matches your Colab code)
# ============================================
def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Preprocess image to match training pipeline:
    - Resize to 224x224
    - Convert to RGB if needed
    - Normalize for MobileNetV2 [-1, 1]
    
    This matches your Colab preprocessing:
        image = tf.image.resize(image, [224, 224])
        image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
    """
    # Convert to RGB if grayscale or RGBA
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize to 224x224 (MobileNetV2 input size)
    image = image.resize((224, 224), Image.BILINEAR)
    
    # Convert to numpy array
    img_array = np.array(image, dtype=np.float32)
    
    # MobileNetV2 preprocessing: normalize to [-1, 1]
    # Formula: (x / 127.5) - 1.0
    img_array = img_array / 127.5 - 1.0
    
    # Add batch dimension [1, 224, 224, 3]
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

# ============================================
# API ENDPOINTS
# ============================================
@app.get("/")
async def root():
    """
    Health check and basic info
    """
    return {
        "service": "CleanCar Classifier API",
        "status": "running",
        "model_loaded": True,
        "num_classes": NUM_CLASSES,
        "eligible_count": eligible_count_csv,
        "csv_entries": len(clean_vehicles_df),
        "version": "1.0.0"
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Classify car image and return eligibility status
    
    Parameters:
    - file: Uploaded image file (JPG, PNG, etc.)
    
    Returns:
    - name: Predicted car model name
    - qualified: Whether eligible for Clean Cars 4 All
    - confidence: Prediction confidence (0-100)
    - class_index: Index of predicted class (0-195)
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(400, "File must be an image (JPG, PNG, etc.)")
        
        # Read and open image
        image_bytes = await file.read()
        
        if len(image_bytes) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(400, "Image file too large (max 5MB)")
        
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Received image: {image.size}, mode: {image.mode}")
        
        # Preprocess image
        processed_image = preprocess_image(image)
        logger.info(f"Preprocessed shape: {processed_image.shape}")
        
        # Make prediction
        predictions = model.predict(processed_image, verbose=0)
        
        # Get top prediction
        predicted_class = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_class]) * 100
        
        # Get car name
        car_name = class_names[predicted_class]
        
        # Check eligibility using CSV lookup
        qualified, eligibility_reason = check_eligibility_from_csv(car_name)
        
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
async def predict_url(request: ImageURLRequest):
    """
    Classify car image from URL and return eligibility status
    
    Parameters:
    - url: Direct URL to an image file
    
    Returns:
    - name: Predicted car model name
    - qualified: Whether eligible for Clean Cars 4 All
    - confidence: Prediction confidence (0-100)
    - class_index: Index of predicted class (0-195)
    - eligibility_reason: Detailed eligibility explanation
    """
    try:
        # Fetch image from URL
        logger.info(f"Fetching image from URL: {request.url}")
        
        response = requests.get(
            request.url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': request.url
            },
            timeout=10,
            stream=True
        )
        response.raise_for_status()
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        if not content_type.startswith('image/'):
            raise HTTPException(400, f"URL does not point to an image (content-type: {content_type})")
        
        # Read image bytes
        image_bytes = response.content
        
        if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit for URLs
            raise HTTPException(400, "Image file too large (max 10MB)")
        
        # Open and process image
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Fetched image: {image.size}, mode: {image.mode}")
        
        # Preprocess image
        processed_image = preprocess_image(image)
        logger.info(f"Preprocessed shape: {processed_image.shape}")
        
        # Make prediction
        predictions = model.predict(processed_image, verbose=0)
        
        # Get top prediction
        predicted_class = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][predicted_class]) * 100
        
        # Get car name
        car_name = class_names[predicted_class]
        
        # Check eligibility using CSV lookup
        qualified, eligibility_reason = check_eligibility_from_csv(car_name)
        
        logger.info(f"Prediction: {car_name} ({confidence:.1f}% confidence)")
        logger.info(f"Eligibility: {eligibility_reason}")
        
        return {
            "name": car_name,
            "qualified": qualified,
            "confidence": round(confidence, 1),
            "class_index": predicted_class,
            "eligibility_reason": eligibility_reason
        }
        
    except requests.RequestException as e:
        logger.error(f"Failed to fetch URL: {str(e)}")
        raise HTTPException(400, f"Failed to fetch image from URL: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Prediction failed: {str(e)}")

@app.get("/model-info")
async def model_info():
    """
    Get detailed model metadata
    """
    return {
        "num_classes": NUM_CLASSES,
        "eligible_count": eligible_count_csv,
        "csv_entries": len(clean_vehicles_df),
        "model_type": "MobileNetV2 Transfer Learning",
        "input_size": [224, 224, 3],
        "has_class_names": CLASS_NAMES_PATH.exists(),
        "has_csv_data": CSV_PATH.exists(),
        "model_path": str(MODEL_PATH),
        "csv_path": str(CSV_PATH)
    }

@app.get("/classes")
async def get_classes():
    """
    Get list of all car classes with eligibility status
    """
    return [
        {
            "index": i,
            "name": class_names[i],
            "eligible": bool(eligibility_map[i] == 1)
        }
        for i in range(NUM_CLASSES)
    ]

@app.get("/eligible-cars")
async def get_eligible_cars():
    """
    Get list of only eligible car models
    """
    eligible_cars = [
        {
            "index": i,
            "name": class_names[i]
        }
        for i in range(NUM_CLASSES)
        if eligibility_map[i] == 1
    ]
    return {
        "count": len(eligible_cars),
        "cars": eligible_cars
    }

# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":
    import uvicorn
    
    # Use Railway's PORT environment variable, fallback to 8000 for local dev
    port = int(os.environ.get("PORT", 8000))
    
    logger.info("="*50)
    logger.info("🚗 Starting CleanCar Classifier Backend")
    logger.info("="*50)
    logger.info(f"Port: {port}")
    logger.info(f"Model: {MODEL_PATH.name}")
    logger.info(f"Classes: {NUM_CLASSES}")
    logger.info(f"Eligible: {sum(eligibility_map)}")
    logger.info("="*50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
