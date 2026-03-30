@echo off
REM NUST Social Backend Startup Script
setlocal enabledelayedexpansion

cd /d "E:\NUST SOCIAL\backend"

REM Activate virtual environment
call .\.venv\Scripts\activate.bat

REM Start uvicorn with limited reload directories (faster, avoids memory issues on Windows)
echo Starting NUST Social Backend...
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-dirs=routes,services,models,schemas

pause
