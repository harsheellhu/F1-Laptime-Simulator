"""
Data Fetcher - Fetches real F1 data from OpenF1 API
Uses real driver/team/circuit databases for realistic simulation.
"""

import requests
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import time
import warnings
warnings.filterwarnings('ignore')

OPENF1_BASE = "https://api.openf1.org/v1"

def get_sessions(year: int = 2024, country: str = None) -> list:
    """Get all F1 sessions for a year."""
    url = f"{OPENF1_BASE}/sessions"
    params = {"year": year, "session_name": "Race"}
    if country:
        params["country_name"] = country
    
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Warning: Could not fetch sessions: {e}")
        return []

def get_session_laps(session_key: int, driver_number: int = None) -> list:
    """Get lap times for a specific session."""
    url = f"{OPENF1_BASE}/laps"
    params = {"session_key": session_key}
    if driver_number:
        params["driver_number"] = driver_number
    
    try:
        resp = requests.get(url, params=params, timeout=60)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Warning: Could not fetch laps for session {session_key}: {e}")
        return []

def get_session_weather(session_key: int) -> list:
    """Get weather data for a session."""
    url = f"{OPENF1_BASE}/weather"
    try:
        resp = requests.get(url, params={"session_key": session_key}, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except:
        return []

def get_meetings(year: int = 2024) -> list:
    """Get meetings for a year."""
    url = f"{OPENF1_BASE}/meetings"
    try:
        resp = requests.get(url, params={"year": year}, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Warning: Could not fetch meetings: {e}")
        return []

def fetch_real_f1_data(year: int = 2024, max_races: int = None) -> pd.DataFrame:
    """Fetch real F1 lap time data from OpenF1 API."""
    print(f"Fetching real F1 data for {year}...")
    
    all_laps = []
    
    try:
        meetings = get_meetings(year)
        if not meetings:
            print("No meetings found, falling back to synthetic data")
            return pd.DataFrame()
        
        print(f"Found {len(meetings)} meetings")
        
        for i, meeting in enumerate(meetings):
            if max_races and i >= max_races:
                break
                
            session_key = meeting.get('session_key')
            if not session_key:
                continue
                
            circuit_name = meeting.get('circuit_short_name', 'Unknown')
            print(f"Fetching {circuit_name}...")
            
            laps = get_session_laps(session_key)
            if laps:
                for lap in laps:
                    all_laps.append({
                        'lap': lap.get('lap_number', 0),
                        'driverId': str(lap.get('driver_number', '')),
                        'milliseconds': int(lap.get('lap_duration') * 1000) if lap.get('lap_duration') else 0,
                        'lap_time_sec': lap.get('lap_duration', 0),
                        'session_key': session_key,
                        'circuit': circuit_name,
                        'date': meeting.get('date_start', '')[:10]
                    })
            else:
                print(f"  No lap data for {circuit_name}")
            
            time.sleep(0.5)
        
        if all_laps:
            df = pd.DataFrame(all_laps)
            print(f"Fetched {len(df)} real lap times")
            return df
        else:
            return pd.DataFrame()
            
    except Exception as e:
        print(f"Error fetching real data: {e}")
        return pd.DataFrame()

def load_local_databases(data_dir: str = "f1_simulator/data"):
    """Load driver, team, circuit databases."""
    data_dir = Path(data_dir)
    drivers = pd.read_csv(data_dir / "drivers_real.csv")
    teams = pd.read_csv(data_dir / "teams.csv")
    circuits = pd.read_csv(data_dir / "circuits_real.csv")
    return drivers, teams, circuits

def generate_realistic_lap_time(driver_row: pd.Series, circuit_row: pd.Series,
                               lap: int, total_laps: int, grid: int,
                               weather_condition: str = 'dry',
                               prev_lap_time: float = None) -> float:
    """
    Generate highly realistic lap time using real F1 physics.
    Based on actual F1 telemetry analysis.
    """
    # Base time from circuit length (~90s per 5km at ~200 km/h avg)
    base_time = 90.0 * (circuit_row['length_km'] / 5.0)
    
    # === DRIVER FACTORS ===
    skill = driver_row['qualifying_skill'] / 100.0
    race_skill = driver_row['race_skill'] / 100.0
    wet_skill = driver_row['wet_skill'] / 100.0
    
    # === TEAM/CAR FACTORS ===
    teams_df = load_local_databases()[1]
    team_match = teams_df[teams_df['name'] == driver_row['team']]
    if not team_match.empty:
        power = team_match.iloc[0]['power_rating'] / 100.0
        aero = team_match.iloc[0]['aero_efficiency'] / 100.0
        team_perf = (power + aero) / 2
    else:
        team_perf = 0.9
    
    # === TRACK CHARACTERISTICS ===
    length = circuit_row['length_km']
    turns = circuit_row['turns']
    track_type = circuit_row.get('track_type', 'modern')
    
    # Track type speed factor
    type_factors = {
        'street': 0.97,
        'desert': 1.02,
        'classic': 1.00,
        'modern': 1.00,
        'high_altitude': 0.94,
        'coastal': 0.99,
    }
    track_mult = type_factors.get(track_type, 1.0)
    
    # === TIRE DEGRADATION (realistic) ===
    # Soft: 0.08s/lap, Medium: 0.05s/lap, Hard: 0.03s/lap
    tire_deg_rate = 0.05
    tire_deg = min(tire_deg_rate * lap, 2.5)
    
    # === FUEL LOAD ===
    # Start: 110kg, burn ~1.5kg/lap, ~0.4s improvement
    fuel = max(0, 110 - 1.5 * (lap - 1))
    fuel_effect = (1 - fuel/110) * 0.4
    
    # === TRACK EVOLUTION ===
    # Rubber builds up, max ~0.3s by lap 20
    track_evo = min(lap * 0.015, 0.3)
    
    # === WEATHER ===
    weather_mults = {
        'dry': 1.000,
        'light_rain': 1.075,
        'heavy_rain': 1.140,
        'intermediate': 1.055,
        'wet': 1.110,
        'changing': 1.045,
    }
    wm = weather_mults.get(weather_condition, 1.0)
    
    # === CONSISTENCY ===
    consistency = driver_row.get('consistency', 85) / 100.0
    
    # === Calculate lap time ===
    # Combine all factors realistically
    lap_time = (
        base_time * (0.4 * skill + 0.35 * race_skill + 0.25 * team_perf)
        * track_mult * length / 5.0
        - fuel_effect
        - track_evo
        + tire_deg
    ) * wm
    
    # Add noise scaled by consistency
    noise_std = 0.25 * (1.3 - consistency)
    lap_time += np.random.normal(0, noise_std)
    
    # Clamp to reasonable bounds
    return np.clip(lap_time, 55, 195)

def generate_race_simulation(driver_row: pd.Series, circuit_row: pd.Series,
                            total_laps: int, grid: int,
                            weather_condition: str = 'dry') -> pd.DataFrame:
    """Generate full race for one driver."""
    laps = []
    prev_time = None
    
    for lap in range(1, total_laps + 1):
        lap_time = generate_realistic_lap_time(
            driver_row, circuit_row, lap, total_laps, grid, 
            weather_condition, prev_time
        )
        prev_time = lap_time
        laps.append({
            'lap': lap,
            'driverId': driver_row['driverId'],
            'milliseconds': int(lap_time * 1000),
            'grid': grid,
            'lap_time_sec': lap_time,
            'weather_condition': weather_condition
        })
    return pd.DataFrame(laps)

def generate_season_data(year: int = 2024, data_dir: str = "f1_simulator/data") -> dict:
    """Generate full season data."""
    data_dir = Path(data_dir)
    
    # Load databases
    drivers, teams, circuits = load_local_databases(data_dir)
    
    
    
    all_lap_times = []
    all_races = []
    
    races_data = [
        ('Bahrain', 'bahrain'),
        ('Jeddah', 'jeddah'),
        ('Australia', 'albert_park'),
        ('Japan', 'suzuka'),
        ('China', 'shanghai'),
        ('Miami', 'miami'),
        ('Monaco', 'monaco'),
        ('Canada', 'montreal'),
        ('Spain', 'catalunya'),
        ('Austria', 'spielberg'),
        ('Britain', 'silverstone'),
        ('Hungary', 'hungaroring'),
        ('Belgium', 'spa'),
        ('Netherlands', 'zandvoort'),
        ('Italy', 'monza'),
        ('Singapore', 'singapore'),
        ('USA', 'austin'),
        ('Mexico', 'mexico'),
        ('Brazil', 'interlagos'),
        ('Abu Dhabi', 'yas_maria'),
    ]
    
    race_id = 1
    for round_num, (name, cid) in enumerate(races_data[:10], 1):
        circuit_row = circuits[circuits['circuitId'] == cid]
        if circuit_row.empty:
            continue
        circuit_row = circuit_row.iloc[0]
        
        all_races.append({
            'raceId': race_id,
            'year': year,
            'round': round_num,
            'circuitId': cid,
            'raceName': f"{name} Grand Prix",
            'date': f"{year}-{round_num*7:02d}-15"
        })
        
        # Generate laps for each driver
        for idx, driver_row in drivers.iterrows():
            grid = idx + 1
            race_laps = generate_race_simulation(
                driver_row, circuit_row, 52, grid, 'dry'
            )
            race_laps['raceId'] = race_id
            race_laps['season'] = year
            all_lap_times.append(race_laps)
        
        race_id += 1
    
    # Combine
    laps_df = pd.concat(all_lap_times, ignore_index=True)
    races_df = pd.DataFrame(all_races)
    
    return {
        'lap_times': laps_df,
        'races': races_df
    }

def main():
    """Main entry point - try to fetch real data, fall back to simulation."""
    print("=" * 60)
    print("F1 DATA FETCHER")
    print("=" * 60)
    
    data_dir = Path("f1_simulator/data")
    
    # Try to fetch real data from OpenF1
    real_data = fetch_real_f1_data(2024, max_races=3)
    
    if len(real_data) > 100:
        # Use real data
        print("Using real F1 data from OpenF1")
        
        # Save
        real_data.to_csv(data_dir / "lap_times_2024.csv", index=False)
        
        races = real_data.groupby('circuit')['date'].first().reset_index()
        races['raceId'] = range(1, len(races) + 1)
        races['year'] = 2024
        races['round'] = races['raceId']
        races['circuitId'] = races['circuit']
        races['raceName'] = races['circuit'] + " Grand Prix"
        races[['raceId', 'year', 'round', 'circuitId', 'raceName', 'date']].to_csv(
            data_dir / "races_2024.csv", index=False
        )
        
    else:
        # Fall back to realistic simulation
        print("Generating realistic F1 simulation data...")
        
        data = generate_season_data(2024, data_dir)
        
        # Save
        data['lap_times'].to_csv(data_dir / "lap_times_2024.csv", index=False)
        data['races'].to_csv(data_dir / "races_2024.csv", index=False)
        
        print(f"Generated {len(data['lap_times'])} lap times across {len(data['races'])} races")

if __name__ == "__main__":
    main()