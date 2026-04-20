"""
Advanced Feature Engineering for F1 Lap Time Prediction
Incorporates: tire degradation, fuel load, track evolution, driver/team performance,
weather effects, and complex interactions
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import StandardScaler, LabelEncoder
import warnings
warnings.filterwarnings('ignore')


class AdvancedFeatureEngineer:
    """
    Advanced feature engineering with realistic F1 physics and strategy.
    """

    def __init__(self, data_dir: str = "f1_simulator/data"):
        self.data_dir = Path(data_dir)
        self.drivers_df = None
        self.teams_df = None
        self.circuits_df = None
        self.weather_df = None
        self.scaler = StandardScaler()
        self._load_databases()

    def _load_databases(self):
        """Load all reference databases."""
        try:
            self.drivers_df = pd.read_csv(self.data_dir / "drivers_real.csv")
            self.teams_df = pd.read_csv(self.data_dir / "teams.csv")
            self.circuits_df = pd.read_csv(self.data_dir / "circuits_real.csv")
            self.weather_df = pd.read_csv(self.data_dir / "weather.csv")
            print(f"Loaded databases: {len(self.drivers_df)} drivers, {len(self.teams_df)} teams, {len(self.circuits_df)} circuits")
        except FileNotFoundError as e:
            print(f"Warning: Database not found - {e}")
            print("Run real_data_db.py first to create databases")

    def create_lap_time_dataset(self,
                                 start_year: int = 2024,
                                 end_year: int = 2024,
                                 include_weather: bool = True,
                                 include_telemetry: bool = False,
                                 sample_races: int = None) -> pd.DataFrame:
        """
        Create comprehensive lap time dataset with all engineered features.

        Parameters:
        -----------
        start_year : int
            Starting season year
        end_year : int
            Ending season year
        include_weather : bool
            Whether to include weather condition features
        include_telemetry : bool
            Whether to include telemetry (sector times, speed traps)
        sample_races : int, optional
            Limit to N races for faster prototyping

        Returns:
        --------
        pd.DataFrame with engineered features
        """
        print(f"\nCreating lap time dataset ({start_year}-{end_year})...")

        # Load lap times data
        laps_file = self.data_dir / f"lap_times_{end_year}.csv"
        if not laps_file.exists():
            raise FileNotFoundError(f"Lap times not found at {laps_file}. Run data_fetcher.py first.")

        laps_df = pd.read_csv(laps_file)
        print(f"Loaded {len(laps_df)} raw lap records")

        # Load races to get circuit mapping
        races_file = self.data_dir / f"races_{end_year}.csv"
        races_df = pd.read_csv(races_file)

        # Drop columns that will be merged from driver/circuit tables
        # (they may exist in synthetic data but are redundant)
        cols_to_drop = ['constructorId', 'circuitId']
        for col in cols_to_drop:
            if col in laps_df.columns:
                laps_df = laps_df.drop(columns=col)

        # Merge with driver info (adds constructorId, team, skills)
        merged = laps_df.merge(
            self.drivers_df[['driverId', 'fullName', 'constructorId', 'team',
                            'qualifying_skill', 'race_skill', 'wet_skill', 'age', 'experience']],
            on='driverId', how='left'
        )

        # Merge with race info to get circuitId
        merged = merged.merge(races_df[['raceId', 'circuitId']], on='raceId', how='left')

        # Merge with circuit characteristics
        merged = merged.merge(self.circuits_df, on='circuitId', how='left')

        # Calculate total laps per race from the data (max lap number)
        total_laps_per_race = merged.groupby('raceId')['lap'].max().reset_index()
        total_laps_per_race.columns = ['raceId', 'laps']
        merged = merged.merge(total_laps_per_race, on='raceId', how='left')

        if sample_races:
            unique_races = merged['raceId'].unique()[:sample_races]
            merged = merged[merged['raceId'].isin(unique_races)]
            print(f"Sampled {len(merged)} laps from {sample_races} races")

        # Feature engineering
        print("Engineering features...")
        features = self._apply_feature_engineering(merged, include_weather, include_telemetry)

        print(f"Final dataset: {len(features)} laps, {len(features.columns)} features")
        return features

    def _apply_feature_engineering(self, df: pd.DataFrame, add_weather: bool, add_telemetry: bool) -> pd.DataFrame:
        """Apply comprehensive feature engineering pipeline."""

        result = df.copy()

        # ===== 1. Time-based features =====
        result['lap_norm'] = result['lap'] / result['laps']  # normalized lap position (0-1)
        result['lap_sq'] = result['lap'] ** 2  # quadratic term for non-linear deg

        # Phase of race (start, middle, end)
        result['race_phase_early'] = (result['lap'] <= 15).astype(int)
        result['race_phase_mid'] = ((result['lap'] > 15) & (result['lap'] <= 45)).astype(int)
        result['race_phase_late'] = (result['lap'] > 45).astype(int)

        # ===== 2. Fuel load degradation =====
        # F1 cars start with ~110kg fuel, burn ~1.5-1.8kg per lap
        # Lap time improves as fuel burns (lighter car) - ~0.3-0.5s per lap early on
        base_fuel = 110  # kg
        fuel_per_lap = 1.6  # kg/lap average
        result['fuel_load_kg'] = base_fuel - (fuel_per_lap * result['lap'])
        result['fuel_load_kg'] = result['fuel_load_kg'].clip(lower=0)  # can't go negative
        result['fuel_load_norm'] = result['fuel_load_kg'] / base_fuel  # 0-1

        # Fuel effect (linear improvement as fuel burns)
        result['fuel_effect'] = (1 - result['fuel_load_norm']) * 0.4  # up to 0.4s improvement

        # ===== 3. Tire degradation =====
        # Compound-based degradation (soft: high, medium: medium, hard: low)
        # Assuming default medium compound for now (real data would have actual compound)
        stint_length = result.groupby(['driverId', 'raceId']).cumcount() + 1
        result['stint_length'] = stint_length

        # Tire age effect (increases with lap count in stint)
        # Soft: 0.08s/lap, Medium: 0.05s/lap, Hard: 0.03s/lap
        tire_deg_rate = 0.05  # default medium
        result['tire_degradation'] = tire_deg_rate * result['stint_length']
        result['tire_degradation'] = np.clip(result['tire_degradation'], 0, 2.0)  # cap at 2s loss

        # Pit stop indicator (usually lap time spike)
        result['is_pit_lap'] = 0  # set to 1 for actual pit laps (needs pit data)

        # ===== 4. Track evolution =====
        # Track gets faster as rubber is laid down (grip increases)
        # Particularly strong in early laps, plateaus after ~15 laps
        track_evolution_rate = 0.02  # 0.02s improvement per lap early on
        result['track_evolution'] = np.minimum(result['lap'] * track_evolution_rate, 0.3)

        # ===== 5. Driver skill features =====
        # Driver's historical performance (should be loaded from past results)
        result['driver_rating'] = result['qualifying_skill']  # Qualification skill base

        # Wet skill multiplier
        # Will be combined with weather condition later
        result['wet_skill_factor'] = result['wet_skill'] / 100  # normalized 0-1

        # Experience factor (more experience = better tire management)
        exp_factor = np.log1p(result['experience']) / np.log1p(20)  # normalize to 0-1
        result['experience_factor'] = exp_factor

        # Youth/prime factor (prime age 27-32)
        age_factor = 1.0 - 0.01 * np.abs(result['age'] - 29)  # peak at 29
        result['age_factor'] = np.clip(age_factor, 0.8, 1.1)

        # ===== 6. Team/Car performance =====
        # Merge team ratings
        result = result.merge(self.teams_df[['constructorId', 'power_rating', 'aero_efficiency',
                                               'low_speed', 'high_speed', 'wet_performance']],
                              on='constructorId', how='left')

        # Team performance rating (weighted average of attributes)
        result['team_performance'] = (
            result['power_rating'] * 0.3 +
            result['aero_efficiency'] * 0.4 +
            result['low_speed'] * 0.15 +
            result['high_speed'] * 0.15
        ) / 100

        # Team wet performance
        result['team_wet_factor'] = result['wet_performance'] / 100

        # ===== 7. Track characteristics =====
        # Encode track type (will one-hot encode later)
        track_type_weights = {
            'desert': 0.8,    # high-speed, low downforce
            'street': 0.7,    # low speed, high mechanical grip needed
            'classic': 1.0,   # balanced
            'technical': 0.9, # corner-heavy, requires downforce
            'flow': 1.1,      # high-speed corners
            'modern': 1.0,
            'high_altitude': 0.85,  # thinner air = less downforce
            'coastal': 0.95,
            'temple': 1.05,   # Monza - high speed
            'low_altitude': 1.0,
            'permanent': 1.0,
            'unknown': 1.0
        }
        result['track_type_factor'] = result['track_type'].map(track_type_weights).fillna(1.0)

        # Circuit length effect (longer = more time to make up)
        result['circuit_length_factor'] = result['length_km'] / 5.0  # normalized to 1.0 baseline

        # Corner count effect (more corners = more technical)
        result['turns_factor'] = result['turns'] / 15  # normalized

        # DRS zones (more zones = more overtaking, potentially faster lap)
        result['drs_zones_norm'] = result['drs_zones'] / 3

        # Pit loss time (longer pit lane = more penalty for pitting)
        result['pit_loss_factor'] = result['pit_loss_s'] / 20

        # Tire degradation factor (track-specific)
        deg_weights = {'high': 1.3, 'medium': 1.0, 'low': 0.7}
        result['track_tire_wear'] = result['tire_degradation'].map(deg_weights).fillna(1.0)

        # Overtaking difficulty (makes track position more valuable)
        result['overtaking_score'] = 1 / (result['overtaking_difficulty'] + 1)  # invert: hard to overtake = high score

        # ===== 8. Weather features =====
        if add_weather and 'condition' in result.columns:
            # Merge weather multipliers
            result = result.merge(self.weather_df[['condition_id', 'lap_time_multiplier', 'grip_level']],
                                  left_on='condition', right_on='condition_id', how='left')
            result['weather_multiplier'] = result['lap_time_multiplier'].fillna(1.0)
            result['weather_grip'] = result['grip_level'].fillna(1.0)
        else:
            # Default to dry conditions
            result['weather_multiplier'] = 1.0
            result['weather_grip'] = 1.0

        # Combined wet skill effect
        result['driver_weather_factor'] = (
            result['wet_skill_factor'] * result['weather_grip'] +
            result['team_wet_factor'] * result['weather_grip']
        ) / 2

        # ===== 9. Team-Driver synergy =====
        # Driver-team matching (some drivers work better with certain teams)
        # This would use historical data - simplified here
        synergy_map = {
            ('ver', 'red_bull'): 1.05,
            ('per', 'red_bull'): 1.00,
            ('ham', 'mercedes'): 1.03,
            ('rus', 'mercedes'): 0.98,
            ('lec', 'ferrari'): 1.02,
            ('sai', 'ferrari'): 1.00,
            # add more...
        }
        # Default synergy = 1.0
        result['driver_team_synergy'] = 1.0

        # ===== 10. Interactions & polynomial features =====
        # Important interactions
        result['skill_x_track'] = result['driver_rating'] * result['track_type_factor']
        result['team_x_circuit'] = result['team_performance'] * result['circuit_length_factor']
        result['fuel_x_tire'] = result['fuel_load_norm'] * result['tire_degradation']
        result['weather_x_wet_skill'] = result['weather_grip'] * result['wet_skill_factor']

        # ===== 11. Lap-by-lap context features =====
        # Rolling average of previous laps (requires grouping)
        result = result.sort_values(['driverId', 'raceId', 'lap'])
        result['prev_lap_time'] = result.groupby(['driverId', 'raceId'])['milliseconds'].shift(1)
        result['prev_lap_time_rolling'] = result.groupby(['driverId', 'raceId'])['milliseconds'].rolling(3, min_periods=1).mean().reset_index(level=[0,1], drop=True)

        # Delta to expected (placeholders for now)
        result['expected_lap_time'] = 90.0  # baseline, will be recalculated

        # ===== 12. Target variable =====
        # Already have 'milliseconds' or can convert 'lap_time_sec'
        if 'milliseconds' in result.columns:
            result['target_lap_time_sec'] = result['milliseconds'] / 1000.0
        elif 'lap_time_sec' in result.columns:
            result['target_lap_time_sec'] = result['lap_time_sec']
        else:
            raise ValueError("No lap time column found in data")

        # ===== 13. Outlier flags =====
        # Flag extreme outliers (pit stops, safety car, errors)
        q1, q3 = result['target_lap_time_sec'].quantile([0.25, 0.75])
        iqr = q3 - q1
        lower_bound = q1 - 3 * iqr
        upper_bound = q3 + 3 * iqr
        result['is_outlier'] = ((result['target_lap_time_sec'] < lower_bound) |
                                (result['target_lap_time_sec'] > upper_bound)).astype(int)

        print(f"Engineered {len(result.columns)} total features")
        return result

    def prepare_training_data(self,
                              features_df: pd.DataFrame,
                              target_col: str = 'target_lap_time_sec',
                              encode_categorical: bool = True) -> Tuple[pd.DataFrame, pd.Series, List[str]]:
        """
        Prepare final training matrix with proper encoding.
        """
        print("\nPreparing training data...")

        # Remove outliers
        clean_df = features_df[features_df['is_outlier'] == 0].copy()
        print(f"Removed {len(features_df) - len(clean_df)} outlier laps")

        # Define feature columns (exclude raw data and target)
        exclude_cols = ['target_lap_time_sec', 'is_outlier', 'milliseconds', 'time',
                        'driverId', 'raceId', 'circuitId', 'fullName', 'team',
                        'constructorId_x', 'constructorId_y', 'circuitName',
                        'country_x', 'country_y', 'locality', 'year', 'round']

        # Categorical columns to encode
        cat_cols = ['driverId', 'constructorId', 'circuitId', 'track_type']
        # Only keep categorical columns that exist
        cat_cols = [c for c in cat_cols if c in clean_df.columns]

        # One-hot encode
        if encode_categorical:
            clean_df = pd.get_dummies(clean_df, columns=cat_cols, dtype=int)

        # Select numeric features only
        feature_cols = [c for c in clean_df.columns if c not in exclude_cols and c != target_col]

        X = clean_df[feature_cols]
        
        # Ensure only numeric columns
        X = X.select_dtypes(include=['number'])
        
        y = clean_df[target_col]

        print(f"Feature matrix: {X.shape[0]} samples × {X.shape[1]} features")
        print(f"Target stats: mean={y.mean():.2f}s, std={y.std():.2f}s")

        return X, y, feature_cols


def test_feature_engineering():
    """Test the feature engineering pipeline."""
    from real_data_db import build_complete_database

    print("=== Advanced Feature Engineering Test ===\n")

    # Step 1: Build databases
    build_complete_database()

    # Step 2: Initialize feature engineer
    fe = AdvancedFeatureEngineer()

    # Step 3: Create sample dataset (just 5 races for speed)
    features = fe.create_lap_time_dataset(
        start_year=2024,
        end_year=2024,
        sample_races=5
    )

    # Step 4: Prepare for training
    X, y, feature_names = fe.prepare_training_data(features)

    print(f"\nTop 10 features by variance:")
    variances = X.var().sort_values(ascending=False)
    print(variances.head(10))

    return fe, X, y, feature_names


if __name__ == "__main__":
    test_feature_engineering()
