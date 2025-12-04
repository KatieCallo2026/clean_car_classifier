/**
 * Model Service for Clean Car Classification
 * 
 * This service handles communication with the trained CNN model.
 * Currently configured for local testing with simulation mode.
 * 
 * INTEGRATION INSTRUCTIONS:
 * 1. Replace MODEL_API_ENDPOINT with your deployed model URL
 * 2. Update predictCarModel() to send actual image data to your model
 * 3. Modify response parsing to match your model's output format
 * 4. Add authentication if required by your API
 */

// Configuration
const USE_SIMULATION = true; // Set to false when real model is ready
const MODEL_API_ENDPOINT = 'https://your-model-api.com/predict'; // Replace with actual endpoint

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
 * Predicts car model from uploaded image
 * @param {File} imageFile - The uploaded car image
 * @returns {Promise<Object>} Prediction result with model name, qualification status, and confidence
 */
export async function predictCarModel(imageFile) {
    if (USE_SIMULATION) {
        return simulateModelPrediction(imageFile);
    }

    try {
        // Prepare image data for model
        const formData = new FormData();
        formData.append('image', imageFile);

        // Call your trained model API
        const response = await fetch(MODEL_API_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: {
                // Add any required headers (authentication, etc.)
                // 'Authorization': 'Bearer YOUR_API_KEY',
            }
        });

        if (!response.ok) {
            throw new Error(`Model API error: ${response.status}`);
        }

        const data = await response.json();

        // Parse model response and check qualification
        // Adjust this based on your model's actual response format
        return {
            name: data.predicted_model,
            qualified: await checkQualification(data.predicted_model),
            confidence: data.confidence,
            raw: data // Keep raw response for debugging
        };

    } catch (error) {
        console.error('Error calling model API:', error);
        throw new Error('Failed to analyze car image. Please try again.');
    }
}

/**
 * Checks if a car model qualifies for Clean Cars 4 All benefits
 * @param {string} modelName - The predicted car model name
 * @returns {Promise<boolean>} Whether the car qualifies
 */
async function checkQualification(modelName) {
    // TODO: Integrate with Clean Cars 4 All database/API
    // For now, using simple keyword matching
    const qualifiedKeywords = [
        'BEV', 'EV', 'Electric',
        'PHEV', 'Plug-in Hybrid',
        'Hybrid',
        'Tesla', 'Nissan Leaf', 'Chevrolet Bolt',
        'Prius Prime', 'Ioniq'
    ];

    const modelLower = modelName.toLowerCase();
    return qualifiedKeywords.some(keyword => 
        modelLower.includes(keyword.toLowerCase())
    );
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

    if (!ALLOWED_TYPES.includes(file.type)) {
        return { isValid: false, error: 'Invalid file type. Please upload JPG, PNG, or HEIC' };
    }

    return { isValid: true };
}

/**
 * Converts image file to base64 for API transmission (if needed)
 * @param {File} file - The image file
 * @returns {Promise<string>} Base64 encoded image
 */
export async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
