# Export Metadata from Google Colab

## 🎯 Purpose

This script exports the required metadata files for your CleanCar Classifier backend.

## 📝 Instructions

**Copy and paste this code into a new cell at the END of your Google Colab notebook** (after training is complete):

```python
import json
import numpy as np
from pathlib import Path

print("="*60)
print("  Exporting Metadata for CleanCar Classifier Backend")
print("="*60)

# Create export directory
export_dir = Path("/content/drive/MyDrive/cleancar_export")
export_dir.mkdir(parents=True, exist_ok=True)

# ============================================
# 1. Export Class Names
# ============================================
print("\n1️⃣ Exporting class names...")

# class_names should already exist in your notebook from loading cars_annos.mat
# It's a list of 196 car model strings like "Tesla Model S Sedan 2012"

if 'class_names' not in globals():
    print("❌ ERROR: class_names not found!")
    print("   Make sure you've loaded cars_annos.mat first")
else:
    class_names_path = export_dir / "class_names.json"
    with open(class_names_path, 'w') as f:
        json.dump(class_names, f, indent=2)
    
    print(f"✅ Saved {len(class_names)} class names")
    print(f"   → {class_names_path}")
    print(f"   Sample: {class_names[:3]}")

# ============================================
# 2. Export Eligibility Map
# ============================================
print("\n2️⃣ Exporting eligibility map...")

# eligibility_map should already exist in your notebook
# It's a numpy array of shape (196,) with values 0 or 1

if 'eligibility_map' not in globals():
    print("❌ ERROR: eligibility_map not found!")
    print("   Make sure you've created the eligibility mapping")
else:
    eligibility_path = export_dir / "eligibility_map.json"
    
    # Convert numpy array to Python list
    eligibility_list = eligibility_map.tolist() if hasattr(eligibility_map, 'tolist') else eligibility_map
    
    with open(eligibility_path, 'w') as f:
        json.dump(eligibility_list, f, indent=2)
    
    eligible_count = sum(eligibility_list)
    total_count = len(eligibility_list)
    
    print(f"✅ Saved eligibility map")
    print(f"   → {eligibility_path}")
    print(f"   Eligible: {eligible_count} / {total_count} ({eligible_count/total_count*100:.1f}%)")

# ============================================
# 3. Verify Model File Exists
# ============================================
print("\n3️⃣ Checking model file...")

model_path = Path("/content/drive/MyDrive/clean_car_eligibility_model.keras")

if model_path.exists():
    size_mb = model_path.stat().st_size / (1024 * 1024)
    print(f"✅ Model file found: {model_path.name}")
    print(f"   Size: {size_mb:.2f} MB")
else:
    print(f"⚠️  Model not found at: {model_path}")
    print("   Make sure you've saved it with: model.save('...')")

# ============================================
# 4. Summary
# ============================================
print("\n" + "="*60)
print("  ✅ Export Complete!")
print("="*60)
print("\nFiles to download from Google Drive:")
print(f"  1. {export_dir}/class_names.json")
print(f"  2. {export_dir}/eligibility_map.json")
print(f"  3. clean_car_eligibility_model.keras (if not already downloaded)")
print("\nPlace them in:")
print("  /CleanCars/src/services/clean_car_tax_break_final_model/")
print("\nThen start the backend:")
print("  cd backend")
print("  python app.py")
print("="*60)

# ============================================
# 5. Sample Eligible Cars (for verification)
# ============================================
if 'class_names' in globals() and 'eligibility_map' in globals():
    print("\n📋 Sample Eligible Cars:")
    eligible_indices = [i for i, e in enumerate(eligibility_list) if e == 1]
    for i, idx in enumerate(eligible_indices[:10]):
        print(f"  {i+1}. {class_names[idx]}")
    if len(eligible_indices) > 10:
        print(f"  ... and {len(eligible_indices) - 10} more")
```

## 🔄 After Running This Script

1. **Download the files from Google Drive**:
   - Go to your Google Drive
   - Navigate to `cleancar_export` folder
   - Download `class_names.json` and `eligibility_map.json`

2. **Place them in your project**:
   ```
   /CleanCars/src/services/clean_car_tax_break_final_model/
   ├── clean_car_eligibility_model.keras
   ├── model_config.json
   ├── training_history.npy
   ├── class_names.json          ⬅️ ADD THIS
   └── eligibility_map.json      ⬅️ ADD THIS
   ```

3. **Verify the files**:
   ```bash
   ls -lh src/services/clean_car_tax_break_final_model/
   ```

4. **Start the backend**:
   ```bash
   cd backend
   python app.py
   ```

## ✅ Expected Output

When you run the backend with the metadata files, you should see:

```
✅ Model loaded successfully
✅ Model config loaded
✅ Loaded 196 class names
✅ Loaded eligibility map: XX eligible cars
📊 Model ready: 196 classes, XX eligible
```

Without the metadata files, you'll see warnings:

```
⚠️ class_names.json not found. Using placeholders
⚠️ eligibility_map.json not found. Using placeholder
```

The backend will still work, but predictions will show generic names and all cars will be marked as ineligible.

## 🐛 Troubleshooting

**"class_names not found"**
- Make sure you've run the section of your notebook that loads `cars_annos.mat`
- The variable should be created like: `class_names = [cn[0] for cn in mat["class_names"][0]]`

**"eligibility_map not found"**
- Make sure you've run the section that creates the eligibility mapping
- It should be a numpy array or list with 196 elements (0 or 1)

**Files not showing in Google Drive**
- Wait a few seconds and refresh
- Check the `cleancar_export` folder
- Make sure Google Drive is mounted: `from google.colab import drive; drive.mount('/content/drive')`
