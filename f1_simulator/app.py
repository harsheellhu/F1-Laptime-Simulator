import streamlit as st
import requests
import pandas as pd

API_URL = "http://localhost:8000"

st.set_page_config(page_title="F1 Simulator", page_icon="🏎️", layout="wide")

# Theme / Glassmorphism CSS for Streamlit
st.markdown("""
<style>
    .glass-card {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 20px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        margin-bottom: 20px;
    }
    .metric-value {
        font-family: monospace;
        font-size: 2rem;
        font-weight: bold;
        color: #e8002d;
    }
</style>
""", unsafe_allow_html=True)

st.title("🏎️ F1 Lap Time Simulator (Streamlit Edition)")
st.markdown("Real ML Predictions from 120,000+ actual F1 lap times.")

# Load data from API
try:
    drivers = requests.get(f"{API_URL}/drivers").json().get("drivers", [])
    circuits = requests.get(f"{API_URL}/circuits").json().get("circuits", [])
    constructors = requests.get(f"{API_URL}/constructors").json().get("constructors", [])
    model_info = requests.get(f"{API_URL}/model-info").json()
except Exception as e:
    st.error(f"Cannot connect to FastAPI Backend at {API_URL}. Please start it first.")
    st.stop()

# Layout
col1, col2 = st.columns([1, 2])

with col1:
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    st.subheader("Setup")
    d_id = st.selectbox("Driver", options=[d["driverId_num"] for d in drivers], 
                        format_func=lambda x: next((d["fullName"] for d in drivers if d["driverId_num"] == x), str(x)))
    c_id = st.selectbox("Circuit", options=[c["circuitId_num"] for c in circuits],
                        format_func=lambda x: next((c["name"] for c in circuits if c["circuitId_num"] == x), str(x)))
    con_id = st.selectbox("Team", options=[c["constructorId_num"] for c in constructors],
                          format_func=lambda x: next((c["name"] for c in constructors if c["constructorId_num"] == x), str(x)))
    
    laps = st.slider("Laps", 5, 70, 20)
    grid = st.slider("Grid Position", 1, 20, 1)
    
    pit1 = st.number_input("Pit Stop 1 (Lap)", 0, laps, 0)
    pit2 = st.number_input("Pit Stop 2 (Lap)", 0, laps, 0)
    st.markdown('</div>', unsafe_allow_html=True)

    if st.button("Start Simulation", use_container_width=True, type="primary"):
        with st.spinner("Simulating full race..."):
            req = {
                "laps": laps, "grid": grid,
                "driver_id": d_id, "constructor_id": con_id, "circuit_id": c_id,
                "circuit_length_km": next((c["length_km"] for c in circuits if c["circuitId_num"] == c_id), 5.0),
                "year": 2023,
                "pit_lap_1": pit1 if pit1 > 0 else None,
                "pit_lap_2": pit2 if pit2 > 0 else None
            }
            res = requests.post(f"{API_URL}/simulate", json=req).json()
            
            st.session_state["results"] = res

with col2:
    if "results" in st.session_state:
        res = st.session_state["results"]
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.subheader("Race Results")
        
        m1, m2, m3 = st.columns(3)
        m1.metric("Total Time", res["total_race_formatted"])
        m2.metric("Fastest Lap", res["fastest_lap_formatted"])
        m3.metric("Avg Lap", res["avg_lap_formatted"])
        
        df = pd.DataFrame(res["laps"])
        st.line_chart(df.set_index("lap")["time"], color="#e8002d")
        
        with st.expander("Per-Lap Breakdown"):
            st.dataframe(df[["lap", "lap_time_formatted", "is_pit"]], use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.subheader("Model Performance")
        st.metric("Model Type", model_info.get("model_type", "Unknown").upper())
        st.metric("Test MAE", f"{model_info.get('test_mae', 0):.3f}s")
        st.metric("Test R²", f"{model_info.get('test_r2', 0):.4f}")
        st.markdown('</div>', unsafe_allow_html=True)

# ============================================
# STARTUP INSTRUCTIONS
# ============================================
st.divider()
st.header("🚀 Quick Start")

with st.expander("How to Run the F1 Simulator", expanded=True):
    st.markdown("""
    ### Option 1: Streamlit App (Recommended)
    ```bash
    streamlit run f1_simulator/app.py
    ```
    Or with uvicorn:
    ```bash
    uvicorn f1_simulator.app:starlet --reload --port 8501
    ```
    
    ### Option 2: Advanced Scientific Edition
    ```bash
    streamlit run f1_simulator/frontend/app_advanced.py
    ```
    
    ### Option 3: API + React Frontend
    ```bash
    # Terminal 1 - Start FastAPI
    uvicorn f1_simulator.backend.main:app --reload --port 8000
    
    # Terminal 2 - Start React
    cd f1-react-app && npm run dev
    ```
    
    ### API Endpoints
    | Endpoint | Description |
    |----------|------------|
    | GET /predict | Single lap time |
    | POST /simulate | Full race simulation |
    | GET /model-info | Model metrics |
    | GET /formulae | ML formulae |
    | GET /drivers | Driver list |
    | GET /circuits | Circuit list |
    | GET /constructors | Team list |
    """)
