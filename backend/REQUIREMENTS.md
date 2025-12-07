# Backend Requirements Files

## For Railway Deployment (Linux)
- **requirements.txt** - Railway/Linux deployment (no Mac dependencies)
  - Uses `tensorflow==2.16.2` (standard Linux version)
  - No `tensorflow-macos` or `tensorflow-metal`

## For Local Development (Mac)
- **requirements-macos.txt** - Mac M1/M2/M3/M4 development
  - Uses `tensorflow-macos==2.16.2` (Apple Silicon optimized)
  - Uses `tensorflow-metal==1.2.0` (GPU acceleration)

## Installation

### On Railway (automatic)
Railway automatically uses `requirements.txt`

### On Mac (local development)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-macos.txt
```

### On Linux (local)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
