"""
Model Training Script for F1 Lap Time Simulator
Trains a regression model to predict lap times from features.
"""

import pandas as pd
import numpy as np
import joblib
import pickle
from pathlib import Path

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

# Optional: XGBoost
try:
    from xgboost import XGBRegressor
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False


def load_processed_data(model_path: str = None):
    """Load preprocessed features and target."""
    if model_path is None:
        # Default to model folder next to this script
        model_path = Path(__file__).parent / "model"
    else:
        model_path = Path(model_path)

    X = pd.read_csv(model_path / "X_processed.csv")
    y = pd.read_csv(model_path / "y.csv").squeeze()

    with open(model_path / "feature_names.txt", "r") as f:
        feature_names = [line.strip() for line in f.readlines()]

    return X, y, feature_names


def train_model(
    X: pd.DataFrame,
    y: pd.Series,
    model_type: str = "random_forest",
    test_size: float = 0.2,
    random_state: int = 42
):
    """
    Train a regression model and return trained model + metrics.

    model_type options: 'random_forest', 'gradient_boosting', 'xgboost'
    """
    print(f"Training {model_type} model...")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    # Scale features (improves gradient-based models)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Select model
    if model_type == "random_forest":
        model = RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1
        )
    elif model_type == "gradient_boosting":
        model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=6,
            min_samples_split=5,
            random_state=random_state
        )
    elif model_type == "xgboost" and XGBOOST_AVAILABLE:
        model = XGBRegressor(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=random_state,
            n_jobs=-1
        )
    else:
        print(f"Model type '{model_type}' not available. Using RandomForest.")
        model = RandomForestRegressor(n_estimators=100, random_state=random_state, n_jobs=-1)

    # Train model
    model.fit(X_train_scaled, y_train)

    # Predictions
    y_pred_train = model.predict(X_train_scaled)
    y_pred_test = model.predict(X_test_scaled)

    # Metrics
    train_mae = mean_absolute_error(y_train, y_pred_train)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)

    print(f"\n=== Training Results ({model_type}) ===")
    print(f"Train MAE:  {train_mae:.3f} sec")
    print(f"Test MAE:   {test_mae:.3f} sec")
    print(f"Train RMSE: {train_rmse:.3f} sec")
    print(f"Test RMSE:  {test_rmse:.3f} sec")
    print(f"Train R²:   {train_r2:.4f}")
    print(f"Test R²:    {test_r2:.4f}")

    # Cross-validation
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring="neg_mean_absolute_error")
    print(f"CV MAE:    {-cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

    return {
        "model": model,
        "scaler": scaler,
        "metrics": {
            "train_mae": train_mae,
            "test_mae": test_mae,
            "train_rmse": train_rmse,
            "test_rmse": test_rmse,
            "train_r2": train_r2,
            "test_r2": test_r2,
            "cv_mae_mean": -cv_scores.mean(),
            "cv_mae_std": cv_scores.std()
        },
        "X_test": X_test,
        "y_test": y_test,
        "y_pred_test": y_pred_test
    }


def save_model(
    model,
    scaler,
    feature_names: list,
    model_type: str,
    output_path: str = None
):
    """Save trained model, scaler, and feature names."""
    if output_path is None:
        output_path = Path(__file__).parent / "model"
    else:
        output_path = Path(output_path)
    output_path.mkdir(parents=True, exist_ok=True)

    # Save model
    model_path = output_path / f"model_{model_type}.pkl"
    with open(model_path, "wb") as f:
        pickle.dump({"model": model, "scaler": scaler, "feature_names": feature_names}, f)

    # Also save as default model.pkl
    default_path = output_path / "model.pkl"
    with open(default_path, "wb") as f:
        pickle.dump({"model": model, "scaler": scaler, "feature_names": feature_names}, f)

    print(f"\nModel saved to {model_path}")
    print(f"Default model saved to {default_path}")


def main():
    """Main training pipeline."""
    print("Loading processed data...")
    X, y, feature_names = load_processed_data()

    print(f"Data shape: {X.shape}")
    print(f"Features: {len(feature_names)}")

    # Train with RandomForest (good balance of speed & accuracy)
    results = train_model(X, y, model_type="random_forest")

    # Save the trained model
    save_model(
        results["model"],
        results["scaler"],
        feature_names,
        "random_forest"
    )

    print("\nTraining complete.")


if __name__ == "__main__":
    main()
