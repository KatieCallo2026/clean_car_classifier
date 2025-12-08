/**
 * Model Service for Clean Car Classification
 * 
 * This service communicates with the Python FastAPI backend
 * that serves your trained Keras MobileNetV2 model.
 * 
 * Falls back to client-side CSV matc    } catch (error) {
        console.error('Error calling backend API:', error);
        
        // Try client-side fallback if enabled
        if (USE_FALLBACK_ON_ERROR) {
            console.log('🔄 Using client-side fallback (backend unavailable)...');
            const urlLower = imageUrl.toLowerCase();
            const fallback = fallbackPrediction(urlLower);
            
            return {
                ...fallback,
                backendError: error.message,
                usingFallback: true,
                classIndex: 0
            };
        }
        
        // Provide helpful error messages
        if (error.message.includes('fetch')) {
            throw new Error(
                'Cannot connect to backend server. ' +
                'Please check your internet connection or try again later.'
            );
        }
        
        throw new Error(error.message || 'Failed to analyze car image from URL. Please try again.');
    }
}end is unavailable.
 */

import { fallbackPrediction, checkEligibilityClientSide, getEligibleVehiclesList, searchEligibleVehicles } from './fallbackService';

// Configuration
const USE_SIMULATION = false; // Using real model via backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const USE_FALLBACK_ON_ERROR = true; // Enable client-side fallback when backend fails

// Simulation data - remove when real model is integrated
const SIMULATION_MODELS = [
    { name: "Toyota Prius Prime (PHEV)", qualified: true, confidence: 0.982 },
    { name: "Tesla Model 3 (BEV)", qualified: true, confidence: 0.965 },
    { name: "Nissan Leaf (BEV)", qualified: true, confidence: 0.953 },
    { name: "Chevrolet Bolt EV (BEV)", qualified: true, confidence: 0.941 },
    { name: "Honda Accord (ICE, older model)", qualified: false, confidence: 0.878 },
    { name: "Ford F-150 (ICE, V8)", qualified: false, confidence: 0.892 },
    { name: "Toyota Camry 2015 (ICE)", qualified: false, confidence: 0.865 },
    { name: "Honda Civic 2014 (ICE)", qualified: false, confidence: 0.901 }
];

/**
 * Check if backend server is running and healthy
 * @returns {Promise<Object>} Backend status and info
 */
export async function checkBackendHealth() {
    try {
        console.log('🔍 Checking backend at:', BACKEND_URL);
        const response = await fetch(`${BACKEND_URL}/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        console.log('📡 Response status:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Backend returned status ${response.status}`);
        }
        const data = await response.json();
        console.log('✅ Backend connected:', data);
        return data;
    } catch (error) {
        console.error('❌ Backend health check failed:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            cause: error.cause
        });
        throw new Error(
            'Backend server is not running. Please start it with:\n' +
            'cd backend && python app.py'
        );
    }
}

/**
 * Get model information from backend
 * @returns {Promise<Object>} Model metadata
 */
export async function getModelInfo() {
    try {
        const response = await fetch(`${BACKEND_URL}/model-info`);
        if (!response.ok) {
            throw new Error('Failed to fetch model info');
        }
        const data = await response.json();
        return {
            loaded: true,
            numClasses: data.num_classes,
            eligibleCount: data.eligible_count,
            modelType: data.model_type,
            hasClassNames: data.has_class_names,
            hasEligibilityMap: data.has_eligibility_map
        };
    } catch (error) {
        console.error('Model info error:', error);
        return {
            loaded: false,
            numClasses: 0,
            eligibleCount: 0,
            modelType: 'MobileNetV2 (Backend)',
            error: error.message
        };
    }
}

/**
 * Predicts car model from uploaded image using backend API
 * @param {File} imageFile - The uploaded car image
 * @returns {Promise<Object>} Prediction result with model name, qualification status, and confidence
 */
export async function predictCarModel(imageFile) {
    if (USE_SIMULATION) {
        return simulateModelPrediction(imageFile);
    }

    // Validate file first
    const validation = validateImageFile(imageFile);
    if (!validation.isValid) {
        throw new Error(validation.error);
    }

    try {
        // Prepare image data for backend
        const formData = new FormData();
        formData.append('file', imageFile);

        console.log('🔄 Sending image to backend for classification...');

        // Call backend API
        const response = await fetch(`${BACKEND_URL}/predict`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Backend error: ${response.status}`);
        }

        const data = await response.json();

        console.log('🚗 Prediction received:', data);

        // Return standardized format
        return {
            name: data.name,
            qualified: data.qualified,
            confidence: data.confidence,
            classIndex: data.class_index,
            eligibilityReason: data.eligibility_reason
        };

    } catch (error) {
        console.error('Error calling backend API:', error);
        
        // Try client-side fallback if enabled
        if (USE_FALLBACK_ON_ERROR) {
            console.log('🔄 Using client-side fallback (backend unavailable)...');
            const fileName = imageFile.name.toLowerCase();
            const fallback = fallbackPrediction(fileName);
            
            return {
                ...fallback,
                backendError: error.message,
                usingFallback: true,
                classIndex: 0
            };
        }
        
        // Provide helpful error messages
        if (error.message.includes('fetch')) {
            throw new Error(
                'Cannot connect to backend server. ' +
                'Make sure it\'s running: cd backend && python app.py'
            );
        }
        
        throw new Error(error.message || 'Failed to analyze car image. Please try again.');
    }
}

/**
 * Predicts car model from image URL using backend API
 * @param {string} imageUrl - URL to the car image
 * @returns {Promise<Object>} Prediction result with model name, qualification status, and confidence
 */
export async function predictCarModelFromUrl(imageUrl) {
    if (USE_SIMULATION) {
        return simulateModelPrediction({ name: 'URL Image' });
    }

    try {
        console.log('🔄 Sending URL to backend for classification:', imageUrl);

        // Call backend API with URL
        const response = await fetch(`${BACKEND_URL}/predict-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: imageUrl })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Backend error: ${response.status}`);
        }

        const data = await response.json();

        console.log('🚗 Prediction received:', data);

        // Return standardized format
        return {
            name: data.name,
            qualified: data.qualified,
            confidence: data.confidence,
            classIndex: data.class_index,
            eligibilityReason: data.eligibility_reason
        };

    } catch (error) {
        console.error('Error calling backend API:', error);
        
        // Provide helpful error messages
        if (error.message.includes('fetch')) {
            throw new Error(
                'Cannot connect to backend server. ' +
                'Make sure it\'s running: cd backend && python app.py'
            );
        }
        
        throw new Error(error.message || 'Failed to analyze car image from URL. Please try again.');
    }
}

/**
 * Simulates model prediction for testing (remove in production)
 * @param {File} imageFile - The uploaded car image
 * @returns {Promise<Object>} Simulated prediction result
 */
async function simulateModelPrediction(imageFile) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Random selection from simulation data
    const randomIndex = Math.floor(Math.random() * SIMULATION_MODELS.length);
    const result = SIMULATION_MODELS[randomIndex];

    console.log('🔬 SIMULATION MODE: Using dummy prediction');
    console.log(`Predicted: ${result.name} (${result.confidence * 100}% confidence)`);

    return {
        ...result,
        isSimulated: true
    };
}

/**
 * Validates image file before processing
 * @param {File} file - The file to validate
 * @returns {Object} Validation result with isValid and error message
 */
export function validateImageFile(file) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];

    if (!file) {
        return { isValid: false, error: 'No file provided' };
    }

    if (file.size > MAX_SIZE) {
        return { isValid: false, error: 'File size exceeds 5MB limit' };
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        return { isValid: false, error: 'Invalid file type. Please upload JPG, PNG, or HEIC' };
    }

    return { isValid: true };
}

// Re-export fallback functions for direct use
export { checkEligibilityClientSide, getEligibleVehiclesList, searchEligibleVehicles };
