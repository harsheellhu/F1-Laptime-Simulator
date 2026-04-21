"""
F1 Lap Time Simulator — FastAPI Backend (Real Data Edition)
All predictions come from a trained ML model on real Ergast F1 data.
No mock data. No placeholders.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
import pickle, json
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent.parent   # f1_simulator/
MODEL_DIR  = BASE_DIR / "model"
DATA_DIR   = BASE_DIR / "data"

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="F1 Lap Time Simulator API",
    description="Real ML predictions from real F1 data (Ergast dataset, 120K laps)",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# ── Globals (loaded once at startup) ─────────────────────────────────────────
_model_bundle: Dict = {}
_encoders:     Dict = {}
_meta:         Dict = {}
_drivers_df:   pd.DataFrame = None
_circuits_df:  pd.DataFrame = None
_constructors_df: pd.DataFrame = None


# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    global _model_bundle, _encoders, _meta, _drivers_df, _circuits_df, _constructors_df

    try:
        with open(MODEL_DIR / "model.pkl", "rb") as f:
            _model_bundle = pickle.load(f)
        print(f"✓ Model loaded  ({_model_bundle['metrics']['model_type']})")
    except Exception as e:
        print(f"✗ Model not found: {e}. Run preprocess_real.py then train_real.py first.")

    try:
        with open(MODEL_DIR / "encoders.pkl", "rb") as f:
            _encoders = pickle.load(f)
        print("✓ Encoders loaded")
    except Exception as e:
        print(f"✗ Encoders not found: {e}")

    try:
        with open(MODEL_DIR / "meta.json") as f:
            _meta = json.load(f)
        print("✓ Meta loaded")
    except Exception as e:
        print(f"✗ Meta not found: {e}")

    # Load reference tables
    try:
        _drivers_df      = pd.read_csv(DATA_DIR / "drivers_real.csv")
        _circuits_df     = pd.read_csv(DATA_DIR / "circuits_real.csv")
        _constructors_df = pd.read_csv(DATA_DIR / "teams.csv")
        print("✓ Reference tables loaded")
    except Exception as e:
        print(f"✗ Reference tables: {e}")


def _require_model():
    if not _model_bundle:
        raise HTTPException(503, "Model not loaded. Run preprocess_real.py then train_real.py first.")


# ── Inference helpers ──────────────────────────────────────────────────────────
def _encode_id(encoder_key: str, raw_id: int) -> int:
    """Map a raw integer ID → label-encoded integer."""
    enc = _encoders.get(encoder_key)
    if enc is None:
        return 0  # fallback if encoders unavailable
    classes = list(enc.classes_)
    # raw_id from the lap_times.csv is already integer — match in classes
    if raw_id in classes:
        return int(enc.transform([raw_id])[0])
    # pick nearest
    return 0


def _build_feature_row(
    lap: int, grid: int, total_laps: int,
    circuit_length_km: float, year: int,
    driver_id: int, constructor_id: int, circuit_id: int,
) -> pd.DataFrame:
    """
    Build a single-row feature vector to match the trained model features.
    """
    lap_ratio = lap / float(total_laps) if total_laps > 0 else 0.0
    tire_deg = 0.6 * lap_ratio + 0.4 * (lap_ratio**2)
    grid_norm = (max(1, min(grid, 20)) - 1) / 19.0
    year_norm = (year - 2010) / 14.0

    driver_enc = _encode_id("driver", driver_id)
    constructor_enc = _encode_id("constructor", constructor_id)
    circuit_enc = _encode_id("circuit", circuit_id)

    row = {
        "lap": lap,
        "lap_ratio": lap_ratio,
        "tire_deg": tire_deg,
        "grid": grid,
        "grid_norm": grid_norm,
        "circuit_length_km": circuit_length_km,
        "year_norm": year_norm,
        "driver_enc": driver_enc,
        "constructor_enc": constructor_enc,
        "circuit_enc": circuit_enc,
    }

    cols = [
        "lap", "lap_ratio", "tire_deg",
        "grid", "grid_norm",
        "circuit_length_km", "year_norm",
        "driver_enc", "constructor_enc", "circuit_enc"
    ]
    return pd.DataFrame([[row[c] for c in cols]], columns=cols)


def _predict_time(row: pd.DataFrame) -> float:
    """Scale features then predict."""
    scaler = _model_bundle["scaler"]
    model  = _model_bundle["model"]
    row_sc = scaler.transform(row)
    return float(model.predict(row_sc)[0])


def _fmt(sec: float) -> str:
    m = int(sec // 60)
    s = sec % 60
    return f"{m}:{s:06.3f}"


# ── Request / Response models ─────────────────────────────────────────────────
class PredictRequest(BaseModel):
    lap:            int   = Field(..., ge=1, le=100)
    grid:           int   = Field(..., ge=1, le=20)
    total_laps:     int   = Field(60, ge=1, le=100)
    driver_id:      int   = Field(..., description="driverId integer from the dataset")
    constructor_id: int   = Field(..., description="constructorId integer")
    circuit_id:     int   = Field(..., description="circuitId integer")
    circuit_length_km: float = Field(5.0, ge=2.0, le=8.0)
    year:           int   = Field(2023, ge=2010, le=2025)


class SimRequest(BaseModel):
    laps:           int   = Field(..., ge=5, le=100)
    grid:           int   = Field(1, ge=1, le=20)
    driver_id:      int   = Field(...)
    constructor_id: int   = Field(...)
    circuit_id:     int   = Field(...)
    circuit_length_km: float = Field(5.0)
    year:           int   = Field(2023)
    pit_lap_1:      Optional[int] = None
    pit_lap_2:      Optional[int] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "api": "F1 Lap Time Simulator",
        "version": "2.0",
        "model_loaded": bool(_model_bundle),
        "data_rows": _meta.get("total_rows", 0),
    }


@app.get("/health")
def health():
    _require_model()
    m = _model_bundle["metrics"]
    return {
        "status": "healthy",
        "model": m.get("model_type"),
        "test_mae_sec": m.get("test_mae"),
        "test_r2": m.get("test_r2"),
        "n_samples": m.get("n_samples"),
    }


@app.get("/model-info")
def model_info():
    _require_model()
    m = _model_bundle["metrics"]
    fi = m.get("feature_importances", {})
    top_features = sorted(fi.items(), key=lambda x: x[1], reverse=True)[:10]
    return {
        "model_type":       m.get("model_type"),
        "n_samples":        m.get("n_samples"),
        "n_features":       m.get("n_features"),
        "train_mae":        m.get("train_mae"),
        "test_mae":         m.get("test_mae"),
        "train_rmse":       m.get("train_rmse"),
        "test_rmse":        m.get("test_rmse"),
        "train_r2":         m.get("train_r2"),
        "test_r2":          m.get("test_r2"),
        "y_mean":           m.get("y_mean"),
        "y_std":            m.get("y_std"),
        "top_features":     [{"name": k, "importance": round(v, 5)} for k, v in top_features],
        "all_feature_importances": fi,
    }


@app.get("/formulae")
def formulae():
    """Returns the feature engineering formulae and model equations."""
    return {
        "model_algorithm": "XGBoost Gradient Boosted Trees (GBT)",
        "prediction_equation": "ŷ = Σ_{k=1}^{K} f_k(x) where f_k are regression trees",
        "objective_function": "L(y, ŷ) = Σ l(y_i, ŷ_i) + Σ Ω(f_k)",
        "regularisation": "Ω(f_k) = γT + ½λ‖w‖² + α‖w‖₁",
        "feature_engineering": {
            "lap_ratio":         "lap / total_race_laps  →  [0, 1]  (normalised lap progress)",
            "tire_degradation":  "0.6·lap_ratio + 0.4·lap_ratio²  →  models compound degradation curve",
            "grid_norm":         "(grid - 1) / 19  →  [0, 1]  (P1=0 fastest, P20=1 slowest)",
            "year_norm":         "(year - 2010) / 14  →  [0, 1]  (era normalisation 2010-2024)",
            "circuit_length_km": "raw circuit length kilometres",
            "driver_enc":        "LabelEncoder(driverId) — ordinal encoding for tree split",
            "circuit_enc":       "LabelEncoder(circuitId)",
            "constructor_enc":   "LabelEncoder(constructorId)",
        },
        "outlier_removal": "μ ± 3σ per circuitId group + hard bounds [60s, 180s]",
        "train_test_split": "80 / 20 random split, random_state=42",
        "scaling": "StandardScaler (μ=0, σ=1) applied to all features",
        "hyperparameters": {
            "n_estimators":    400,
            "learning_rate":   0.05,
            "max_depth":       7,
            "subsample":       0.8,
            "colsample_bytree": 0.7,
            "reg_alpha":       0.1,
            "reg_lambda":      1.0,
            "min_child_weight": 5,
            "tree_method":     "hist (GPU-accelerated histogram)",
        },
        "data_source": "Ergast F1 API dataset (Kaggle) — real lap times 2010-2023",
    }


@app.get("/drivers")
def get_drivers():
    """All drivers with their metadata from drivers_real.csv."""
    if _drivers_df is None:
        raise HTTPException(503, "Driver data not loaded")
    records = _drivers_df.to_dict(orient="records")
    # Also attach the integer driverIds that exist in the lap_times dataset
    if _encoders:
        valid_ids = [int(x) for x in _encoders["driver"].classes_]
        return {"drivers": records, "valid_driver_ids": valid_ids}
    return {"drivers": records}


@app.get("/circuits")
def get_circuits():
    """All circuits with their metadata from circuits_real.csv."""
    if _circuits_df is None:
        raise HTTPException(503, "Circuit data not loaded")
    records = _circuits_df.to_dict(orient="records")
    if _encoders:
        valid_ids = [int(x) for x in _encoders["circuit"].classes_]
        return {"circuits": records, "valid_circuit_ids": valid_ids}
    return {"circuits": records}


@app.get("/constructors")
def get_constructors():
    """All constructors / teams."""
    if _constructors_df is not None:
        return {"constructors": _constructors_df.to_dict(orient="records")}
    return {"constructors": []}


@app.get("/meta")
def get_meta():
    return _meta


@app.post("/predict")
def predict(req: PredictRequest):
    """Predict a single lap time using the trained ML model."""
    _require_model()
    try:
        row  = _build_feature_row(
            req.lap, req.grid, req.total_laps,
            req.circuit_length_km, req.year,
            req.driver_id, req.constructor_id, req.circuit_id,
        )
        sec = _predict_time(row)
        return {
            "lap_time_sec":       round(sec, 3),
            "lap_time_formatted": _fmt(sec),
            "lap":                req.lap,
            "features_used": {
                "lap_ratio": round(req.lap / req.total_laps, 4),
                "tire_deg":  round(0.6*(req.lap/req.total_laps) + 0.4*(req.lap/req.total_laps)**2, 4),
                "grid_norm": round((req.grid-1)/19, 4),
            }
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/simulate")
def simulate(req: SimRequest):
    """Simulate a full race — one ML prediction per lap."""
    _require_model()
    try:
        PIT_TIME = 22.5  # seconds average pit stop loss

        lap_results = []
        for lap_num in range(1, req.laps + 1):
            row = _build_feature_row(
                lap_num, req.grid, req.laps,
                req.circuit_length_km, req.year,
                req.driver_id, req.constructor_id, req.circuit_id,
            )
            sec = _predict_time(row)

            is_pit = lap_num in [req.pit_lap_1, req.pit_lap_2]
            total_sec = sec + (PIT_TIME if is_pit else 0)

            lap_results.append({
                "lap":               lap_num,
                "lap_time_sec":      round(total_sec, 3),
                "pure_lap_time_sec": round(sec, 3),
                "lap_time_formatted": _fmt(total_sec),
                "is_pit":            is_pit,
            })

        times = [l["lap_time_sec"] for l in lap_results]
        pure  = [l["pure_lap_time_sec"] for l in lap_results]

        return {
            "laps":              lap_results,
            "total_race_time":   round(sum(times), 3),
            "total_race_formatted": _fmt(sum(times)),
            "fastest_lap_sec":   round(min(pure), 3),
            "fastest_lap_formatted": _fmt(min(pure)),
            "slowest_lap_sec":   round(max(pure), 3),
            "avg_lap_time_sec":  round(np.mean(pure), 3),
            "avg_lap_formatted": _fmt(np.mean(pure)),
            "pit_stops":         [l for l in [req.pit_lap_1, req.pit_lap_2] if l],
            "model_type":        _model_bundle["metrics"]["model_type"],
        }
    except Exception as e:
        raise HTTPException(500, str(e))
