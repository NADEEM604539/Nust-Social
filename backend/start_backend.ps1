# NUST Social Backend Startup Script (PowerShell)

Set-Location "E:\NUST SOCIAL\backend"

# Activate virtual environment
& .\.venv\Scripts\Activate.ps1

# Start uvicorn with limited reload directories
# This avoids the Windows memory issue with extensive file watching
Write-Host "🚀 Starting NUST Social Backend..." -ForegroundColor Green
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-dirs=routes,services,models,schemas
