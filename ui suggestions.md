# 🖥️ UI Requirements – F1 Lap Time Simulator

## 📌 Overview

The UI is designed to interact with a Python-based backend (ML model + simulation engine). It should allow users to input race parameters and receive predicted lap times in real-time.

The interface must be:

* Simple
* Fast
* Interactive
* Data-driven

---

## 🧱 Architecture

### Frontend Options:

1. **Streamlit (Recommended)**
2. Flask + HTML/CSS/JS
3. React (optional) + FastAPI backend

### Backend:

* Python (ML model + simulation logic)
* REST API (if using Flask/FastAPI)

---

## 🎛️ Core UI Components

### 1. Input Panel (User Controls)

#### Required Inputs:

* **Driver Selector**

  * Dropdown list of drivers
* **Constructor/Team Selector**

  * Dropdown
* **Circuit Selector**

  * Dropdown
* **Lap Number**

  * Slider (range: 1–70)
* **Grid Position**

  * Numeric input or slider
* **Track Condition**

  * Dropdown:

    * Dry
    * Wet
    * Mixed

#### Optional Inputs (Advanced):

* Tire Type (Soft / Medium / Hard)
* Weather (Temperature, Rain %)
* Pit Stop Toggle (Yes/No)

---

### 2. Simulation Controls

* **Simulate Button**

  * Triggers prediction
* **Reset Button**

  * Clears all inputs
* **Batch Simulation Toggle**

  * Run multiple laps simulation

---

## 📊 Output Panel

### 1. Primary Output

* Predicted Lap Time (in seconds)
* Display format:

  * `1:23.456` OR `83.456 sec`

---

### 2. Visualization

#### Graphs:

* Lap Time vs Lap Number
* Tire Degradation Curve (if enabled)

#### Charts:

* Bar chart comparing drivers
* Line chart for race simulation

---

### 3. Additional Outputs

* Model Confidence (optional)
* Comparison with average lap time
* Delta vs best lap

---

## 🔄 User Flow

1. User selects:

   * Driver
   * Circuit
   * Lap number
2. Clicks **Simulate**
3. Backend processes input
4. Prediction returned
5. UI updates:

   * Lap time shown
   * Graph updated

---

## ⚙️ Backend Integration

### API Endpoint Example:

```
POST /predict
```

### Request JSON:

```json
{
  "driver": "hamilton",
  "constructor": "mercedes",
  "circuit": "monza",
  "lap": 25,
  "grid_position": 3,
  "track_condition": "dry"
}
```

### Response JSON:

```json
{
  "predicted_lap_time": 83.45
}
```

---

## 🎨 UI Design Guidelines

* Dark theme (F1-style)
* Use red/black color palette
* Minimal clutter
* Large readable numbers for lap time
* Responsive layout

---

## ⚡ Performance Requirements

* Prediction response time < 1 second
* UI should update instantly after simulation
* Handle multiple simulations smoothly

---

## 🧪 Testing Requirements

* Validate all inputs
* Handle missing values gracefully
* Ensure dropdowns are populated correctly
* Test extreme values (lap 1 vs lap 70)

---

## 🚀 Future UI Enhancements

* Live race simulation animation
* Leaderboard display
* Multi-driver comparison mode
* Strategy simulator (pit stops, tire changes)

---

## 🧩 Recommended Stack

### Simple Setup:

* Streamlit + Scikit-learn model

### Advanced Setup:

* React (frontend)
* FastAPI (backend)
* WebSockets (real-time updates)

---

## 🏁 Summary

The UI should provide a smooth interaction layer between the user and the ML model, enabling real-time lap time predictions and race simulations with minimal latency and maximum clarity.

---
