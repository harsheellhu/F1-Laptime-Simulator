@echo off
echo =============================================
echo  F1 Lap Time Simulator — Full Stack Startup
echo =============================================
echo.

cd /d "%~dp0"

echo [1/3] Running Preprocessing...
.\venv\Scripts\python.exe f1_simulator\preprocess_real.py
if errorlevel 1 (
    echo ERROR: Preprocessing failed. Check venv and data files.
    pause
    exit /b 1
)

echo.
echo [2/3] Training Model...
.\venv\Scripts\python.exe f1_simulator\train_real.py
if errorlevel 1 (
    echo ERROR: Training failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Starting FastAPI Backend...
start "F1 Backend API" cmd /k "cd /d "%~dp0" && .\venv\Scripts\python.exe -m uvicorn f1_simulator.backend.main:app --reload --port 8000 --host 0.0.0.0"

echo.
echo [4/4] Starting React Frontend...
start "F1 React App" cmd /k "cd /d "%~dp0f1-react-app" && npm run dev"

echo.
echo =============================================
echo  Backend:  http://localhost:8000
echo  React UI: http://localhost:5173
echo  API Docs: http://localhost:8000/docs
echo =============================================
echo.
pause
