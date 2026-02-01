"""
Counterfactual AI / What-if Engine

Interpretable ML that predicts target outcomes (energy, stress) from recent features,
then simulates "what-if" changes (counterfactuals) by modifying inputs and re-predicting.
Uses only: pandas, numpy, scikit-learn.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------


class CounterfactualEngineError(Exception):
    """Base exception for the counterfactual engine."""

    pass


class LoadRecordsError(CounterfactualEngineError):
    """Raised when records cannot be loaded from path."""

    pass


class TrainingFrameError(CounterfactualEngineError):
    """Raised when the training frame cannot be built or is invalid."""

    pass


class SimulationError(CounterfactualEngineError):
    """Raised when counterfactual simulation fails."""

    pass


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SLEEP_MIN, SLEEP_MAX = 3.0, 12.0
STEPS_MIN, STEPS_MAX = 0, 30_000
CALORIES_MIN, CALORIES_MAX = 800, 5_000

ENERGY_FEATURES = ["sleep_hours", "steps", "hrv", "resting_hr", "stress", "calories_in"]
STRESS_FEATURES = ["sleep_hours", "steps", "hrv", "resting_hr", "calories_in"]

# Features the user can change via sliders (for SHAP-lite explanation)
DELTA_FEATURES = ["sleep_hours", "steps", "calories_in"]
ENERGY_DELTA_INDEX = {f: ENERGY_FEATURES.index(f) for f in DELTA_FEATURES}
STRESS_DELTA_INDEX = {f: STRESS_FEATURES.index(f) for f in DELTA_FEATURES}

# Drift: max allowed (std multipliers) for last-N-days mean vs training mean
DRIFT_LOOKBACK_DAYS = 7
DRIFT_THRESHOLD_STD = 1.5


# ---------------------------------------------------------------------------
# Load and frame building
# ---------------------------------------------------------------------------


def load_records(path: str | Path) -> list[dict[str, Any]]:
    """
    Load health records from a JSON file.

    Expects either a list of record dicts or an object with a "records" key
    containing the list (e.g. synthetic_health_data.json with metadata).

    Args:
        path: File path to the JSON file.

    Returns:
        List of record dictionaries.

    Raises:
        LoadRecordsError: If the file is missing, not valid JSON, or does not
            contain a list of records.
    """
    path = Path(path)
    if not path.exists():
        raise LoadRecordsError(f"Path does not exist: {path}")

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise LoadRecordsError(f"Invalid JSON in {path}: {e}") from e

    if isinstance(data, list):
        records = data
    elif isinstance(data, dict) and "records" in data:
        records = data["records"]
    else:
        raise LoadRecordsError(
            f"JSON must be a list of records or an object with 'records' key; got {type(data).__name__}"
        )

    if not isinstance(records, list):
        raise LoadRecordsError(f"'records' must be a list; got {type(records).__name__}")

    return records


def build_training_frame(records: list[dict[str, Any]]) -> pd.DataFrame:
    """
    Build a pandas DataFrame suitable for training from raw health records.

    Columns: date, sleep_hours, sleep_quality, steps, active_minutes,
    resting_hr, hrv, calories_in, stress, energy.
    Rows with any missing value in these columns are dropped.

    Args:
        records: List of record dicts (each with date, sleep, heart_rate,
            activity, nutrition, wellness nested keys).

    Returns:
        DataFrame with numeric types and no missing values.

    Raises:
        TrainingFrameError: If records are empty or no rows remain after
            dropping missing values.
    """
    if not records:
        raise TrainingFrameError("records list is empty")

    rows: list[dict[str, Any]] = []
    for r in records:
        sleep = r.get("sleep") or {}
        hr = r.get("heart_rate") or {}
        activity = r.get("activity") or {}
        nutrition = r.get("nutrition") or {}
        wellness = r.get("wellness") or {}

        row = {
            "date": r.get("date"),
            "sleep_hours": sleep.get("duration_hours"),
            "sleep_quality": sleep.get("quality_score"),
            "steps": activity.get("steps"),
            "active_minutes": activity.get("active_minutes"),
            "resting_hr": hr.get("resting"),
            "hrv": hr.get("hrv"),
            "calories_in": nutrition.get("calories"),
            "stress": wellness.get("stress_score"),
            "energy": wellness.get("energy_level"),
        }
        rows.append(row)

    df = pd.DataFrame(rows)

    required = [
        "date",
        "sleep_hours",
        "sleep_quality",
        "steps",
        "active_minutes",
        "resting_hr",
        "hrv",
        "calories_in",
        "stress",
        "energy",
    ]
    for col in required:
        if col not in df.columns:
            raise TrainingFrameError(f"Missing required column: {col}")

    df = df.dropna(subset=required).copy()
    if df.empty:
        raise TrainingFrameError("No rows remaining after dropping missing values")

    # Ensure numeric types for feature columns (excluding date)
    numeric_cols = [c for c in required if c != "date"]
    df[numeric_cols] = df[numeric_cols].astype(float)

    return df


# ---------------------------------------------------------------------------
# Training and simulation
# ---------------------------------------------------------------------------


def _clamp(value: float, low: float, high: float) -> float:
    return float(np.clip(value, low, high))


def simulate_counterfactual(
    df: pd.DataFrame,
    day_index: int,
    deltas: dict[str, float],
) -> dict[str, Any]:
    """
    Simulate a counterfactual by applying deltas to one day and re-predicting
    energy and stress with linear models.

    Models are trained on the full dataframe: one predicts energy from
    sleep_hours, steps, hrv, resting_hr, stress, calories_in; the other
    predicts stress from sleep_hours, steps, hrv, resting_hr, calories_in.
    Deltas are applied to sleep_hours, steps, and/or calories_in and clamped
    to sensible ranges (sleep 3–12, steps 0–30k, calories 800–5k).

    Args:
        df: Training frame from build_training_frame (must contain all
            required columns).
        day_index: Row index of the day to use (0-based; e.g. -1 for last day
            is not supported; use len(df)-1 explicitly).
        deltas: Optional changes, e.g. {"sleep_hours_delta": 1.0,
            "steps_delta": 2000, "calories_in_delta": -200}. Unspecified
            deltas are treated as 0.

    Returns:
        Dict with:
          - baseline: {energy, stress, features} for the selected day.
          - counterfactual: {energy, stress, features} after applying deltas.
          - delta: {energy, stress} (counterfactual minus baseline).
          - model_info: {energy_r2, stress_r2, training_rows}.
          - explanation: {energy, stress} SHAP-lite contributions per input.
          - confidence: {energy_std, stress_std} from training residuals.
          - drift: {in_domain, message?, details} last-N-days vs training.

    Raises:
        SimulationError: If day_index is out of range, training fails, or
            required columns are missing.
    """
    if df is None or df.empty:
        raise SimulationError("DataFrame is empty")

    for col in ENERGY_FEATURES + ["energy"]:
        if col not in df.columns:
            raise SimulationError(f"DataFrame missing required column: {col}")
    for col in STRESS_FEATURES + ["stress"]:
        if col not in df.columns:
            raise SimulationError(f"DataFrame missing required column: {col}")

    # Support negative indexing (e.g., -1 for last day)
    if day_index < 0:
        day_index = len(df) + day_index

    if day_index < 0 or day_index >= len(df):
        raise SimulationError(
            f"day_index {day_index} out of range [0, {len(df) - 1}]"
        )

    # Train models on full dataframe
    X_energy = df[ENERGY_FEATURES].astype(float)
    y_energy = df["energy"].astype(float)
    X_stress = df[STRESS_FEATURES].astype(float)
    y_stress = df["stress"].astype(float)

    energy_model = LinearRegression()
    energy_model.fit(X_energy, y_energy)
    stress_model = LinearRegression()
    stress_model.fit(X_stress, y_stress)

    energy_r2 = float(r2_score(y_energy, energy_model.predict(X_energy)))
    stress_r2 = float(r2_score(y_stress, stress_model.predict(X_stress)))
    training_rows = int(len(df))

    # Baseline row
    row = df.iloc[day_index].copy()
    baseline_features = {
        "sleep_hours": float(row["sleep_hours"]),
        "sleep_quality": float(row["sleep_quality"]),
        "steps": float(row["steps"]),
        "active_minutes": float(row["active_minutes"]),
        "resting_hr": float(row["resting_hr"]),
        "hrv": float(row["hrv"]),
        "calories_in": float(row["calories_in"]),
        "stress": float(row["stress"]),
        "energy": float(row["energy"]),
    }

    baseline_energy = float(energy_model.predict(X_energy.iloc[[day_index]])[0])
    baseline_stress = float(stress_model.predict(X_stress.iloc[[day_index]])[0])

    # Counterfactual: apply deltas and clamp
    sleep_delta = float(deltas.get("sleep_hours_delta", 0.0))
    steps_delta = float(deltas.get("steps_delta", 0.0))
    calories_delta = float(deltas.get("calories_in_delta", 0.0))

    cf_sleep = _clamp(baseline_features["sleep_hours"] + sleep_delta, SLEEP_MIN, SLEEP_MAX)
    cf_steps = _clamp(baseline_features["steps"] + steps_delta, STEPS_MIN, STEPS_MAX)
    cf_calories = _clamp(
        baseline_features["calories_in"] + calories_delta, CALORIES_MIN, CALORIES_MAX
    )

    cf_features = {
        "sleep_hours": cf_sleep,
        "sleep_quality": baseline_features["sleep_quality"],
        "steps": cf_steps,
        "active_minutes": baseline_features["active_minutes"],
        "resting_hr": baseline_features["resting_hr"],
        "hrv": baseline_features["hrv"],
        "calories_in": cf_calories,
        "stress": baseline_features["stress"],  # will be overwritten by predicted
        "energy": baseline_features["energy"],  # will be overwritten by predicted
    }

    # Predict counterfactual stress first (no dependency on energy), then energy
    X_cf_stress = pd.DataFrame([{
        "sleep_hours": cf_features["sleep_hours"],
        "steps": cf_features["steps"],
        "hrv": cf_features["hrv"],
        "resting_hr": cf_features["resting_hr"],
        "calories_in": cf_features["calories_in"],
    }])
    cf_stress = float(stress_model.predict(X_cf_stress)[0])
    cf_features["stress"] = cf_stress

    X_cf_energy = pd.DataFrame([{
        "sleep_hours": cf_features["sleep_hours"],
        "steps": cf_features["steps"],
        "hrv": cf_features["hrv"],
        "resting_hr": cf_features["resting_hr"],
        "stress": cf_features["stress"],
        "calories_in": cf_features["calories_in"],
    }])
    cf_energy = float(energy_model.predict(X_cf_energy)[0])
    cf_features["energy"] = cf_energy

    # -------------------------------------------------------------------------
    # 1. Feature contributions (SHAP-lite): contribution = coef * (cf - baseline)
    # -------------------------------------------------------------------------
    energy_coef = energy_model.coef_
    stress_coef = stress_model.coef_
    cf_sleep = cf_features["sleep_hours"]
    cf_steps = cf_features["steps"]
    cf_calories = cf_features["calories_in"]
    base_sleep = baseline_features["sleep_hours"]
    base_steps = baseline_features["steps"]
    base_calories = baseline_features["calories_in"]

    def _round_contrib(v: float) -> float:
        return round(float(v), 2)

    explanation_energy = {
        "sleep_hours": _round_contrib(energy_coef[ENERGY_DELTA_INDEX["sleep_hours"]] * (cf_sleep - base_sleep)),
        "steps": _round_contrib(energy_coef[ENERGY_DELTA_INDEX["steps"]] * (cf_steps - base_steps)),
        "calories_in": _round_contrib(energy_coef[ENERGY_DELTA_INDEX["calories_in"]] * (cf_calories - base_calories)),
    }
    explanation_stress = {
        "sleep_hours": _round_contrib(stress_coef[STRESS_DELTA_INDEX["sleep_hours"]] * (cf_sleep - base_sleep)),
        "steps": _round_contrib(stress_coef[STRESS_DELTA_INDEX["steps"]] * (cf_steps - base_steps)),
        "calories_in": _round_contrib(stress_coef[STRESS_DELTA_INDEX["calories_in"]] * (cf_calories - base_calories)),
    }

    # -------------------------------------------------------------------------
    # 2. Confidence: std of training residuals (uncertainty awareness)
    # -------------------------------------------------------------------------
    y_energy_pred = energy_model.predict(X_energy)
    y_stress_pred = stress_model.predict(X_stress)
    energy_residuals = np.asarray(y_energy, dtype=float) - np.asarray(y_energy_pred, dtype=float)
    stress_residuals = np.asarray(y_stress, dtype=float) - np.asarray(y_stress_pred, dtype=float)

    def _safe_std(arr: np.ndarray) -> float:
        if len(arr) < 2:
            return 0.0
        s = np.nanstd(arr)
        return round(float(np.nan_to_num(s, nan=0.0, posinf=0.0, neginf=0.0)), 2)

    energy_std = _safe_std(energy_residuals)
    stress_std = _safe_std(stress_residuals)

    # -------------------------------------------------------------------------
    # 3. Drift detector: last N days mean vs training mean (production ML)
    # -------------------------------------------------------------------------
    n_tail = min(DRIFT_LOOKBACK_DAYS, len(df))
    tail = df.tail(n_tail)
    training_means = {c: float(df[c].mean()) for c in DELTA_FEATURES}
    training_stds = {}
    for c in DELTA_FEATURES:
        s = df[c].std()
        training_stds[c] = float(s) if pd.notna(s) and s > 0 else 1.0
    last_n_means = {c: float(tail[c].mean()) for c in DELTA_FEATURES}
    in_domain = True
    drift_details = {}
    for c in DELTA_FEATURES:
        t_std = training_stds[c]
        diff = abs(last_n_means[c] - training_means[c])
        diff_std = round(diff / t_std, 2) if t_std else 0.0
        drift_details[c] = {
            "training_mean": round(training_means[c], 2),
            "last_7_mean": round(last_n_means[c], 2),
            "diff_std": diff_std,
        }
        if diff > DRIFT_THRESHOLD_STD * t_std:
            in_domain = False
    drift_message = (
        None
        if in_domain
        else "Model operating outside training distribution — recent data differs from training."
    )

    return {
        "baseline": {
            "energy": baseline_energy,
            "stress": baseline_stress,
            "features": baseline_features,
        },
        "counterfactual": {
            "energy": cf_energy,
            "stress": cf_stress,
            "features": cf_features,
        },
        "delta": {
            "energy": cf_energy - baseline_energy,
            "stress": cf_stress - baseline_stress,
        },
        "model_info": {
            "energy_r2": energy_r2,
            "stress_r2": stress_r2,
            "training_rows": training_rows,
        },
        "explanation": {
            "energy": explanation_energy,
            "stress": explanation_stress,
        },
        "confidence": {
            "energy_std": energy_std,
            "stress_std": stress_std,
        },
        "drift": {
            "in_domain": in_domain,
            "message": drift_message,
            "details": drift_details,
        },
    }
