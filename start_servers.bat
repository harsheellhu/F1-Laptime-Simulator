@echo off
setlocal

:: F1 Lap Time Simulator - Quick Start (assumes model already trained)
:: Use this after initial setup to just launch the servers

echo Starting F1 Lap Time Simulator servers...
echo.

:: Set project root to the directory where this batch file resides
set "PROJECT_ROOT=%~dp0"

:: Change to project root directory
cd /d "%PROJECT_ROOT%"

:: Check if model exists
if not exist "f1_simulator\model\model.pkl" (
    echo WARNING: Trained model not found!
    echo Please run: run_f1_simulator.bat  (for first-time setup)
    echo Or run:      python f1_simulator\train.py
    echo.
    echo Expected model path: %PROJECT_ROOT%f1_simulator\model\model.pkl
    dir "f1_simulator\model\model.pkl" 2>nul
    pause
    exit /b 1
)

:: Start FastAPI backend in a new window
echo [1/2] Starting FastAPI backend server...
start "F1 Backend (FastAPI)" /D "f1_simulator\backend" "..\..\venv\Scripts\python.exe" -m uvicorn main:app --reload --port 8000

timeout /t 3 /nobreak >nul

:: Start Streamlit frontend in a new window
echo [2/2] Starting Streamlit frontend...
start "F1 Frontend (Streamlit)" /D "f1_simulator\frontend" "..\..\venv\Scripts\python.exe" -m streamlit run app.py

echo.
echo ================================================
echo Servers launched!
echo ================================================
echo FastAPI Backend:  http://localhost:8000/docs (API docs)
echo Streamlit Frontend: http://localhost:8501
echo.
echo Close this window or press any key to exit...
pause >nul
endlocal
