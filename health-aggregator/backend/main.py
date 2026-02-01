"""
Health & Wellness Aggregator - Backend API
Palo Alto Networks Hackathon 2025

A security-minded approach to health data aggregation and anomaly detection.
"""
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime

from services.data_ingestion import DataIngestionService
from services.anomaly_detection import AnomalyDetectionService
from services.correlation_engine import CorrelationEngine
from services.llm_insights import LLMInsightGenerator
from models.health_data import (
    AnomalyAlert,
    CorrelationInsight,
    DashboardSummary,
    HealthScoreResponse
)

# Optional ML counterfactual engine (pandas, sklearn required)
try:
    from services.counterfactual_engine import (
        load_records,
        build_training_frame,
        simulate_counterfactual,
        SimulationError,
    )
    _ml_available = True
except ImportError:
    _ml_available = False
    load_records = build_training_frame = simulate_counterfactual = None
    SimulationError = Exception  # noqa: A001

app = FastAPI(
    title="Health & Wellness Aggregator",
    description="AI-powered health data aggregation with security-style anomaly detection",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data for ML counterfactual engine (if available)
_ml_df = None
if _ml_available:
    try:
        _data_path = Path(__file__).parent / "data" / "synthetic_health_data.json"
        _records = load_records(str(_data_path))
        _ml_df = build_training_frame(_records)
    except Exception:
        _ml_df = None

data_service = DataIngestionService()
anomaly_service = AnomalyDetectionService()
correlation_engine = CorrelationEngine()
llm_generator = LLMInsightGenerator()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Health & Wellness Aggregator",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/dashboard/summary")
async def get_dashboard_summary():
    """Get complete dashboard summary"""
    try:
        metrics = data_service.get_latest_metrics()
        anomalies = anomaly_service.get_recent_anomalies(limit=5)
        correlations = correlation_engine.get_top_correlations(limit=3)
        health_score = anomaly_service.calculate_health_score()
        
        return {
            "current_metrics": metrics,
            "recent_anomalies": anomalies,
            "key_correlations": correlations,
            "health_score": health_score,
            "last_updated": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/history")
async def get_metrics_history(days: int = 30, metric_type: Optional[str] = None):
    """Get historical health metrics"""
    try:
        history = data_service.get_metrics_history(days=days, metric_type=metric_type)
        return {"data": history, "days": days, "metric_type": metric_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/anomalies", response_model=list[AnomalyAlert])
async def get_anomalies(severity: Optional[str] = None, limit: int = 20):
    """Get detected anomalies with optional severity filter"""
    try:
        return anomaly_service.get_anomalies(severity=severity, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/anomalies/timeline")
async def get_anomaly_timeline(days: int = 14):
    """Get anomaly timeline for pattern visualization"""
    try:
        timeline = anomaly_service.get_anomaly_timeline(days=days)
        return {"timeline": timeline, "days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/correlations", response_model=list[CorrelationInsight])
async def get_correlations(limit: int = 10):
    """Get discovered correlations between health metrics"""
    try:
        return correlation_engine.get_correlations(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/insights/ai")
async def get_ai_insights():
    """Get AI-generated natural language insights"""
    try:
        anomalies = anomaly_service.get_recent_anomalies(limit=5)
        correlations = correlation_engine.get_top_correlations(limit=5)
        trends = data_service.get_trend_summary()
        
        insights = llm_generator.generate_insights(
            anomalies=anomalies,
            correlations=correlations,
            trends=trends
        )
        return {"insights": insights, "generated_at": datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health-score", response_model=HealthScoreResponse)
async def get_health_score():
    """Get detailed health score breakdown"""
    try:
        return anomaly_service.calculate_health_score_detailed()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/baselines")
async def get_baselines():
    """Get established personal baselines"""
    try:
        return {"baselines": anomaly_service.get_baselines()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/data/refresh")
async def refresh_data():
    """Refresh data and recalculate anomalies"""
    try:
        data_service.refresh_data()
        anomaly_service.recalculate_anomalies()
        correlation_engine.recalculate_correlations()
        return {"status": "success", "refreshed_at": datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _run_simulate(
    sleep_hours_delta: float = 0,
    steps_delta: float = 0,
    calories_in_delta: float = 0,
    day_index: int = -1,
):
    """Shared logic for GET/POST simulate."""
    if _ml_df is None or len(_ml_df) == 0:
        raise HTTPException(
            status_code=503,
            detail="ML counterfactual engine not available (install pandas, numpy, scikit-learn and ensure data is loaded)."
        )
    n = len(_ml_df)
    actual_index = day_index if day_index >= 0 else n + day_index
    if actual_index < 0 or actual_index >= n:
        raise HTTPException(
            status_code=400,
            detail=f"day_index {day_index} resolves to {actual_index}; must be in [0, {n - 1}]."
        )
    deltas = {}
    if sleep_hours_delta != 0:
        deltas["sleep_hours_delta"] = sleep_hours_delta
    if steps_delta != 0:
        deltas["steps_delta"] = steps_delta
    if calories_in_delta != 0:
        deltas["calories_in_delta"] = calories_in_delta
    return simulate_counterfactual(_ml_df, actual_index, deltas)


@app.get("/api/ml/simulate")
@app.post("/api/ml/simulate")
async def simulate_what_if(
    sleep_hours_delta: float = 0,
    steps_delta: float = 0,
    calories_in_delta: float = 0,
    day_index: int = -1,
):
    """
    Simulate counterfactual scenarios ("What-If" analysis).
    Supports both GET (query params) and POST.

    Examples:
    - "What if I slept 1 more hour?" → sleep_hours_delta=1
    - "What if I walked 2000 more steps?" → steps_delta=2000
    - "What if I ate 300 fewer calories?" → calories_in_delta=-300
    """
    try:
        return _run_simulate(
            sleep_hours_delta=sleep_hours_delta,
            steps_delta=steps_delta,
            calories_in_delta=calories_in_delta,
            day_index=day_index,
        )
    except HTTPException:
        raise
    except SimulationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/model-info")
async def get_model_info():
    """Get ML model information and sample predictions."""
    if _ml_df is None:
        raise HTTPException(
            status_code=503,
            detail="ML counterfactual engine not available (install pandas, numpy, scikit-learn and ensure data is loaded)."
        )
    try:
        result = simulate_counterfactual(_ml_df, len(_ml_df) - 1, {})
        return {
            "model_info": result["model_info"],
            "latest_day": result["baseline"],
            "available_days": len(_ml_df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)