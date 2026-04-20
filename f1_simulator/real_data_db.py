"""
Real F1 Driver and Team Database
Complete mapping of drivers, teams, and their characteristics for 2024-2025 seasons
"""

import pandas as pd
import numpy as np
from pathlib import Path


def create_driver_database() -> pd.DataFrame:
    """
    Create comprehensive driver database with real names, skills, and stats.

    Includes current 2024-2025 drivers with realistic attributes.
    """
    drivers = [
        # Red Bull Racing
        {'driverId': 'ver', 'code': 'VER', 'forename': 'Max', 'surname': 'Verstappen',
         'fullName': 'Max Verstappen', 'nationality': 'Netherlands',
         'team': 'Red Bull Racing', 'constructorId': 'red_bull',
         'age': 26, 'experience': 10, 'qualifying_skill': 95, 'race_skill': 97,
         'wet_skill': 93, 'aggression': 90, 'consistency': 92, 'championships': 4},

        {'driverId': 'per', 'code': 'PER', 'forename': 'Sergio', 'surname': 'Perez',
         'fullName': 'Sergio Perez', 'nationality': 'Mexico',
         'team': 'Red Bull Racing', 'constructorId': 'red_bull',
         'age': 34, 'experience': 14, 'qualifying_skill': 88, 'race_skill': 90,
         'wet_skill': 85, 'aggression': 92, 'consistency': 85, 'championships': 0},

        # Mercedes
        {'driverId': 'ham', 'code': 'HAM', 'forename': 'Lewis', 'surname': 'Hamilton',
         'fullName': 'Lewis Hamilton', 'nationality': 'United Kingdom',
         'team': 'Mercedes', 'constructorId': 'mercedes',
         'age': 39, 'experience': 18, 'qualifying_skill': 92, 'race_skill': 94,
         'wet_skill': 96, 'aggression': 85, 'consistency': 90, 'championships': 7},

        {'driverId': 'rus', 'code': 'RUS', 'forename': 'George', 'surname': 'Russell',
         'fullName': 'George Russell', 'nationality': 'United Kingdom',
         'team': 'Mercedes', 'constructorId': 'mercedes',
         'age': 26, 'experience': 5, 'qualifying_skill': 91, 'race_skill': 90,
         'wet_skill': 88, 'aggression': 87, 'consistency': 91, 'championships': 0},

        # Ferrari
        {'driverId': 'lec', 'code': 'LEC', 'forename': 'Charles', 'surname': 'Leclerc',
         'fullName': 'Charles Leclerc', 'nationality': 'Monaco',
         'team': 'Ferrari', 'constructorId': 'ferrari',
         'age': 26, 'experience': 6, 'qualifying_skill': 93, 'race_skill': 91,
         'wet_skill': 89, 'aggression': 91, 'consistency': 86, 'championships': 0},

        {'driverId': 'sai', 'code': 'SAI', 'forename': 'Carlos', 'surname': 'Sainz',
         'fullName': 'Carlos Sainz', 'nationality': 'Spain',
         'team': 'Ferrari', 'constructorId': 'ferrari',
         'age': 29, 'experience': 9, 'qualifying_skill': 89, 'race_skill': 90,
         'wet_skill': 87, 'aggression': 88, 'consistency': 89, 'championships': 0},

        # McLaren
        {'driverId': 'nor', 'code': 'NOR', 'forename': 'Lando', 'surname': 'Norris',
         'fullName': 'Lando Norris', 'nationality': 'United Kingdom',
         'team': 'McLaren', 'constructorId': 'mclaren',
         'age': 24, 'experience': 6, 'qualifying_skill': 91, 'race_skill': 92,
         'wet_skill': 90, 'aggression': 93, 'consistency': 88, 'championships': 0},

        {'driverId': 'pia', 'code': 'PIA', 'forename': 'Oscar', 'surname': 'Piastri',
         'fullName': 'Oscar Piastri', 'nationality': 'Australia',
         'team': 'McLaren', 'constructorId': 'mclaren',
         'age': 23, 'experience': 2, 'qualifying_skill': 89, 'race_skill': 90,
         'wet_skill': 88, 'aggression': 89, 'consistency': 92, 'championships': 0},

        # Aston Martin
        {'driverId': 'alo', 'code': 'ALO', 'forename': 'Fernando', 'surname': 'Alonso',
         'fullName': 'Fernando Alonso', 'nationality': 'Spain',
         'team': 'Aston Martin', 'constructorId': 'aston_martin',
         'age': 42, 'experience': 23, 'qualifying_skill': 88, 'race_skill': 96,
         'wet_skill': 94, 'aggression': 95, 'consistency': 92, 'championships': 2},

        {'driverId': 'str', 'code': 'STR', 'forename': 'Lance', 'surname': 'Stroll',
         'fullName': 'Lance Stroll', 'nationality': 'Canada',
         'team': 'Aston Martin', 'constructorId': 'aston_martin',
         'age': 25, 'experience': 7, 'qualifying_skill': 82, 'race_skill': 83,
         'wet_skill': 80, 'aggression': 85, 'consistency': 78, 'championships': 0},

        # Alpine
        {'driverId': 'oca', 'code': 'OCA', 'forename': 'Esteban', 'surname': 'Ocon',
         'fullName': 'Esteban Ocon', 'nationality': 'France',
         'team': 'Alpine', 'constructorId': 'alpine',
         'age': 28, 'experience': 8, 'qualifying_skill': 85, 'race_skill': 86,
         'wet_skill': 84, 'aggression': 84, 'consistency': 87, 'championships': 0},

        {'driverId': 'gas', 'code': 'GAS', 'forename': 'Pierre', 'surname': 'Gasly',
         'fullName': 'Pierre Gasly', 'nationality': 'France',
         'team': 'Alpine', 'constructorId': 'alpine',
         'age': 28, 'experience': 8, 'qualifying_skill': 86, 'race_skill': 85,
         'wet_skill': 86, 'aggression': 86, 'consistency': 86, 'championships': 0},

        # Williams
        {'driverId': 'alb', 'code': 'ALB', 'forename': 'Alex', 'surname': 'Albon',
         'fullName': 'Alex Albon', 'nationality': 'Thailand',
         'team': 'Williams', 'constructorId': 'williams',
         'age': 27, 'experience': 6, 'qualifying_skill': 84, 'race_skill': 85,
         'wet_skill': 83, 'aggression': 85, 'consistency': 86, 'championships': 0},

        {'driverId': 'sar', 'code': 'SAR', 'forename': 'Logan', 'surname': 'Sargeant',
         'fullName': 'Logan Sargeant', 'nationality': 'USA',
         'team': 'Williams', 'constructorId': 'williams',
         'age': 23, 'experience': 2, 'qualifying_skill': 78, 'race_skill': 79,
         'wet_skill': 77, 'aggression': 80, 'consistency': 75, 'championships': 0},

        # RB (formerly AlphaTauri)
        {'driverId': 'tss', 'code': 'TSS', 'forename': 'Yuki', 'surname': 'Tsunoda',
         'fullName': 'Yuki Tsunoda', 'nationality': 'Japan',
         'team': 'RB', 'constructorId': 'rb',
         'age': 24, 'experience': 4, 'qualifying_skill': 83, 'race_skill': 82,
         'wet_skill': 81, 'aggression': 90, 'consistency': 80, 'championships': 0},

        {'driverId': 'had', 'code': 'HAD', 'forename': 'Isack', 'surname': 'Hadjar',
         'fullName': 'Isack Hadjar', 'nationality': 'France',
         'team': 'RB', 'constructorId': 'rb',
         'age': 20, 'experience': 1, 'qualifying_skill': 80, 'race_skill': 80,
         'wet_skill': 79, 'aggression': 85, 'consistency': 78, 'championships': 0},

        # Sauber (Kick)
        {'driverId': 'ant', 'code': 'ANT', 'forename': 'Kimi', 'surname': 'Antonelli',
         'fullName': 'Kimi Antonelli', 'nationality': 'Italy',
         'team': 'Sauber', 'constructorId': 'sauber',
         'age': 18, 'experience': 0, 'qualifying_skill': 82, 'race_skill': 80,
         'wet_skill': 78, 'aggression': 85, 'consistency': 75, 'championships': 0},

        {'driverId': 'hur', 'code': 'HUR', 'forename': 'Valtteri', 'surname': 'Bottas',
         'fullName': 'Valtteri Bottas', 'nationality': 'Finland',
         'team': 'Sauber', 'constructorId': 'sauber',
         'age': 34, 'experience': 13, 'qualifying_skill': 87, 'race_skill': 87,
         'wet_skill': 88, 'aggression': 82, 'consistency': 88, 'championships': 0},

        # Haas
        {'driverId': 'mag', 'code': 'MAG', 'forename': 'Kevin', 'surname': 'Magnussen',
         'fullName': 'Kevin Magnussen', 'nationality': 'Denmark',
         'team': 'Haas', 'constructorId': 'haas',
         'age': 31, 'experience': 11, 'qualifying_skill': 82, 'race_skill': 82,
         'wet_skill': 80, 'aggression': 88, 'consistency': 82, 'championships': 0},

        {'driverId': 'olo', 'code': 'OLO', 'forename': 'Oliver', 'surname': 'Bearman',
         'fullName': 'Oliver Bearman', 'nationality': 'United Kingdom',
         'team': 'Haas', 'constructorId': 'haas',
         'age': 20, 'experience': 1, 'qualifying_skill': 79, 'race_skill': 78,
         'wet_skill': 77, 'aggression': 82, 'consistency': 76, 'championships': 0},
    ]

    df = pd.DataFrame(drivers)

    # Map constructor IDs to numeric IDs for compatibility
    constructor_map = {
        'red_bull': 1,
        'mercedes': 2,
        'ferrari': 3,
        'mclaren': 4,
        'aston_martin': 5,
        'alpine': 6,
        'williams': 7,
        'rb': 8,
        'sauber': 9,
        'haas': 10
    }

    df['constructorId_num'] = df['constructorId'].map(constructor_map)

    # Assign unique numeric driver IDs
    driver_id_map = {d['driverId']: i+1 for i, d in enumerate(drivers)}
    df['driverId_num'] = df['driverId'].map(driver_id_map)

    return df


def create_team_database() -> pd.DataFrame:
    """
    Create team database with performance characteristics.
    """
    teams = [
        {'constructorId': 'red_bull', 'name': 'Red Bull Racing',
         'fullName': 'Oracle Red Bull Racing', 'nationality': 'Austria',
         'engine': 'Red Bull Powertrains', 'power_rating': 98, 'reliability': 95,
         'aero_efficiency': 96, 'low_speed': 95, 'high_speed': 97, 'wet_performance': 94,
         'color': '#1E41FF', 'color_secondary': '#FFCE00'},

        {'constructorId': 'mercedes', 'name': 'Mercedes',
         'fullName': 'Mercedes-AMG Petronas F1 Team', 'nationality': 'Germany',
         'engine': 'Mercedes', 'power_rating': 96, 'reliability': 97,
         'aero_efficiency': 95, 'low_speed': 94, 'high_speed': 96, 'wet_performance': 96,
         'color': '#00D2BE', 'color_secondary': '#000000'},

        {'constructorId': 'ferrari', 'name': 'Ferrari',
         'fullName': 'Scuderia Ferrari HP', 'nationality': 'Italy',
         'engine': 'Ferrari', 'power_rating': 97, 'reliability': 93,
         'aero_efficiency': 94, 'low_speed': 93, 'high_speed': 96, 'wet_performance': 93,
         'color': '#DC0000', 'color_secondary': '#FFF500'},

        {'constructorId': 'mclaren', 'name': 'McLaren',
         'fullName': 'McLaren F1 Team', 'nationality': 'United Kingdom',
         'engine': 'Mercedes', 'power_rating': 95, 'reliability': 94,
         'aero_efficiency': 95, 'low_speed': 94, 'high_speed': 94, 'wet_performance': 94,
         'color': '#FF8700', 'color_secondary': '#47C7FC'},

        {'constructorId': 'aston_martin', 'name': 'Aston Martin',
         'fullName': 'Aston Martin Aramco F1 Team', 'nationality': 'United Kingdom',
         'engine': 'Mercedes', 'power_rating': 92, 'reliability': 92,
         'aero_efficiency': 92, 'low_speed': 91, 'high_speed': 92, 'wet_performance': 91,
         'color': '#006F62', 'color_secondary': '#FFFFFF'},

        {'constructorId': 'alpine', 'name': 'Alpine',
         'fullName': 'Alpine F1 Team', 'nationality': 'France',
         'engine': 'Renault', 'power_rating': 90, 'reliability': 91,
         'aero_efficiency': 91, 'low_speed': 90, 'high_speed': 90, 'wet_performance': 90,
         'color': '#0090FF', 'color_secondary': '#FF5800'},

        {'constructorId': 'williams', 'name': 'Williams',
         'fullName': 'Williams Racing', 'nationality': 'United Kingdom',
         'engine': 'Mercedes', 'power_rating': 88, 'reliability': 90,
         'aero_efficiency': 89, 'low_speed': 88, 'high_speed': 88, 'wet_performance': 88,
         'color': '#005AFF', 'color_secondary': '#FFFFFF'},

        {'constructorId': 'rb', 'name': 'RB',
         'fullName': 'Visa Cash App RB Racing', 'nationality': 'Italy',
         'engine': 'Honda RBPT', 'power_rating': 89, 'reliability': 89,
         'aero_efficiency': 89, 'low_speed': 88, 'high_speed': 89, 'wet_performance': 88,
         'color': '#6692FF', 'color_secondary': '#FFFFFF'},

        {'constructorId': 'sauber', 'name': 'Sauber',
         'fullName': 'Kick Sauber F1 Team', 'nationality': 'Switzerland',
         'engine': 'Ferrari', 'power_rating': 86, 'reliability': 88,
         'aero_efficiency': 87, 'low_speed': 86, 'high_speed': 86, 'wet_performance': 86,
         'color': '#52E252', 'color_secondary': '#000000'},

        {'constructorId': 'haas', 'name': 'Haas',
         'fullName': 'Haas F1 Team', 'nationality': 'USA',
         'engine': 'Ferrari', 'power_rating': 85, 'reliability': 87,
         'aero_efficiency': 86, 'low_speed': 85, 'high_speed': 86, 'wet_performance': 84,
         'color': '#FFFFFF', 'color_secondary': '#B6BABD'},
    ]

    return pd.DataFrame(teams)


def create_circuit_database() -> pd.DataFrame:
    """
    Comprehensive database of all 2024-2025 F1 circuits with detailed characteristics.
    """
    circuits = [
        # Bahrain
        {'circuitId': 'bahrain', 'name': 'Bahrain International Circuit',
         'country': 'Bahrain', 'city': 'Sakhir',
         'length_km': 5.412, 'turns': 15, 'races_since_2000': 20,
         'avg_speed': 'high', 'track_type': 'desert', 'elevation_change': 15,
         'drs_zones': 3, 'pit_loss_s': 18.0,
         'tire_degradation': 'medium', 'overtaking_difficulty': 3},

        # Saudi Arabia
        {'circuitId': 'jeddah', 'name': 'Jeddah Corniche Circuit',
         'country': 'Saudi Arabia', 'city': 'Jeddah',
         'length_km': 6.174, 'turns': 27, 'races_since_2000': 3,
         'avg_speed': 'very_high', 'track_type': 'street', 'elevation_change': 12,
         'drs_zones': 3, 'pit_loss_s': 20.0,
         'tire_degradation': 'low', 'overtaking_difficulty': 2},

        # Australia
        {'circuitId': 'albert_park', 'name': 'Albert Park Circuit',
         'country': 'Australia', 'city': 'Melbourne',
         'length_km': 5.278, 'turns': 16, 'races_since_2000': 24,
         'avg_speed': 'medium', 'track_type': 'street', 'elevation_change': 8,
         'drs_zones': 4, 'pit_loss_s': 19.0,
         'tire_degradation': 'medium', 'overtaking_difficulty': 4},

        # Japan
        {'circuitId': 'suzuka', 'name': 'Suzuka International Racing Course',
         'country': 'Japan', 'city': 'Suzuka',
         'length_km': 5.807, 'turns': 18, 'races_since_2000': 34,
         'avg_speed': 'high', 'track_type': 'classic', 'elevation_change': 30,
         'drs_zones': 3, 'pit_loss_s': 19.5,
         'tire_degradation': 'medium', 'overtaking_difficulty': 5},

        # China (returning 2024)
        {'circuitId': 'shanghai', 'name': 'Shanghai International Circuit',
         'country': 'China', 'city': 'Shanghai',
         'length_km': 5.451, 'turns': 16, 'races_since_2000': 16,
         'avg_speed': 'medium', 'track_type': 'modern', 'elevation_change': 5,
         'drs_zones': 3, 'pit_loss_s': 20.0,
         'tire_degradation': 'high', 'overtaking_difficulty': 6},

        # Miami
        {'circuitId': 'miami', 'name': 'Miami International Autodrome',
         'country': 'USA', 'city': 'Miami Gardens',
         'length_km': 5.412, 'turns': 19, 'races_since_2000': 2,
         'avg_speed': 'medium', 'track_type': 'street', 'elevation_change': 3,
         'drs_zones': 3, 'pit_loss_s': 18.5,
         'tire_degradation': 'high', 'overtaking_difficulty': 4},

        # Imola
        {'circuitId': 'imola', 'name': 'Autodromo Enzo e Dino Ferrari',
         'country': 'Italy', 'city': 'Imola',
         'length_km': 4.909, 'turns': 19, 'races_since_2000': 6,
         'avg_speed': 'medium', 'track_type': 'classic', 'elevation_change': 40,
         'drs_zones': 2, 'pit_loss_s': 18.0,
         'tire_degradation': 'medium', 'overtaking_difficulty': 6},

        # Monaco
        {'circuitId': 'monaco', 'name': 'Circuit de Monaco',
         'country': 'Monaco', 'city': 'Monte Carlo',
         'length_km': 3.337, 'turns': 19, 'races_since_2000': 21,
         'avg_speed': 'low', 'track_type': 'street', 'elevation_change': 42,
         'drs_zones': 1, 'pit_loss_s': 23.0,
         'tire_degradation': 'low', 'overtaking_difficulty': 9},

        # Spain (Barcelona)
        {'circuitId': 'catalunya', 'name': 'Circuit de Barcelona-Catalunya',
         'country': 'Spain', 'city': 'Barcelona',
         'length_km': 4.675, 'turns': 16, 'races_since_2000': 33,
         'avg_speed': 'medium', 'track_type': 'modern', 'elevation_change': 25,
         'drs_zones': 3, 'pit_loss_s': 18.5,
         'tire_degradation': 'high', 'overtaking_difficulty': 5},

        # Canada
        {'circuitId': 'montreal', 'name': 'Circuit Gilles Villeneuve',
         'country': 'Canada', 'city': 'Montreal',
         'length_km': 4.361, 'turns': 14, 'races_since_2000': 31,
         'avg_speed': 'medium', 'track_type': 'street', 'elevation_change': 5,
         'drs_zones': 3, 'pit_loss_s': 17.5,
         'tire_degradation': 'medium', 'overtaking_difficulty': 4},

        # Austria
        {'circuitId': 'spielberg', 'name': 'Red Bull Ring',
         'country': 'Austria', 'city': 'Spielberg',
         'length_km': 4.318, 'turns': 10, 'races_since_2000': 24,
         'avg_speed': 'high', 'track_type': 'modern', 'elevation_change': 68,
         'drs_zones': 3, 'pit_loss_s': 17.0,
         'tire_degradation': 'low', 'overtaking_difficulty': 3},

        # UK (Silverstone)
        {'circuitId': 'silverstone', 'name': 'Silverstone Circuit',
         'country': 'United Kingdom', 'city': 'Silverstone',
         'length_km': 5.891, 'turns': 18, 'races_since_2000': 36,
         'avg_speed': 'very_high', 'track_type': 'classic', 'elevation_change': 20,
         'drs_zones': 3, 'pit_loss_s': 19.0,
         'tire_degradation': 'medium', 'overtaking_difficulty': 3},

        # Hungary
        {'circuitId': 'hungaroring', 'name': 'Hungaroring',
         'country': 'Hungary', 'city': 'Budapest',
         'length_km': 4.381, 'turns': 14, 'races_since_2000': 38,
         'avg_speed': 'low', 'track_type': 'technical', 'elevation_change': 18,
         'drs_zones': 2, 'pit_loss_s': 19.0,
         'tire_degradation': 'high', 'overtaking_difficulty': 7},

        # Belgium (Spa)
        {'circuitId': 'spa', 'name': 'Circuit de Spa-Francorchamps',
         'country': 'Belgium', 'city': 'Spa',
         'length_km': 7.004, 'turns': 19, 'races_since_2000': 38,
         'avg_speed': 'very_high', 'track_type': 'classic', 'elevation_change': 102,
         'drs_zones': 3, 'pit_loss_s': 21.0,
         'tire_degradation': 'medium', 'overtaking_difficulty': 3},

        # Netherlands (Zandvoort)
        {'circuitId': 'zandvoort', 'name': 'Circuit Zandvoort',
         'country': 'Netherlands', 'city': 'Zandvoort',
         'length_km': 4.259, 'turns': 14, 'races_since_2000': 4,
         'avg_speed': 'medium', 'track_type': 'coastal', 'elevation_change': 14,
         'drs_zones': 3, 'pit_loss_s': 17.5,
         'tire_degradation': 'medium', 'overtaking_difficulty': 4},

        # Italy (Monza)
        {'circuitId': 'monza', 'name': 'Autodromo Nazionale Monza',
         'country': 'Italy', 'city': 'Monza',
         'length_km': 5.793, 'turns': 11, 'races_since_2000': 40,
         'avg_speed': 'very_high', 'track_type': 'temple', 'elevation_change': 13,
         'drs_zones': 3, 'pit_loss_s': 19.5,
         'tire_degradation': 'low', 'overtaking_difficulty': 2},

        # Singapore
        {'circuitId': 'singapore', 'name': 'Marina Bay Street Circuit',
         'country': 'Singapore', 'city': 'Singapore',
         'length_km': 4.940, 'turns': 19, 'races_since_2000': 17,
         'avg_speed': 'low', 'track_type': 'street', 'elevation_change': 0,
         'drs_zones': 3, 'pit_loss_s': 22.0,
         'tire_degradation': 'low', 'overtaking_difficulty': 6},

        # USA (Austin)
        {'circuitId': 'austin', 'name': 'Circuit of the Americas',
         'country': 'USA', 'city': 'Austin',
         'length_km': 5.513, 'turns': 20, 'races_since_2000': 10,
         'avg_speed': 'medium', 'track_type': 'modern', 'elevation_change': 41,
         'drs_zones': 4, 'pit_loss_s': 19.0,
         'tire_degradation': 'high', 'overtaking_difficulty': 4},

        # Mexico
        {'circuitId': 'mexico', 'name': 'Autódromo Hermanos Rodríguez',
         'country': 'Mexico', 'city': 'Mexico City',
         'length_km': 4.304, 'turns': 17, 'races_since_2000': 24,
         'avg_speed': 'medium', 'track_type': 'high_altitude', 'elevation_change': 18,
         'drs_zones': 3, 'pit_loss_s': 18.0,
         'tire_degradation': 'low', 'overtaking_difficulty': 4},

        # Brazil (Interlagos)
        {'circuitId': 'interlagos', 'name': 'Interlagos',
         'country': 'Brazil', 'city': 'São Paulo',
         'length_km': 4.309, 'turns': 15, 'races_since_2000': 38,
         'avg_speed': 'medium', 'track_type': 'classic', 'elevation_change': 107,
         'drs_zones': 3, 'pit_loss_s': 18.5,
         'tire_degradation': 'high', 'overtaking_difficulty': 5},

        # Abu Dhabi
        {'circuitId': 'yas_marina', 'name': 'Yas Marina Circuit',
         'country': 'UAE', 'city': 'Abu Dhabi',
         'length_km': 5.554, 'turns': 16, 'races_since_2000': 13,
         'avg_speed': 'medium', 'track_type': 'modern', 'elevation_change': 6,
         'drs_zones': 4, 'pit_loss_s': 19.0,
         'tire_degradation': 'medium', 'overtaking_difficulty': 4},

        # Las Vegas
        {'circuitId': 'vegas', 'name': 'Las Vegas Strip Circuit',
         'country': 'USA', 'city': 'Las Vegas',
         'length_km': 6.201, 'turns': 17, 'races_since_2000': 1,
         'avg_speed': 'high', 'track_type': 'street', 'elevation_change': 10,
         'drs_zones': 3, 'pit_loss_s': 22.0,
         'tire_degradation': 'low', 'overtaking_difficulty': 3},

        # Qatar
        {'circuitId': 'qatar', 'name': 'Losail International Circuit',
         'country': 'Qatar', 'city': 'Lusail',
         'length_km': 5.419, 'turns': 16, 'races_since_2000': 1,
         'avg_speed': 'medium', 'track_type': 'desert', 'elevation_change': 4,
         'drs_zones': 3, 'pit_loss_s': 18.0,
         'tire_degradation': 'medium', 'overtaking_difficulty': 3},
    ]

    df = pd.DataFrame(circuits)

    # Map to numeric IDs
    circuit_id_map = {c['circuitId']: i+1 for i, c in enumerate(circuits)}
    df['circuitId_num'] = df['circuitId'].map(circuit_id_map)

    return df


def create_weather_database() -> pd.DataFrame:
    """
    Weather condition impacts on lap times.
    Based on F1 research: wet = +5-15% lap time, intermediate = +3-8%
    """
    weather = [
        {'condition': 'dry', 'condition_id': 1,
         'lap_time_multiplier': 1.000, 'grip_level': 1.00,
         'braking_distance_factor': 1.00, 'corner_speed_factor': 1.00,
         'description': 'Clear, dry track - optimal conditions'},

        {'condition': 'light_rain', 'condition_id': 2,
         'lap_time_multiplier': 1.080, 'grip_level': 0.85,
         'braking_distance_factor': 1.20, 'corner_speed_factor': 0.90,
         'description': 'Light rain, track drying or getting damp'},

        {'condition': 'heavy_rain', 'condition_id': 3,
         'lap_time_multiplier': 1.150, 'grip_level': 0.70,
         'braking_distance_factor': 1.40, 'corner_speed_factor': 0.75,
         'description': 'Heavy rain, very low grip, standing water'},

        {'condition': 'intermediate', 'condition_id': 4,
         'lap_time_multiplier': 1.050, 'grip_level': 0.80,
         'braking_distance_factor': 1.30, 'corner_speed_factor': 0.82,
         'description': 'Mixed conditions, intermediate tires'},

        {'condition': 'wet', 'condition_id': 5,
         'lap_time_multiplier': 1.120, 'grip_level': 0.73,
         'braking_distance_factor': 1.35, 'corner_speed_factor': 0.78,
         'description': 'Full wet conditions, extreme care needed'},

        {'condition': 'changing', 'condition_id': 6,
         'lap_time_multiplier': 1.060, 'grip_level': 0.82,
         'braking_distance_factor': 1.15, 'corner_speed_factor': 0.88,
         'description': 'Conditions changing during session'},
    ]

    return pd.DataFrame(weather)


def save_database(df: pd.DataFrame, name: str, data_dir: str = "f1_simulator/data"):
    """Save database to CSV."""
    Path(data_dir).mkdir(parents=True, exist_ok=True)
    path = Path(data_dir) / f"{name}.csv"
    df.to_csv(path, index=False)
    print(f"Saved {name}.csv: {len(df)} rows")
    return path


def build_complete_database(data_dir: str = "f1_simulator/data"):
    """Build and save complete F1 database."""
    print("Building comprehensive F1 database...")

    drivers_df = create_driver_database()
    teams_df = create_team_database()
    circuits_df = create_circuit_database()
    weather_df = create_weather_database()

    save_database(drivers_df, "drivers_real", data_dir)
    save_database(teams_df, "teams", data_dir)
    save_database(circuits_df, "circuits_real", data_dir)
    save_database(weather_df, "weather", data_dir)

    print("\nDatabase Summary:")
    print(f"  Drivers: {len(drivers_df)} (with full names, skills, stats)")
    print(f"  Teams: {len(teams_df)} (with performance ratings)")
    print(f"  Circuits: {len(circuits_df)} (with track characteristics)")
    print(f"  Weather: {len(weather_df)} conditions")

    print("\nSample drivers from Red Bull & Mercedes:")
    print(drivers_df[drivers_df['team'].isin(['Red Bull Racing', 'Mercedes'])][
          ['fullName', 'team', 'qualifying_skill', 'race_skill', 'wet_skill']])

    return {
        'drivers': drivers_df,
        'teams': teams_df,
        'circuits': circuits_df,
        'weather': weather_df
    }


if __name__ == "__main__":
    build_complete_database()
