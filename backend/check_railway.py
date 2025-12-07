"""
Railway Deployment Pre-Check Script
Verifies all dependencies and files are present before deployment
"""
import sys
import os
from pathlib import Path

def check_files():
    """Check if required files exist"""
    print("🔍 Checking required files...")
    
    required_files = {
        "app.py": ["app.py"],
        "Model file": ["clean_car_tax_break_final_model/clean_car_eligibility_model.keras"],
        "CSV data": ["clean_vehicle_dataset_2015_2025.csv"],
    }
    
    missing = []
    for name, paths in required_files.items():
        found = any(Path(p).exists() for p in paths)
        
        if found:
            print(f"  ✅ {name}")
        else:
            print(f"  ❌ {name} NOT FOUND")
            missing.append(name)
    
    return len(missing) == 0

def check_imports():
    """Check if required packages can be imported"""
    print("\n🔍 Checking Python packages...")
    
    packages = [
        ("fastapi", "FastAPI"),
        ("tensorflow", "TensorFlow"),
        ("pandas", "Pandas"),
        ("PIL", "Pillow"),
        ("numpy", "NumPy"),
        ("uvicorn", "Uvicorn"),
    ]
    
    failed = []
    for module, name in packages:
        try:
            __import__(module)
            print(f"  ✅ {name}")
        except ImportError as e:
            print(f"  ❌ {name}: {e}")
            failed.append(name)
    
    return len(failed) == 0

def check_environment():
    """Check environment variables"""
    print("\n🔍 Checking environment...")
    
    port = os.environ.get("PORT")
    if port:
        print(f"  ✅ PORT={port}")
    else:
        print(f"  ⚠️  PORT not set (will use 8000 for local)")
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("Railway Deployment Pre-Check")
    print("=" * 60)
    
    files_ok = check_files()
    imports_ok = check_imports()
    env_ok = check_environment()
    
    print("\n" + "=" * 60)
    if files_ok and imports_ok and env_ok:
        print("✅ All checks passed! Ready for Railway deployment.")
        print("=" * 60)
        sys.exit(0)
    else:
        print("❌ Some checks failed. Fix issues before deploying.")
        print("=" * 60)
        sys.exit(1)
