# F1 Lap Time Simulator

A full-stack machine learning application that predicts Formula 1 lap times based on historical race data. Built with **FastAPI** backend, **Streamlit** frontend, and **scikit-learn** ML models.

## Project Structure

```
f1_simulator/
├── data/                      # CSV data files
│   ├── lap_times.csv         # Lap timing data
│   ├── races.csv             # Race metadata
│   ├── drivers.csv           # Driver information
│   ├── constructors.csv      # Team information
│   └── circuits.csv          # Circuit details (length, etc.)
├── model/                     # Trained models & processed data
│   ├── model.pkl            # Default trained model
│   ├── model_random_forest.pkl
│   ├── X_processed.csv      # Feature matrix
│   ├── y.csv                # Target values
│   └── feature_names.txt    # Column names for inference
├── backend/
│   └── main.py              # FastAPI REST API server
├── frontend/
│   └── app.py               # Streamlit UI application
├── preprocess.py            # Data cleaning & feature engineering
├── train.py                 # Model training pipeline
├── generate_sample_data.py  # Create synthetic test data
└── requirements.txt         # Python dependencies
```

## Features

- **Predict single lap times** based on driver, circuit, grid position, and lap number
- **Simulate full race** with multi-lap predictions and time-based degradation
- **Comparison mode** to compare two scenarios side-by-side
- **REST API** (FastAPI) for programmatic access
- **Interactive UI** (Streamlit) with real-time predictions and visualizations
- **Multiple models**: RandomForest, GradientBoosting, XGBoost support

## Quick Start

### 1. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Get Data

**Option A: Use Sample Data** (for testing/demo)

```bash
python generate_sample_data.py
```

This creates synthetic data in `f1_simulator/data/`.

**Option B: Use Real Data** (from Kaggle)

Download the Formula 1 World Championship dataset:
- https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020

Place these CSV files in `f1_simulator/data/`:
- `lap_times.csv`
- `races.csv`
- `drivers.csv`
- `constructors.csv`
- `circuits.csv`

### 4. Preprocess Data

```bash
python preprocess.py
```

This creates `X_processed.csv` and `y.csv` in `f1_simulator/model/`.

### 5. Train Model

```bash
python train.py
```

The trained model is saved as `f1_simulator/model/model.pkl`.

### 6. Run Applications

**Start FastAPI Backend** (in one terminal):

```bash
cd f1_simulator/backend
uvicorn main:app --reload --port 8000
```

API will be available at: http://localhost:8000

**Start Streamlit Frontend** (in another terminal):

```bash
cd f1_simulator/frontend
streamlit run app.py
```

UI will open at: http://localhost:8501

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API root with info |
| GET | `/health` | Health check |
| POST | `/predict` | Predict single lap time |
| POST | `/simulate` | Simulate full race |

### Example API Request

```bash
# Single lap prediction
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"lap": 10, "grid": 5, "driverId": 1, "constructorId": 1, "circuitId": 1}'

# Full race simulation
curl -X POST "http://localhost:8000/simulate" \
  -H "Content-Type: application/json" \
  -d '{"laps": 50, "grid": 3, "driverId": 1, "constructorId": 1, "circuitId": 1}'
```

## Data Schema

### Input Features

| Field | Type | Description |
|-------|------|-------------|
| `lap` | int | Current lap number (1-70 typical) |
| `grid` | int | Starting grid position (1-20) |
| `driverId` | int | Encoded driver identifier (1-999) |
| `constructorId` | int | Encoded team identifier (1-10) |
| `circuitId` | int | Encoded circuit identifier (1-100) |
| `year` | int (optional) | Race year |
| `length` | float (optional) | Circuit length in meters |

### Output

| Field | Type | Description |
|-------|------|-------------|
| `lap_time_sec` | float | Predicted lap time in seconds |
| `lap_time_formatted` | string | Formatted as MM:SS.mmm |

## Model Details

### Algorithm

- **Default**: RandomForestRegressor (200 estimators)
- **Alternative**: GradientBoostingRegressor or XGBoost

### Features Used

- Lap number (raw)
- Grid position (raw)
- Driver ID (one-hot encoded)
- Constructor ID (one-hot encoded)
- Circuit ID (one-hot encoded)
- Race year (optional)
- Circuit length (optional)

### Performance Metrics

Sample metrics on held-out test set:
- **MAE**: ~1.2-2.5 seconds
- **RMSE**: ~1.5-3.0 seconds
- **R²**: ~0.75-0.90

(Actual results vary based on data quality and feature set.)

## Improving Accuracy

See `steps.md` for advanced improvements:

1. Add **tire wear** modeling
2. Include **pit stop** logic
3. Model **fuel load** degradation
4. Add **weather conditions**
5. Include **qualifying performance**
6. Feature: driver-team compatibility
7. Track-specific historical performance

## Troubleshooting

### Model not found
```bash
# Make sure you've run training
python train.py
```

### Missing data files
```bash
# Generate sample data or download from Kaggle
python generate_sample_data.py
```

### API connection refused
```bash
# Start backend first
cd backend
uvicorn main:app --reload
```

### Streamlit port in use
```bash
streamlit run app.py --server.port 8502
```

## Requirements

- Python 3.8+
- pandas
- numpy
- scikit-learn
- fastapi
- uvicorn
- streamlit
- matplotlib
- joblib
- xgboost (optional)

See `requirements.txt` for exact versions.

## License

MIT License - Free to use for learning and development.

## Credits

Dataset: Formula 1 World Championship Dataset (Kaggle)
Built as a complete ML engineering project demonstrating data pipeline, model training, API development, and frontend integration.
