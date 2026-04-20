"""
Data Fetcher - Offline Synthetic Data Generator
Uses real driver/team/circuit databases to generate realistic lap times.
No internet required. Physics-based simulation.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')


def load_local_databases(data_dir: str = "f1_simulator/data"):
    """Load driver, team, circuit databases."""
    data_dir = Path(data_dir)

    drivers = pd.read_csv(data_dir / "drivers_real.csv")
    teams = pd.read_csv(data_dir / "teams.csv")
    circuits = pd.read_csv(data_dir / "circuits_real.csv")

    return drivers, teams, circuits


def generate_lap_time_for_driver(driver_row: pd.Series, circuit_row: pd.Series,
                                   lap: int, total_laps: int, grid: int,
                                   weather_condition: str = 'dry') -> float:
    """
    Generate a single realistic lap time using physics-based model.

    Parameters
    ----------
    driver_row : Series
        Driver attributes (qualifying_skill, race_skill, wet_skill, experience, age)
    circuit_row : Series
        Circuit characteristics (length_km, turns, track_type, drs_zones, pit_loss_s)
    lap : int
        Current lap number (1-based)
    total_laps : int
        Total race distance
    grid : int
        Starting grid position (1-20)
    weather_condition : str
        'dry', 'light_rain', 'heavy_rain', 'intermediate', 'wet', 'changing'

    Returns
    -------
    float
        Lap time in seconds
    """
    # Base lap time for this circuit (~90s for 5km)
    base_time = 90.0 * (circuit_row['length_km'] / 5.0)

    # ========== Driver skill factor ==========
    # Qualifying skill sets base pace
    skill_factor = driver_row['qualifying_skill'] / 100.0  # 0.8 - 1.0

    # Race skill affects consistency and long-run pace
    race_factor = driver_row['race_skill'] / 100.0

    # Wet skill modifier (used if weather not dry)
    wet_skill = driver_row['wet_skill'] / 100.0
    wet_factor = 1.0 if weather_condition == 'dry' else 0.9 + (wet_skill * 0.2)

    # Experience factor (log scale, caps at 20 years)
    exp_factor = np.log1p(driver_row['experience']) / np.log1p(20)

    # Age factor (peak at 27-30)
    age = driver_row['age']
    age_factor = 1.05 - 0.01 * abs(age - 28)

    # Combine driver factors
    driver_mult = (skill_factor * 0.5 + race_factor * 0.3 + wet_factor * 0.1 + exp_factor * 0.05 + age_factor * 0.05)

    # ========== Team/Car performance ==========
    # Use team performance rating if available, else default
    if 'team_performance' in circuit_row:
        team_perf = circuit_row['team_performance'] / 100.0
    else:
        # Look up team performance from driver's team
        teams_df = load_local_databases()[1]
        team_row = teams_df[teams_df['constructorId'] == driver_row.get('constructorId', 'unknown')]
        if not team_row.empty:
            # Average of power, aero, wet ratings
            team_perf = (team_row.iloc[0]['power_rating'] + team_row.iloc[0]['aero_efficiency']) / 200.0
        else:
            team_perf = 0.9

    # ========== Circuit factors ==========
    track_type = circuit_row.get('track_type', 'balanced')
    track_weights = {
        'desert': 1.05,      # high speed, low downforce (Red Bull advantage)
        'street': 0.95,      # slow, mechanical grip
        'classic': 1.00,     # balanced (Silverstone, Spa)
        'technical': 0.98,   # corner-heavy, downforce critical (Hungary, Monaco)
        'flow': 1.02,        # high-speed corners (Suzuka)
        'modern': 1.00,
        'high_altitude': 0.93,  # thinner air, less downforce (Mexico)
    }
    track_factor = track_weights.get(track_type, 1.00)

    # Circuit length factor (normalize to 5km baseline)
    length_factor = circuit_row['length_km'] / 5.0

    # DRS zones help reduce lap time (more zones = faster)
    drs_zones = circuit_row.get('drs_zones', 3)
    drs_factor = 1.0 - (drs_zones - 2) * 0.01  # each DRS zone = ~1% faster

    # Pit loss (longer pit lane = more penalty, indirectly affects strategy but not lap time directly)
    # Not directly used in lap time calc

    # ========== Fuel load ==========
    # F1 car starts ~110kg fuel, burns ~1.6kg/lap
    # Lap time improves as car lightens: ~0.05s per lap early on
    base_fuel = 110.0
    fuel_per_lap = 1.6
    current_fuel = max(0, base_fuel - fuel_per_lap * (lap - 1))
    fuel_norm = current_fuel / base_fuel  # 0 = empty, 1 = full
    fuel_improvement = (1 - fuel_norm) * 0.35  # Max 0.35s gain from fuel burn

    # ========== Tire degradation ==========
    # Simplified: medium compound (0.04s per lap in stint)
    # Assume stint starts at lap 1 for simulation
    stint_length = lap
    tire_deg_rate = 0.045  # seconds per lap
    tire_deg = min(tire_deg_rate * stint_length, 2.0)  # max 2s loss

    # Pit stop laps? Skip for now

    # ========== Track evolution ==========
    # Rubber build-up increases grip, especially first 15 laps
    track_evol = min(lap * 0.016, 0.28)

    # ========== Starting grip (grid position penalty) ==========
    # Cars starting further back have more sideways dust, slightly worse grip
    # Minimal effect: ~0.05s per 5 positions
    grid_effect = (grid - 1) * 0.008

    # ========== Weather multiplier ==========
    weather_multipliers = {
        'dry': 1.000,
        'light_rain': 1.080,
        'heavy_rain': 1.150,
        'intermediate': 1.050,
        'wet': 1.120,
        'changing': 1.060,
    }
    weather_mult = weather_multipliers.get(weather_condition, 1.0)

    # ========== Combine all effects ==========
    # Base lap time + driver/car performance - improvements + degradations
    lap_time = (
        base_time * driver_mult * team_perf * track_factor * length_factor * drs_factor
        + fuel_improvement  # negative (improvement)
        - track_evol        # negative (improvement)
        + tire_deg          # positive (degradation)
        + grid_effect
    ) * weather_mult

    # Add random variation (track noise, driver error, small factors)
    # Lower variance for better drivers (consistency)
    consistency = driver_row.get('consistency', 85) / 100.0
    random_std = 0.30 * (1.1 - consistency)  # worse consistency = more noise
    random_noise = np.random.normal(0, random_std)

    final_lap_time = lap_time + random_noise

    # Ensure reasonable bounds (~70s to ~180s)
    final_lap_time = np.clip(final_lap_time, 60, 200)

    return final_lap_time


def generate_race_simulation(driver_row: pd.Series, circuit_row: pd.Series,
                            total_laps: int, grid: int,
                            weather_condition: str = 'dry') -> pd.DataFrame:
    """Generate full race simulation for one driver."""
    laps = []
    for lap in range(1, total_laps + 1):
        lap_time = generate_lap_time_for_driver(
            driver_row, circuit_row, lap, total_laps, grid, weather_condition
        )
        laps.append({
            'lap': lap,
            'driverId': driver_row['driverId'],
            'milliseconds': int(lap_time * 1000),
            'grid': grid,
            'lap_time_sec': lap_time,
            'weather_condition': weather_condition
        })
    return pd.DataFrame(laps)


def generate_full_season_synthetic_data(year: int = 2024, data_dir: str = "f1_simulator/data",
                                         laps_per_race: int = 30) -> dict:
    """
    Generate synthetic season data using real driver/circuit attributes.
    Reduced size for faster training.
    """
    print(f"\nGenerating synthetic F1 {year} season data...")
    data_dir = Path(data_dir)

    # Load databases
    drivers_df, teams_df, circuits_df = load_local_databases(data_dir)

    all_laps = []
    race_id = 1

    # Use only first 6 circuits for faster training
    sample_circuits = circuits_df.head(6)
    print(f"Using {len(sample_circuits)} circuits for training")

    for _, circuit in sample_circuits.iterrows():
        circuit_id = circuit['circuitId']

        for _, driver in drivers_df.iterrows():
            driver_id = driver['driverId']
            grid = np.random.randint(1, 21)

            # Generate race
            race_laps = generate_race_simulation(
                driver, circuit,
                total_laps=laps_per_race,
                grid=grid,
                weather_condition='dry'
            )
            race_laps['raceId'] = race_id
            race_laps['season'] = year
            all_laps.append(race_laps)

        race_id += 1

    # Combine
    laps_df = pd.concat(all_laps, ignore_index=True)

    # Save
    laps_df.to_csv(data_dir / f"lap_times_{year}.csv", index=False)
    print(f"Generated lap_times_{year}.csv: {len(laps_df)} rows")

    # Create races dataframe
    races_data = []
    for i, (_, circuit) in enumerate(sample_circuits.iterrows(), 1):
        races_data.append({
            'raceId': i,
            'year': year,
            'round': i,
            'circuitId': circuit['circuitId'],
            'raceName': f"{circuit['name']} Grand Prix",
            'date': f"{year}-01-{15+i*7:02d}"
        })
    races_df = pd.DataFrame(races_data)
    races_df.to_csv(data_dir / f"races_{year}.csv", index=False)
    print(f"Generated races_{year}.csv: {len(races_df)} rows")

    print(f"\nData generated: {len(laps_df)} total lap records across {len(sample_circuits)} circuits")

    return {
        'drivers': drivers_df,
        'teams': teams_df,
        'circuits': circuits_df,
        'races': races_df,
        'lap_times': laps_df
    }


def fetch_all_season_data(year: int = 2024, data_dir: str = "f1_simulator/data"):
    """
    Main entry point - generates synthetic data using real attributes.
    This is deterministic, offline, and fast.
    """
    return generate_full_season_synthetic_data(year, data_dir, laps_per_race=60)


if __name__ == "__main__":
    # Quick test
    print("Testing synthetic data generator...")
    result = fetch_all_season_data(2024, "f1_simulator/data")
    print("\nSample lap times:")
    print(result['lap_times'][['driverId', 'lap', 'lap_time_sec']].head(10))
