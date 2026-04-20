@echo off
setlocal

:: F1 Advanced Simulator - Robust Launcher
:: Uses absolute paths - works from any directory

echo ================================================
echo    F1 ADVANCED SIMULATOR
echo ================================================
echo.

:: Get absolute path to this batch file's directory
for %%I in ("%~dp0.") do set "PROJECT_ROOT=%%~fI"

echo Project root: %PROJECT_ROOT%
echo.

:: Change to project root
cd /d "%PROJECT_ROOT%"

:: Verify venv exists
if not exist "%PROJECT_ROOT%venv\Scripts\python.exe" (
    echo ERROR: Python environment not found at:
    echo   %PROJECT_ROOT%venv\Scripts\python.exe
    echo.
    echo Run setup first: run_f1_simulator.bat
    pause
    exit /b 1
)

:: Check model
set "MODEL_PATH=%PROJECT_ROOT%f1_simulator\model\model.pkl"
set "ADV_MODEL_PATH=%PROJECT_ROOT%f1_simulator\model\advanced\model_xgboost.pkl"

if exist "%ADV_MODEL_PATH%" (
    echo Advanced model detected.
    set "APP_FILE=app_advanced.py"
    set "PORT=8501"
) else if exist "%MODEL_PATH%" (
    echo Basic model detected.
    set "APP_FILE=app.py"
    set "PORT=8501"
) else (
    echo ERROR: No model found!
    echo Expected: %MODEL_PATH%
    pause
    exit /b 1
)

:: Launch frontend
echo [1/2] Starting Streamlit frontend...
start "F1 Streamlit UI" cmd /k ^
  "cd /d "%PROJECT_ROOT%f1_simulator\frontend" && ^
   "%PROJECT_ROOT%venv\Scripts\python.exe" -m streamlit run "%APP_FILE%" --server.port %PORT%"

timeout /t 5 /nobreak >nul

:: Launch backend (only needed for API calls, but UI works standalone)
echo [2/2] Starting FastAPI backend...
start "F1 FastAPI Backend" cmd /k ^
  "cd /d "%PROJECT_ROOT%f1_simulator\backend" && ^"
  "%PROJECT_ROOT%venv\Scripts\python.exe" -m uvicorn main:app --reload --port 8000"

echo.
echo ================================================
echo SERVERS STARTED
echo ================================================
echo.
echo Streamlit UI:    http://localhost:%PORT%
echo FastAPI Backend: http://localhost:8000
echo API Docs:        http://localhost:8000/docs
echo.
echo Both windows should open automatically.
echo If not, check above for error messages.
echo.
echo Press any key to close this launcher...
pause >nul
endlocal
