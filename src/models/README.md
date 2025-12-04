# CNN Model Integration Guide

## Overview
This directory will contain the integration code for the CNN car classifier model trained in Google Colab.

## Model Architecture
- **Model Type**: Multiclass Image Classification CNN
- **Framework**: TensorFlow/PyTorch (specify after training)
- **Input**: Car images (224x224 or 299x299 pixels)
- **Output**: Car make/model classification + eligibility status

## Deployment Options

### Option 1: REST API Backend (Recommended)
Deploy your trained model as a Flask/FastAPI backend:

```python
# Example Flask endpoint structure
from flask import Flask, request, jsonify
import tensorflow as tf
from PIL import Image
import numpy as np

app = Flask(__name__)
model = tf.keras.models.load_model('path/to/your/model.h5')

@app.route('/api/classify', methods=['POST'])
def classify():
    image = request.files['image']
    # Preprocess image
    img = Image.open(image).resize((224, 224))
    img_array = np.array(img) / 255.0
    
    # Make prediction
    prediction = model.predict(np.expand_dims(img_array, axis=0))
    
    # Return result
    return jsonify({
        'model': 'Tesla Model 3',
        'confidence': float(prediction.max()),
        'qualified': True
    })
```

### Option 2: TensorFlow.js (Browser-based)
Convert your model to TensorFlow.js format for client-side inference:

```bash
tensorflowjs_converter --input_format=keras \
    path/to/model.h5 \
    path/to/tfjs_model
```

### Option 3: Cloud Functions
Deploy as serverless function (Google Cloud Functions, AWS Lambda, etc.)

## Integration Steps

1. **Train Model in Google Colab**
   - Complete CNN training
   - Export model (`.h5`, `.pb`, or `.pth` format)
   - Save class labels and preprocessing parameters

2. **Deploy Model Backend**
   - Choose deployment option above
   - Set up API endpoint
   - Configure CORS for frontend access

3. **Update Frontend Configuration**
   - Update `VITE_API_BASE_URL` in `.env` file
   - Replace simulation code in `src/App.jsx`
   - Use `classifyCarImage()` from `src/services/api.js`

4. **Test Integration**
   - Verify API connectivity
   - Test with sample car images
   - Validate classification accuracy

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000
# Or production URL:
# VITE_API_BASE_URL=https://your-api.herokuapp.com
```

## Model Files (Not tracked in git)
Place large model files in this directory:
- `model.h5` - Keras model
- `model.pth` - PyTorch model
- `class_labels.json` - Classification labels
- `preprocessing_config.json` - Image preprocessing settings

## TODO
- [ ] Complete model training in Google Colab
- [ ] Export trained model
- [ ] Set up backend API server
- [ ] Deploy to cloud platform
- [ ] Update frontend with real API endpoint
- [ ] Add error handling for failed predictions
- [ ] Implement confidence threshold filtering
