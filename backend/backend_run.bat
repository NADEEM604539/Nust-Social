@echo off
REM Backend Setup and Run Script
REM This script will:
REM 1. Create a virtual environment (if it doesn't exist)
REM 2. Activate the virtual environment
REM 3. Install requirements from requirements.txt
REM 4. Run the backend on port 8000 with auto-reload

echo.
echo ========================================
echo NUST Social Backend - Setup & Run
echo ========================================
echo.

REM Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org
    pause
    exit /b 1
)

echo [1/4] Checking virtual environment...
if not exist ".venv" (
    echo [1/4] Creating virtual environment...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo Error: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [1/4] Virtual environment created successfully!
) else (
    echo [1/4] Virtual environment already exists
)

echo.
echo [2/4] Activating virtual environment...
call .venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo Error: Failed to activate virtual environment
    pause
    exit /b 1
)
echo [2/4] Virtual environment activated successfully!

echo.
echo [3/4] Installing requirements...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install requirements
    pause
    exit /b 1
)
echo [3/4] Requirements installed successfully!

echo.
echo [4/4] Starting backend server on http://localhost:8000...
echo.
echo ========================================
echo Backend is running on: http://localhost:8000
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Run uvicorn with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

if %errorlevel% neq 0 (
    echo Error: Failed to start backend server
    pause
    exit /b 1
)

pause
