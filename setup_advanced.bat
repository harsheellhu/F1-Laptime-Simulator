@echo off
setlocal

:: F1 Lap Time Simulator - Advanced Edition One-Click Setup
:: Fetches real F1 data, trains advanced ML model, launches UI

echo ================================================
echo    F1 ADVANCED SIMULATOR - FULL SETUP
echo ================================================
echo.
echo This will:
echo   1. Install Python dependencies
echo   2. Build real driver/team/circuit databases
echo   3. Fetch real lap times from OpenF1 & Ergast APIs
echo   4. Engineer advanced features (fuel, tires, weather)
echo   5. Train XGBoost model with hyperparameter tuning
echo   6. Launch the scientific UI with real driver names
echo.
echo NOTE: Step 3 requires internet connection (~2-5 minutes)
echo.
pause

:: Set project root
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.10+ from python.org
    pause
    exit /b 1
)

:: Virtual environment
echo [1/6] Setting up virtual environment...
if not exist "venv" (
    python -m venv venv
) else (
    echo Virtual env exists.
)

:: Install deps
echo [2/6] Installing dependencies...
venv\Scripts\pip.exe install -q -r requirements.txt
if errorlevel 1 (
    echo ERROR: pip install failed
    pause
    exit /b 1
)
echo Dependencies installed.

set VENV_PY=venv\Scripts\python.exe

:: ========== STEP 2: Build databases ==========
echo [3/6] Building F1 databases (drivers, teams, circuits)...
%VENV_PY% f1_simulator\real_data_db.py
if errorlevel 1 (
    echo ERROR: real_data_db.py failed
    pause
    exit /b 1
)

:: ========== STEP 3: Fetch real data ==========
echo [4/6] Fetching real F1 data from internet...
echo   - OpenF1 API for lap times
echo   - Ergast API for historical results
echo   This may take 2-5 minutes...
%VENV_PY% f1_simulator\data_fetcher.py
if errorlevel 1 (
    echo WARNING: Data fetch failed. Check internet connection.
    echo You can manually run: python f1_simulator\data_fetcher.py
    echo Or download Kaggle dataset to f1_simulator/data/
    pause
    exit /b 1
)
echo Data fetched successfully.

:: ========== STEP 4: Feature engineering ==========
echo [5/6] Engineering features (fuel, tires, track, weather)...
%VENV_PY% f1_simulator\feature_engineering.py
if errorlevel 1 (
    echo ERROR: feature_engineering.py failed
    pause
    exit /b 1
)

:: ========== STEP 5: Train model ==========
echo [6/6] Training advanced ML model (XGBoost)...
echo This will take ~1-2 minutes...
%VENV_PY% f1_simulator\train_advanced.py
if errorlevel 1 (
    echo ERROR: train_advanced.py failed
    pause
    exit /b 1
)

echo.
echo ================================================
echo SETUP COMPLETE! Launching Advanced UI...
echo ================================================
echo.

:: ========== LAUNCH SERVERS ==========
echo Starting Streamlit (Scientific Edition UI)...
start "F1 Advanced UI" /D "f1_simulator\frontend" "..\..\venv\Scripts\python.exe" -m streamlit run app_advanced.py --server.port 8501

timeout /t 5 /nobreak >nul

echo Starting FastAPI Backend...
start "F1 FastAPI Backend" /D "f1_simulator\backend" "..\..\venv\Scripts\python.exe" -m uvicorn main:app --reload --port 8000

echo.
echo ================================================
echo ALL DONE!
echo ================================================
echo.
echo Streamlit UI:        http://localhost:8501
echo FastAPI Backend:     http://localhost:8000
echo API Documentation:   http://localhost:8000/docs
echo.
echo The UI includes real driver names (Max, Lando, Lewis, etc.)
echo with track conditions and weather selection.
echo.
echo Close this window or press any key to exit...
pause >nul
endlocal
