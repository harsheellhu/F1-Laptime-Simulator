"""
Ultra-safe Preprocessing
"""
import sys

print("[1/8] Starting Python script...", flush=True)

try:
    print("[2/8] Importing pandas...", flush=True)
    import pandas as pd
    print("      Pandas imported successfully.", flush=True)
    
    print("[3/8] Importing numpy & sklearn...", flush=True)
    import numpy as np
    from sklearn.preprocessing import LabelEncoder
    import json, pickle
    from pathlib import Path
    print("      Dependencies imported.", flush=True)
except Exception as e:
    print(f"FAILED TO IMPORT: {e}")
    sys.exit(1)

DATA_DIR = Path(__file__).parent / "data"
MODEL_DIR = Path(__file__).parent / "model"
MODEL_DIR.mkdir(exist_ok=True)

def main():
    try:
        print("[4/8] Loading lap_times.csv...", flush=True)
        lap = pd.read_csv(DATA_DIR / "lap_times.csv")
        print(f"      Loaded {len(lap)} rows.", flush=True)

        print("[5/8] Loading races & circuits...", flush=True)
        races = pd.read_csv(DATA_DIR / "races.csv")[["raceId","year","circuitId"]]
        circs = pd.read_csv(DATA_DIR / "circuits.csv")[["circuitId","length"]]

        print("[6/8] Merging & Filtering data...", flush=True)
        df = lap.merge(races, on="raceId", how="inner", suffixes=('', '_race'))
        # Keep the original circuitId from lap_times (circuitId), drop the duplicate from races
        if 'circuitId_race' in df.columns:
            df = df.drop(columns=['circuitId_race'])
        df = df.merge(circs, on="circuitId", how="left")
        
        df["lap_time_sec"] = df["milliseconds"] / 1000.0
        
        # Hard bounds instead of groupby stats to save CPU
        df = df[(df["lap_time_sec"] >= 60) & (df["lap_time_sec"] <= 180)].copy()

        df["lap_ratio"] = df["lap"] / 60.0  # Approx race length
        df["tire_deg"] = 0.6 * df["lap_ratio"] + 0.4 * (df["lap_ratio"]**2)
        df["circuit_length_km"] = df["length"].fillna(5000) / 1000.0
        df["year_norm"] = (df["year"] - 2010) / 14.0
        df["grid_norm"] = (df["grid"].clip(1,20) - 1) / 19.0

        print("[7/8] Label Encoding...", flush=True)
        enc_driver = LabelEncoder().fit(df["driverId"])
        enc_constr = LabelEncoder().fit(df["constructorId"])
        enc_circ = LabelEncoder().fit(df["circuitId"])

        df["driver_enc"] = enc_driver.transform(df["driverId"])
        df["constructor_enc"] = enc_constr.transform(df["constructorId"])
        df["circuit_enc"] = enc_circ.transform(df["circuitId"])

        FEATURE_COLS = [
            "lap", "lap_ratio", "tire_deg",
            "grid", "grid_norm",
            "circuit_length_km", "year_norm",
            "driver_enc", "constructor_enc", "circuit_enc",
        ]

        df_clean = df[FEATURE_COLS + ["lap_time_sec"]].dropna()
        X = df_clean[FEATURE_COLS]
        y = df_clean["lap_time_sec"]

        print(f"[8/8] Saving data (Shape: {X.shape})...", flush=True)
        X.to_csv(MODEL_DIR / "X_processed.csv", index=False)
        y.to_csv(MODEL_DIR / "y.csv", index=False)

        with open(MODEL_DIR / "feature_names.txt", "w") as f:
            f.write("\n".join(FEATURE_COLS))

        meta = {
            "feature_cols": FEATURE_COLS,
            "driver_ids": [int(x) for x in enc_driver.classes_],
            "constructor_ids": [int(x) for x in enc_constr.classes_],
            "circuit_ids": [int(x) for x in enc_circ.classes_],
            "target_mean": float(y.mean())
        }
        with open(MODEL_DIR / "meta.json", "w") as f:
            json.dump(meta, f, indent=2)

        encoders = {"driver": enc_driver, "constructor": enc_constr, "circuit": enc_circ}
        with open(MODEL_DIR / "encoders.pkl", "wb") as f:
            pickle.dump(encoders, f)

        print("\n✅ PREPROCESSING COMPLETELY FINISHED!")

    except Exception as e:
        print(f"\n[X] ERROR CRASH IN PREPROCESSING: {e}")

if __name__ == "__main__":
    main()
