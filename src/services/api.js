// API Service for CNN Model Integration
// This file provides the interface for communicating with the trained CNN model

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const MODEL_ENDPOINT = '/api/classify';

/**
 * Classifies a car image using the trained CNN model
 * @param {File} imageFile - The uploaded car image file
 * @returns {Promise<Object>} - Classification result with car model and eligibility
 */
export async function classifyCarImage(imageFile) {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`${API_BASE_URL}${MODEL_ENDPOINT}`, {
            method: 'POST',
            body: formData,
            // Add headers if needed for authentication
            // headers: {
            //     'Authorization': `Bearer ${token}`
            // }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Expected response format:
        // {
        //     model: "Tesla Model 3",
        //     make: "Tesla",
        //     year: 2023,
        //     type: "BEV",
        //     confidence: 0.982,
        //     qualified: true,
        //     reason: "Zero-emission battery electric vehicle"
        // }
        
        return {
            success: true,
            data: {
                name: `${data.make} ${data.model}${data.year ? ` (${data.year})` : ''}`,
                qualified: data.qualified,
                confidence: data.confidence,
                vehicleType: data.type,
                reason: data.reason
            }
        };
    } catch (error) {
        console.error('Classification API Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Gets the eligibility status for a specific car model
 * @param {string} make - Car manufacturer
 * @param {string} model - Car model
 * @param {number} year - Model year
 * @returns {Promise<Object>} - Eligibility information
 */
export async function checkEligibility(make, model, year) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/eligibility`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ make, model, year })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Eligibility Check Error:', error);
        throw error;
    }
}

/**
 * Health check for the model API
 * @returns {Promise<boolean>} - True if API is available
 */
export async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('API Health Check Failed:', error);
        return false;
    }
}
