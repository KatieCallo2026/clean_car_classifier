#!/bin/bash
# Railway deployment start script

echo "=========================================="
echo "  CleanCar Classifier - Railway Deployment"
echo "=========================================="

# Check environment
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"

# Check model file
if [ -f "clean_car_tax_break_final_model/clean_car_eligibility_model.keras" ]; then
    echo "✅ Model file found"
    ls -lh clean_car_tax_break_final_model/
else
    echo "❌ Model file NOT found in backend directory"
    echo "Contents of backend directory:"
    ls -la
fi

# Check CSV file
if [ -f "clean_vehicle_dataset_2015_2025.csv" ]; then
    echo "✅ CSV file found"
else
    echo "❌ CSV file NOT found"
fi

echo "=========================================="
echo "Starting FastAPI server..."
echo "=========================================="

# Start the application
python app.py
