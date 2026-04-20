@echo off
setlocal

:: F1 Lap Time Simulator - Advanced Frontend Launcher
:: Launches Streamlit UI with real driver data

echo ================================================
echo    F1 ADVANCED SIMULATOR - LAUNCHING UI
echo ================================================
echo.

:: Set project root
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

:: Check virtual environment
if not exist "venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please run: run_f1_simulator.bat  (First-time setup)
    pause
    exit /b 1
)

echo [1/2] Checking model...

:: Check if advanced model exists, else fall back to legacy
if exist "f1_simulator\model\advanced\model_xgboost.pkl" (
    echo Advanced model found - launching scientific UI
    set MODEL_TYPE=advanced
) else if exist "f1_simulator\model\model.pkl" (
    echo Legacy model found - launching basic UI
    set MODEL_TYPE=legacy
) else (
    echo ERROR: No trained model found!
    echo Please train the model first:
    echo   python f1_simulator\train_advanced.py
    echo   (or run run_f1_simulator.bat for full setup)
    pause
    exit /b 1
)

:: Launch Streamlit frontend
echo [2/2] Starting Streamlit UI...
echo.

if "%MODEL_TYPE%"=="advanced" (
    start "F1 Advanced Simulator" /D "f1_simulator\frontend" "..\..\venv\Scripts\python.exe" -m streamlit run app_advanced.py --server.port 8501
) else (
    start "F1 Basic Simulator" /D "f1_simulator\frontend" "..\..\venv\Scripts\python.exe" -m streamlit run app.py --server.port 8501
)

timeout /t 3 /nobreak >nul

echo ================================================
echo UI launched!
echo ================================================
echo.
echo Scientific UI: http://localhost:8501
echo.
echo Press any key to exit...
pause >nul
endlocal
