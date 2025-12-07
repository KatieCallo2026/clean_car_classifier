#!/bin/bash

# CleanCar Backend Startup Script

echo "=========================================="
echo "  Starting CleanCar Classifier Backend"
echo "=========================================="

# Activate virtual environment
source /Users/katiecallo/CleanCars/backend/venv/bin/activate

# Navigate to backend directory
cd /Users/katiecallo/CleanCars/backend

# Export metadata files status
echo ""
echo "📋 Checking required files..."

if [ -f "../src/services/clean_car_tax_break_final_model/clean_car_eligibility_model.keras" ]; then
    echo "✅ Model file found"
else
    echo "❌ Model file NOT found"
fi

if [ -f "../src/services/clean_car_tax_break_final_model/class_names.json" ]; then
    echo "✅ class_names.json found"
else
    echo "⚠️  class_names.json NOT found (will use placeholders)"
fi

if [ -f "../src/services/clean_car_tax_break_final_model/eligibility_map.json" ]; then
    echo "✅ eligibility_map.json found"
else
    echo "⚠️  eligibility_map.json NOT found (will use placeholders)"
fi

echo ""
echo "🚀 Starting FastAPI server..."
echo "   Backend will be at: http://localhost:8000"
echo "   Press Ctrl+C to stop"
echo ""

# Start the server
python app.py
