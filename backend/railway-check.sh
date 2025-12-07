#!/bin/bash
# Railway Deployment Pre-Check Script

echo "🔍 Railway Deployment Check"
echo "================================"

echo "📁 Checking files..."
if [ -f "backend/app.py" ]; then
    echo "  ✅ app.py found"
else
    echo "  ❌ app.py NOT FOUND"
    exit 1
fi

if [ -f "backend/clean_car_tax_break_final_model/clean_car_eligibility_model.keras" ]; then
    echo "  ✅ Model file found (26MB)"
else
    echo "  ❌ Model file NOT FOUND"
    exit 1
fi

if [ -f "backend/clean_vehicle_dataset_2015_2025.csv" ]; then
    echo "  ✅ CSV file found"
else
    echo "  ❌ CSV file NOT FOUND"
    exit 1
fi

if [ -f "requirements.txt" ]; then
    echo "  ✅ requirements.txt found"
else
    echo "  ❌ requirements.txt NOT FOUND"
    exit 1
fi

echo ""
echo "✅ All files present!"
echo ""
echo "📝 Railway Manual Configuration Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Custom Start Command:"
echo "   cd backend && uvicorn app:app --host 0.0.0.0 --port \$PORT --workers 1"
echo ""
echo "2. Healthcheck Path:"
echo "   /health"
echo ""
echo "3. Click 'Deploy' to trigger new deployment"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
