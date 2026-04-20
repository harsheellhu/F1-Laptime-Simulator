"""
Model Training — F1 Lap Time Simulator
XGBoost regressor on real Ergast F1 data (120K laps).
Falls back to RandomForest if XGBoost unavailable.
"""
import pandas as pd
import numpy as np
import pickle, json
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor

try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

MODEL_DIR = Path(__file__).parent / "model"

def main():
    print("=== F1 Model Training ===")

    X = pd.read_csv(MODEL_DIR / "X_processed.csv")
    y = pd.read_csv(MODEL_DIR / "y.csv").squeeze()
    with open(MODEL_DIR / "feature_names.txt") as f:
        feature_names = [l.strip() for l in f]

    print(f"Data: {X.shape}  |  target mean={y.mean():.2f}s")

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_tr)
    X_te_s  = scaler.transform(X_te)

    if HAS_XGB:
        print("Training XGBoost (400 trees)...")
        model = XGBRegressor(
            n_estimators=400, learning_rate=0.05, max_depth=7,
            subsample=0.8, colsample_bytree=0.7,
            reg_alpha=0.1, reg_lambda=1.0, min_child_weight=5,
            random_state=42, n_jobs=-1, tree_method="hist", verbosity=0,
        )
        model_name = "xgboost"
    else:
        print("Training RandomForest (300 trees)...")
        model = RandomForestRegressor(
            n_estimators=300, max_depth=20, min_samples_split=4,
            random_state=42, n_jobs=-1,
        )
        model_name = "random_forest"

    model.fit(X_tr_s, y_tr)

    yp_tr = model.predict(X_tr_s)
    yp_te = model.predict(X_te_s)

    metrics = {
        "model_type":  model_name,
        "n_samples":   int(len(X)),
        "n_features":  int(X.shape[1]),
        "train_mae":   float(mean_absolute_error(y_tr, yp_tr)),
        "test_mae":    float(mean_absolute_error(y_te, yp_te)),
        "train_rmse":  float(np.sqrt(mean_squared_error(y_tr, yp_tr))),
        "test_rmse":   float(np.sqrt(mean_squared_error(y_te, yp_te))),
        "train_r2":    float(r2_score(y_tr, yp_tr)),
        "test_r2":     float(r2_score(y_te, yp_te)),
        "y_mean":      float(y.mean()),
        "y_std":       float(y.std()),
        "feature_importances": {},
    }

    if hasattr(model, "feature_importances_"):
        fi = dict(zip(feature_names, model.feature_importances_.tolist()))
        metrics["feature_importances"] = fi
        top = sorted(fi.items(), key=lambda x: x[1], reverse=True)[:10]
        print("\nTop feature importances:")
        for k, v in top:
            print(f"  {k:<30} {v:.4f}")

    print(f"\nTest MAE={metrics['test_mae']:.3f}s  RMSE={metrics['test_rmse']:.3f}s  R²={metrics['test_r2']:.4f}")

    bundle = {"model": model, "scaler": scaler, "feature_names": feature_names, "metrics": metrics}
    with open(MODEL_DIR / "model.pkl", "wb") as f:
        pickle.dump(bundle, f)

    with open(MODEL_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nSaved model.pkl + metrics.json → {MODEL_DIR}")
    print("=== Training done ===")

if __name__ == "__main__":
    main()
