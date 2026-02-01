from .data_ingestion import DataIngestionService
from .anomaly_detection import AnomalyDetectionService
from .correlation_engine import CorrelationEngine
from .llm_insights import LLMInsightGenerator

try:
    from .counterfactual_engine import (
        load_records,
        build_training_frame,
        simulate_counterfactual,
        CounterfactualEngineError,
        LoadRecordsError,
        TrainingFrameError,
        SimulationError,
    )
    _counterfactual_available = True
except ImportError:
    load_records = build_training_frame = simulate_counterfactual = None
    CounterfactualEngineError = LoadRecordsError = TrainingFrameError = SimulationError = None  # type: ignore
    _counterfactual_available = False

__all__ = [
    "DataIngestionService",
    "AnomalyDetectionService",
    "CorrelationEngine",
    "LLMInsightGenerator",
    "load_records",
    "build_training_frame",
    "simulate_counterfactual",
    "CounterfactualEngineError",
    "LoadRecordsError",
    "TrainingFrameError",
    "SimulationError",
]