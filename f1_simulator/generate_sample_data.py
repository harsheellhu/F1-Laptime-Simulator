"""
Generate Sample F1 Data for Testing

This script creates synthetic lap time data that mimics the structure of
the real F1 dataset. Useful for development and demo purposes.
"""

import pandas as pd
import numpy as np
from pathlib import Path


def generate_lap_times(num_races=100, num_drivers=20, laps_per_race=60):
    """
    Generate synthetic lap times data.

    Base lap time = ~90s + variation per circuit, driver, constructor.
    """
    np.random.seed(42)

    rows = []
    race_id = 1

    for race in range(num_races):
        circuit_id = np.random.randint(1, 25)
        year = np.random.randint(2010, 2023)
        # Random constructor assignment per race
        constructor_id = np.random.randint(1, 11)

        for driver in range(num_drivers):
            driver_id = driver + 1
            grid = np.random.randint(1, 21)

            # Base lap time varies by circuit (different tracks have different speeds)
            base_lap_time = 90 + np.random.uniform(-5, 10)  # 85-105s

            # Driver skill factor (lower = better)
            driver_skill = np.random.uniform(0.9, 1.1)  # 0.9 = 10% faster

            # Constructor (team) factor
            team_factor = np.random.uniform(0.95, 1.05)

            for lap in range(1, laps_per_race + 1):
                # Lap time increases slightly as fuel burns (car gets lighter = faster)
                # Actually F1 cars get faster as fuel burns, so lap times decrease
                fuel_effect = -0.05 * lap  # ~0.05s faster per lap as fuel burns

                # Tire wear increases lap time over stint
                tire_effect = 0.1 * (lap % 30)  # Reset after pit stops roughly

                # Random variation (track conditions, errors, etc.)
                random_var = np.random.normal(0, 0.5)

                # Calculate lap time in ms
                lap_time_ms = (
                    base_lap_time * 1000
                    + fuel_effect * 1000
                    + tire_effect * 1000
                    + random_var * 1000
                ) * driver_skill * team_factor

                rows.append({
                    "raceId": race_id,
                    "driverId": driver_id,
                    "constructorId": constructor_id,
                    "circuitId": circuit_id,
                    "lap": lap,
                    "milliseconds": int(lap_time_ms),
                    "grid": grid
                })

        race_id += 1

    return pd.DataFrame(rows)


def generate_races_csv(num_races=100):
    """Generate races.csv metadata."""
    np.random.seed(42)
    races = []
    for i in range(1, num_races + 1):
        races.append({
            "raceId": i,
            "year": np.random.randint(2010, 2023),
            "round": np.random.randint(1, 25),
            "circuitId": np.random.randint(1, 25),
            "name": f"Grand Prix {i}",
            "date": f"2023-{np.random.randint(1,13):02d}-{np.random.randint(1,28):02d}"
        })
    return pd.DataFrame(races)


def generate_drivers_csv(num_drivers=20):
    """Generate drivers.csv metadata."""
    np.random.seed(42)
    surnames = ["Hamilton", "Verstappen", "Leclerc", " Sainz", "Norris", "Ocon",
                "Alonso", "Piastri", "Russell", "Bottas", "Gasly", "Tsunoda",
                "Stroll", "Hulkenberg", "Zhou", "Magnussen", "Albon", "Sargeant",
                "Perez", "De Vries"]
    drivers = []
    for i in range(num_drivers):
        drivers.append({
            "driverId": i + 1,
            "code": f"D{i+1:02d}",
            "forename": f"Driver{i+1}",
            "surname": surnames[i] if i < len(surnames) else f"Driver{i+1}",
            "nationality": "Various"
        })
    return pd.DataFrame(drivers)


def generate_constructors_csv(num_constructors=10):
    """Generate constructors.csv metadata."""
    np.random.seed(42)
    constructors = []
    team_names = ["Mercedes", "Red Bull", "Ferrari", "McLaren", "Aston Martin",
                  "Alpine", "Williams", "AlphaTauri", "AlphaRomeo", "Haas"]
    for i in range(num_constructors):
        constructors.append({
            "constructorId": i + 1,
            "name": team_names[i] if i < len(team_names) else f"Team{i+1}",
            "nationality": "Various"
        })
    return pd.DataFrame(constructors)


def generate_circuits_csv(num_circuits=25):
    """Generate circuits.csv metadata with lengths."""
    np.random.seed(42)
    circuits = []
    for i in range(1, num_circuits + 1):
        circuits.append({
            "circuitId": i,
            "name": f"Circuit {i}",
            "length": np.random.uniform(4000, 6000),  # Circuit length in meters
            "country": "Various"
        })
    return pd.DataFrame(circuits)


def generate_all_sample_data(output_dir: str = None):
    """Generate all required CSV files and save them."""
    if output_dir is None:
        output_dir = Path(__file__).parent / "data"
    else:
        output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("Generating sample F1 data...")

    # Generate core files
    lap_times = generate_lap_times()
    races = generate_races_csv()
    drivers = generate_drivers_csv()
    constructors = generate_constructors_csv()
    circuits = generate_circuits_csv()

    # Save to CSV
    lap_times.to_csv(output_dir / "lap_times.csv", index=False)
    races.to_csv(output_dir / "races.csv", index=False)
    drivers.to_csv(output_dir / "drivers.csv", index=False)
    constructors.to_csv(output_dir / "constructors.csv", index=False)
    circuits.to_csv(output_dir / "circuits.csv", index=False)

    print(f"Sample data generated in {output_dir}/")
    print(f"  - lap_times.csv: {len(lap_times)} rows")
    print(f"  - races.csv: {len(races)} rows")
    print(f"  - drivers.csv: {len(drivers)} rows")
    print(f"  - constructors.csv: {len(constructors)} rows")
    print(f"  - circuits.csv: {len(circuits)} rows")


if __name__ == "__main__":
    generate_all_sample_data()
