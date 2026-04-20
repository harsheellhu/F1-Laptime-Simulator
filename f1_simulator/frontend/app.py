"""
F1 Lap Time Simulator - Streamlit Frontend

A complete UI for predicting lap times and simulating full races.
"""

import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import pickle
import requests
from pathlib import Path

# App configuration
st.set_page_config(
    page_title="F1 Lap Time Simulator",
    page_icon="🏎️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Constants
# Model path relative to this script (backend is in f1_simulator/backend, model in f1_simulator/model)
MODEL_PATH = Path(__file__).parent.parent / "model" / "model.pkl"
DEFAULT_MODE = "local"  # 'local' or 'api'


@st.cache_resource
def load_model():
    """Load the trained model and scaler from pickle file."""
    try:
        with open(MODEL_PATH, "rb") as f:
            data = pickle.load(f)
        return data
    except FileNotFoundError:
        return None
    except Exception as e:
        st.error(f"Error loading model: {e}")
        return None


def prepare_input_data(lap, grid, driver_id, constructor_id, circuit_id, year=None, length=None):
    """Create DataFrame in training format for prediction."""
    input_dict = {
        "lap": [lap],
        "grid": [grid],
        "driverId": [driver_id],
        "constructorId": [constructor_id],
        "circuitId": [circuit_id]
    }

    if year is not None:
        input_dict["year"] = [year]
    if length is not None:
        input_dict["length"] = [length]

    input_df = pd.DataFrame(input_dict)

    # One-hot encode
    cat_cols = ["driverId", "constructorId", "circuitId"]
    input_encoded = pd.get_dummies(input_df, columns=cat_cols, dtype=int)

    # Align with training columns
    if "feature_names" in model_data:
        for col in model_data["feature_names"]:
            if col not in input_encoded.columns:
                input_encoded[col] = 0
        input_encoded = input_encoded[model_data["feature_names"]]

    # Scale if scaler present
    if "scaler" in model_data:
        input_scaled = model_data["scaler"].transform(input_encoded)
        return pd.DataFrame(input_scaled, columns=input_encoded.columns)

    return input_encoded


def predict_single_lap(model_data, lap, grid, driver_id, constructor_id, circuit_id, year=None, length=None):
    """Predict lap time for a single lap."""
    input_df = prepare_input_data(lap, grid, driver_id, constructor_id, circuit_id, year, length)
    prediction = model_data["model"].predict(input_df)[0]
    return float(prediction)


def predict_multi_lap(model_data, num_laps, grid, driver_id, constructor_id, circuit_id, year=None, length=None):
    """Predict lap times for multiple laps."""
    lap_times = []
    for lap in range(1, num_laps + 1):
        pred = predict_single_lap(model_data, lap, grid, driver_id, constructor_id, circuit_id, year, length)
        lap_times.append(pred)
    return lap_times


def predict_single_lap_api(lap, grid, driver_id, constructor_id, circuit_id, year=None, length=None):
    """Send prediction request to FastAPI backend."""
    payload = {
        "lap": lap,
        "grid": grid,
        "driverId": driver_id,
        "constructorId": constructor_id,
        "circuitId": circuit_id
    }
    if year is not None:
        payload["year"] = year
    if length is not None:
        payload["length"] = length

    try:
        response = requests.post("http://localhost:8000/predict", json=payload, timeout=10)
        response.raise_for_status()
        return response.json()["lap_time_sec"]
    except requests.exceptions.ConnectionError:
        st.error("Cannot connect to API. Make sure FastAPI backend is running on http://localhost:8000")
        return None
    except Exception as e:
        st.error(f"API error: {e}")
        return None


def predict_multi_lap_api(num_laps, grid, driver_id, constructor_id, circuit_id, year=None, length=None):
    """Send simulation request to FastAPI backend."""
    payload = {
        "laps": num_laps,
        "grid": grid,
        "driverId": driver_id,
        "constructorId": constructor_id,
        "circuitId": circuit_id
    }
    if year is not None:
        payload["year"] = year
    if length is not None:
        payload["length"] = length

    try:
        response = requests.post("http://localhost:8000/simulate", json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.ConnectionError:
        st.error("Cannot connect to API. Make sure FastAPI backend is running on http://localhost:8000")
        return None
    except Exception as e:
        st.error(f"API error: {e}")
        return None


# ----- UI Layout -----

st.title("🏎️ F1 Lap Time Simulator")
st.markdown("""
Predict Formula 1 lap times using machine learning trained on historical race data.
Configure your race conditions and simulate lap times in real-time.
""")

# Load model
model_data = load_model()

if model_data is None:
    st.error("❌ Model not found. Please train the model first:")
    st.code("python f1_simulator/train.py")
    st.stop()

# Sidebar configuration
st.sidebar.header("Race Configuration")

# Input mode
mode = st.sidebar.radio(
    "Prediction Mode",
    ["Single Lap", "Full Race Simulation", "Comparison Mode"],
    help="Choose prediction type"
)

# Basic inputs
col1, col2 = st.sidebar.columns(2)
with col1:
    grid = st.number_input("Grid Position", min_value=1, max_value=20, value=5)
    driver_id = st.number_input("Driver ID", min_value=1, max_value=999, value=1)
with col2:
    circuit_id = st.number_input("Circuit ID", min_value=1, max_value=100, value=1)
    constructor_id = st.number_input("Constructor ID", min_value=1, max_value=10, value=1)

# Optional inputs
with st.sidebar.expander("Advanced Options"):
    year = st.number_input("Race Year", min_value=1950, max_value=2025, value=2020)
    length = st.number_input("Circuit Length (m)", min_value=2000, max_value=7000, value=5000)

# Main content area based on mode
if mode == "Single Lap":
    st.header("Single Lap Prediction")

    col1, col2 = st.columns([2, 1])

    with col1:
        lap = st.slider("Lap Number", min_value=1, max_value=70, value=10)

        if st.button("Predict Lap Time", type="primary", use_container_width=True):
            with st.spinner("Calculating..."):
                pred = predict_single_lap(model_data, lap, grid, driver_id, constructor_id, circuit_id, year, length)

                if pred:
                    minutes = int(pred // 60)
                    seconds = pred % 60

                    st.success(f"**Predicted Lap Time: {minutes:02d}:{seconds:06.3f}**")
                    st.metric("Lap Time (seconds)", f"{pred:.3f} s")

                    # Show lap time in context
                    avg_lap = 90.0
                    delta = pred - avg_lap
                    if delta > 0:
                        st.warning(f"+{delta:.3f}s slower than average")
                    else:
                        st.info(f"{abs(delta):.3f}s faster than average")

    with col2:
        st.subheader("Configuration Summary")
        st.write(f"**Grid Position:** {grid}")
        st.write(f"**Driver ID:** {driver_id}")
        st.write(f"**Circuit ID:** {circuit_id}")
        st.write(f"**Constructor ID:** {constructor_id}")
        st.write(f"**Lap:** {lap}")

elif mode == "Full Race Simulation":
    st.header("Full Race Simulation")

    col1, col2 = st.columns([2, 1])

    with col1:
        num_laps = st.slider("Number of Laps", min_value=5, max_value=100, value=50)

        if st.button("Simulate Race", type="primary", use_container_width=True):
            with st.spinner(f"Simulating {num_laps} laps..."):
                lap_times = predict_multi_lap(model_data, num_laps, grid, driver_id, constructor_id, circuit_id, year, length)

                if lap_times:
                    lap_times_np = np.array(lap_times)

                    # Display summary metrics
                    m1, m2, m3, m4 = st.columns(4)
                    m1.metric("Average Lap", f"{lap_times_np.mean():.3f}s")
                    m2.metric("Fastest Lap", f"{lap_times_np.min():.3f}s")
                    m3.metric("Slowest Lap", f"{lap_times_np.max():.3f}s")
                    m4.metric("Total Time", f"{lap_times_np.sum():.1f}s")

                    # Plot lap times
                    fig, ax = plt.subplots(figsize=(10, 4))
                    ax.plot(range(1, num_laps + 1), lap_times, marker="o", linewidth=2, markersize=4)
                    ax.set_xlabel("Lap Number")
                    ax.set_ylabel("Lap Time (seconds)")
                    ax.set_title("Lap Time Simulation")
                    ax.grid(True, alpha=0.3)
                    st.pyplot(fig)

                    # Show lap times table
                    with st.expander("View Lap Times Table"):
                        df = pd.DataFrame({
                            "Lap": range(1, num_laps + 1),
                            "Lap Time (s)": [f"{t:.3f}" for t in lap_times]
                        })
                        st.dataframe(df, use_container_width=True)

    with col2:
        st.subheader("Race Configuration")
        st.write(f"**Grid Position:** {grid}")
        st.write(f"**Laps:** {num_laps}")
        st.write(f"**Driver ID:** {driver_id}")
        st.write(f"**Circuit ID:** {circuit_id}")

elif mode == "Comparison Mode":
    st.header("Compare Two Scenarios")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Scenario A")
        a_laps = st.slider("Laps (A)", 1, 70, 30, key="a_laps")
        a_grid = st.number_input("Grid (A)", 1, 20, 3, key="a_grid")
        a_driver = st.number_input("Driver ID (A)", 1, 999, 1, key="a_driver")
        a_circuit = st.number_input("Circuit ID (A)", 1, 100, 1, key="a_circuit")

    with col2:
        st.subheader("Scenario B")
        b_laps = st.slider("Laps (B)", 1, 70, 30, key="b_laps")
        b_grid = st.number_input("Grid (B)", 1, 20, 8, key="b_grid")
        b_driver = st.number_input("Driver ID (B)", 1, 999, 2, key="b_driver")
        b_circuit = st.number_input("Circuit ID (B)", 1, 100, 1, key="b_circuit")

    if st.button("Compare Scenarios", type="primary"):
        with st.spinner("Running comparison..."):
            times_a = predict_multi_lap(model_data, a_laps, a_grid, a_driver, a_circuit, circuit_id=1)
            times_b = predict_multi_lap(model_data, b_laps, b_grid, b_driver, b_circuit, circuit_id=1)

            if times_a and times_b:
                # Plot comparison
                fig, ax = plt.subplots(figsize=(10, 4))
                ax.plot(range(1, a_laps + 1), times_a, label="Scenario A", linewidth=2)
                ax.plot(range(1, b_laps + 1), times_b, label="Scenario B", linewidth=2)
                ax.set_xlabel("Lap Number")
                ax.set_ylabel("Lap Time (s)")
                ax.set_title("Scenario Comparison")
                ax.legend()
                ax.grid(True, alpha=0.3)
                st.pyplot(fig)

                # Summary
                c1, c2 = st.columns(2)
                with c1:
                    st.metric("Avg A", f"{np.mean(times_a):.3f}s")
                    st.metric("Fastest A", f"{np.min(times_a):.3f}s")
                with c2:
                    st.metric("Avg B", f"{np.mean(times_b):.3f}s")
                    st.metric("Fastest B", f"{np.min(times_b):.3f}s")

# Footer
st.divider()
st.markdown("""
---
**F1 Lap Time Simulator** - Built with FastAPI, Streamlit, and Scikit-Learn
[Trained on Formula 1 World Championship Dataset (1950-2020)]
""")
