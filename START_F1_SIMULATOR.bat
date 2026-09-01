@echo off
setlocal
cd /d "%~dp0"

echo =============================================
echo   F1 Lap Time Simulator - Quick Launch
echo =============================================
echo.

:: Check if trained model exists; train only if missing
if not exist "f1_simulator\model\model.pkl" (
    echo [Setup] Model not found. Running preprocessing and training...
    .\venv\Scripts\python.exe f1_simulator\preprocess_real.py
    if errorlevel 1 (
        echo [ERROR] Preprocessing failed.
        pause
        exit /b 1
    )
    .\venv\Scripts\python.exe f1_simulator\train_real.py
    if errorlevel 1 (
        echo [ERROR] Training failed.
        pause
        exit /b 1
    )
) else (
    echo [Ready] Pretrained ML model detected. Skipping training.
)

echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000...
start "F1 Backend API" cmd /c "cd /d "%~dp0" && .\venv\Scripts\python.exe -m uvicorn f1_simulator.backend.main:app --port 8000 --host 0.0.0.0"

echo [2/2] Starting React Frontend on http://localhost:5173...
start "F1 React App" cmd /c "cd /d "%~dp0f1-react-app" && npm run dev"

timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo =============================================
echo   Web App:  http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo =============================================
echo.
endlocal

