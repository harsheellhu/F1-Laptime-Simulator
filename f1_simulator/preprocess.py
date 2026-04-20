"""
Data Preprocessing Script for F1 Lap Time Simulator
Loads raw CSV data, performs feature engineering, and prepares training data.
"""

import pandas as pd
import numpy as np
from pathlib import Path


def load_and_merge_data(data_path: str = None) -> pd.DataFrame:
    """
    Load all required CSV files and merge them into a single DataFrame.

    Expected files in data_path:
        - lap_times.csv
        - races.csv
        - drivers.csv
        - constructors.csv
        - circuits.csv (optional, for circuit features)
    """
    if data_path is None:
        data_path = Path(__file__).parent / "data"
    else:
        data_path = Path(data_path)

    # Check if all required files exist
    required_files = ["lap_times.csv", "races.csv", "drivers.csv", "constructors.csv"]
    missing = [f for f in required_files if not (data_path / f).exists()]

    if missing:
        raise FileNotFoundError(f"Missing required files: {missing}")

    # Load CSVs
    lap_times = pd.read_csv(data_path / "lap_times.csv")
    races = pd.read_csv(data_path / "races.csv")
    drivers = pd.read_csv(data_path / "drivers.csv")
    constructors = pd.read_csv(data_path / "constructors.csv")

    # Merge step-by-step
    df = lap_times.merge(races, on="raceId", how="inner", suffixes=("", "_race"))
    df = df.merge(drivers, on="driverId", how="inner", suffixes=("", "_driver"))
    df = df.merge(constructors, on="constructorId", how="inner", suffixes=("", "_constructor"))

    # Load circuits if available (to get circuit length)
    if (data_path / "circuits.csv").exists():
        circuits = pd.read_csv(data_path / "circuits.csv")
        df = df.merge(circuits[["circuitId", "length"]], on="circuitId", how="left")
        # Fill missing circuit lengths with median
        df["length"] = df["length"].fillna(df["length"].median())

    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Perform feature engineering on the merged DataFrame.
    """
    # Convert milliseconds to seconds
    df["lap_time_sec"] = df["milliseconds"] / 1000

    # Remove outliers: lap times > 3 standard deviations
    mean_time = df["lap_time_sec"].mean()
    std_time = df["lap_time_sec"].std()
    df = df[(df["lap_time_sec"] >= mean_time - 3 * std_time) &
            (df["lap_time_sec"] <= mean_time + 3 * std_time)]

    # Select base features
    feature_cols = ["lap", "grid", "circuitId", "driverId", "constructorId"]

    # Add circuit length if available
    if "length" in df.columns:
        feature_cols.append("length")

    # Add race year if available
    if "year" in df.columns:
        feature_cols.append("year")

    # Keep only necessary columns
    cols_to_keep = feature_cols + ["lap_time_sec"]
    df = df[cols_to_keep].dropna()

    return df


def encode_categorical_features(df: pd.DataFrame, target_col: str = "lap_time_sec"):
    """
    One-hot encode categorical features and return X, y, and feature names.
    """
    y = df[target_col]
    X = df.drop(columns=[target_col])

    # Identify categorical columns
    cat_cols = ["driverId", "constructorId", "circuitId"]

    # One-hot encode
    X_encoded = pd.get_dummies(X, columns=cat_cols, dtype=int)

    return X_encoded, y, list(X_encoded.columns)


def save_processed_data(X: pd.DataFrame, y: pd.Series, feature_names: list, output_path: str = None):
    """
    Save processed features, target, and feature names for training.
    """
    if output_path is None:
        output_path = Path(__file__).parent / "model"
    else:
        output_path = Path(output_path)
    output_path.mkdir(parents=True, exist_ok=True)

    # Save feature names for later use in inference
    with open(output_path / "feature_names.txt", "w") as f:
        f.write("\n".join(feature_names))

    # Save processed data
    X.to_csv(output_path / "X_processed.csv", index=False)
    y.to_csv(output_path / "y.csv", index=False)

    print(f"Processed data saved to {output_path}")


def main():
    """Main preprocessing pipeline."""
    print("Loading and merging data...")
    df = load_and_merge_data()

    print(f"Initial merged shape: {df.shape}")

    print("Engineering features...")
    df = engineer_features(df)

    print(f"After feature engineering shape: {df.shape}")

    print("Encoding categorical features...")
    X, y, feature_names = encode_categorical_features(df)

    print(f"Final feature matrix shape: {X.shape}")
    print(f"Number of features: {len(feature_names)}")

    save_processed_data(X, y, feature_names)

    print("Preprocessing complete.")


if __name__ == "__main__":
    main()
