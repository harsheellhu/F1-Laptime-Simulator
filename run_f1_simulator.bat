@echo off
setlocal

echo ================================================
echo    F1 LAP TIME SIMULATOR - ONE CLICK SETUP
echo ================================================
echo.

:: Set project root to the directory where this batch file resides
set "PROJECT_ROOT=%~dp0"

:: Change to project root directory
cd /d "%PROJECT_ROOT%"

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from python.org
    pause
    exit /b 1
)

echo [1/7] Python found. Setting up virtual environment...
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo [2/7] Installing dependencies...
if not exist "venv\Scripts\pip.exe" (
    echo ERROR: pip not found in venv
    pause
    exit /b 1
)
venv\Scripts\pip.exe install -q -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully.

:: Set path to venv python
set VENV_PYTHON=venv\Scripts\python.exe

echo.
echo [3/7] Generating sample data...
%VENV_PYTHON% f1_simulator\generate_sample_data.py
if errorlevel 1 (
    echo ERROR: Failed to generate sample data
    pause
    exit /b 1
)
echo Sample data generated.

echo.
echo [4/7] Preprocessing data...
%VENV_PYTHON% f1_simulator\preprocess.py
if errorlevel 1 (
    echo ERROR: Failed to preprocess data
    pause
    exit /b 1
)
echo Data preprocessed.

echo.
echo [5/7] Training model...
%VENV_PYTHON% f1_simulator\train.py
if errorlevel 1 (
    echo ERROR: Failed to train model
    pause
    exit /b 1
)
echo Model trained successfully.

echo.
echo ================================================
echo SETUP COMPLETE! Starting servers...
echo ================================================
echo.

:: Start FastAPI backend in a new window
echo [6/7] Starting FastAPI backend server...
start "F1 Backend (FastAPI)" /D "f1_simulator\backend" "..\..\venv\Scripts\python.exe" -m uvicorn main:app --reload --port 8000

timeout /t 3 /nobreak >nul

:: Start Streamlit frontend in a new window
echo [7/7] Starting Streamlit frontend...
start "F1 Frontend (Streamlit)" /D "f1_simulator\frontend" "..\..\venv\Scripts\python.exe" -m streamlit run app.py

echo.
echo ================================================
echo ALL DONE! Servers are starting...
echo ================================================
echo.
echo FastAPI Backend:  http://localhost:8000
echo Streamlit Frontend: http://localhost:8501
echo.
echo Close this window or press any key to exit...
pause >nul
endlocal
