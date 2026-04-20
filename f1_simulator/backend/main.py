"""
FastAPI Backend for F1 Lap Time Simulator
Provides REST API endpoints for lap time prediction and multi-lap simulation.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import pickle
import numpy as np
from pathlib import Path

# Create FastAPI app
app = FastAPI(
    title="F1 Lap Time Simulator API",
    description="Predict lap times using machine learning model trained on F1 historical data",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and feature handling
model_data = None
feature_names = []


# Pydantic models for request validation
class LapPredictionRequest(BaseModel):
    """Request for single lap prediction."""
    lap: int = Field(..., ge=1, le=100, description="Lap number (1-100)")
    grid: int = Field(..., ge=1, le=20, description="Starting grid position (1-20)")
    driverId: int = Field(..., description="Driver ID (encoded value from training)")
    constructorId: int = Field(..., description="Constructor ID (encoded value from training)")
    circuitId: int = Field(..., description="Circuit ID (encoded value from training)")
    year: Optional[int] = Field(None, description="Race year (optional)")
    length: Optional[float] = Field(None, ge=2000, le=7000, description="Circuit length in meters (optional)")


class SimulationRequest(BaseModel):
    """Request for multi-lap simulation."""
    laps: int = Field(..., ge=1, le=100, description="Number of laps to simulate")
    grid: int = Field(..., ge=1, le=20, description="Starting grid position")
    driverId: int = Field(..., description="Driver ID")
    constructorId: int = Field(..., description="Constructor ID")
    circuitId: int = Field(..., description="Circuit ID")
    year: Optional[int] = Field(None, description="Race year")
    length: Optional[float] = Field(None, description="Circuit length in meters")


class LapPredictionResponse(BaseModel):
    """Response for lap time prediction."""
    lap_time_sec: float
    lap_time_formatted: str


class SimulationResponse(BaseModel):
    """Response for multi-lap simulation."""
    lap_times: List[float]
    average_lap_time: float
    total_race_time: float
    fastest_lap: float
    slowest_lap: float


def load_model(model_path: str = None):
    """Load the trained model and associated metadata."""
    global model_data, feature_names

    if model_path is None:
        # Default: look for advanced model first, then legacy
        model_dir = Path(__file__).parent.parent / "model"
        advanced_path = model_dir / "advanced" / "model_xgboost.pkl"
        legacy_path = model_dir / "model.pkl"

        if advanced_path.exists():
            model_path = advanced_path
        elif legacy_path.exists():
            model_path = legacy_path
        else:
            raise FileNotFoundError(f"No model found at {model_dir}")
    else:
        model_path = Path(model_path)

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found at {model_path}")

    with open(model_path, "rb") as f:
        model_data = pickle.load(f)

    # Load feature names if available (in same dir as model)
    feature_path = model_path.parent / "feature_names.txt"
    if feature_path.exists():
        with open(feature_path, "r") as f:
            feature_names = [line.strip() for line in f.readlines()]
    else:
        # Fallback: try parent's feature_names
        alt_feature_path = model_path.parent.parent / "feature_names.txt"
        if alt_feature_path.exists():
            with open(alt_feature_path, "r") as f:
                feature_names = [line.strip() for line in f.readlines()]
        else:
            feature_names = []

    print(f"Model loaded from {model_path.name}")
    print(f"Features: {len(feature_names)}")


def prepare_input_data(
    lap: int,
    grid: int,
    driverId: int,
    constructorId: int,
    circuitId: int,
    year: Optional[int] = None,
    length: Optional[float] = None
) -> pd.DataFrame:
    """
    Prepare input data in the same format as training data.
    Creates one-hot encoded DataFrame matching training columns.
    """
    global feature_names

    # Build base input dict
    input_dict = {
        "lap": [lap],
        "grid": [grid],
        "driverId": [driverId],
        "constructorId": [constructorId],
        "circuitId": [circuitId]
    }

    if year is not None:
        input_dict["year"] = [year]

    if length is not None:
        input_dict["length"] = [length]

    # Create DataFrame
    input_df = pd.DataFrame(input_dict)

    # One-hot encode categorical features
    cat_cols = ["driverId", "constructorId", "circuitId"]
    input_encoded = pd.get_dummies(input_df, columns=cat_cols, dtype=int)

    # Ensure all training columns are present (add missing with zeros)
    if feature_names:
        for col in feature_names:
            if col not in input_encoded.columns:
                input_encoded[col] = 0

        # Reorder columns to match training
        input_encoded = input_encoded[feature_names]

    # Scale features if scaler available
    if "scaler" in model_data:
        input_scaled = model_data["scaler"].transform(input_encoded)
        return pd.DataFrame(input_scaled, columns=input_encoded.columns)

    return input_encoded


@app.get("/")
def read_root():
    """Root endpoint - API health check."""
    return {
        "message": "F1 Lap Time Simulator API",
        "status": "healthy",
        "endpoints": {
            "/predict": "POST - Predict single lap time",
            "/simulate": "POST - Simulate full race",
            "/health": "GET - Health check"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    if model_data is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy", "model_loaded": True}


@app.post("/predict", response_model=LapPredictionResponse)
def predict_lap_time(request: LapPredictionRequest):
    """
    Predict lap time for a single lap.

    Provides prediction in seconds and formatted MM:SS.mmm format.
    """
    if model_data is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Prepare input
        input_df = prepare_input_data(
            lap=request.lap,
            grid=request.grid,
            driverId=request.driverId,
            constructorId=request.constructorId,
            circuitId=request.circuitId,
            year=request.year,
            length=request.length
        )

        # Predict
        prediction = model_data["model"].predict(input_df)[0]

        # Format time
        minutes = int(prediction // 60)
        seconds = prediction % 60
        formatted = f"{minutes:02d}:{seconds:06.3f}"

        return {
            "lap_time_sec": round(float(prediction), 3),
            "lap_time_formatted": formatted
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/simulate", response_model=SimulationResponse)
def simulate_race(request: SimulationRequest):
    """
    Simulate a full race with multiple laps.

    Returns all lap times, average, total time, fastest, and slowest lap.
    """
    if model_data is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        lap_times = []

        for lap_num in range(1, request.laps + 1):
            input_df = prepare_input_data(
                lap=lap_num,
                grid=request.grid,
                driverId=request.driverId,
                constructorId=request.constructorId,
                circuitId=request.circuitId,
                year=request.year,
                length=request.length
            )
            pred = model_data["model"].predict(input_df)[0]
            lap_times.append(float(pred))

        lap_times_np = np.array(lap_times)

        return {
            "lap_times": [round(t, 3) for t in lap_times],
            "average_lap_time": round(float(lap_times_np.mean()), 3),
            "total_race_time": round(float(lap_times_np.sum()), 3),
            "fastest_lap": round(float(lap_times_np.min()), 3),
            "slowest_lap": round(float(lap_times_np.max()), 3)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@app.get("/drivers")
def get_driver_mapping():
    """
    Return driver ID mapping (placeholder - should be loaded from training data).
    """
    # In production, load from a saved driver mapping file
    return {"message": "Driver mapping endpoint - populate from training data"}


@app.get("/circuits")
def get_circuit_mapping():
    """
    Return circuit ID mapping (placeholder).
    """
    return {"message": "Circuit mapping endpoint - populate from training data"}


# Load model on startup
@app.on_event("startup")
def startup_event():
    """Load model when API starts."""
    try:
        load_model()
        print("API startup complete - model loaded.")
    except Exception as e:
        print(f"Warning: Could not load model on startup: {e}")
        print("Train the model first with train.py")
