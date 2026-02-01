"""
Correlation Engine
Discovers correlations between different health metrics.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path
import statistics
import uuid

from models.health_data import CorrelationInsight, MetricType


class CorrelationEngine:
    """Discovers and analyzes correlations between health metrics."""
    
    MIN_CORRELATION = 0.3
    
    CORRELATION_PAIRS = [
        ("sleep_duration", "energy_level", 0),
        ("sleep_quality", "stress_score", 0),
        ("steps", "sleep_quality", 0),
        ("stress_score", "resting_hr", 0),
        ("hrv", "energy_level", 0),
        ("sleep_duration", "steps", 1),
        ("sleep_duration", "energy_level", 1),
        ("sleep_quality", "stress_score", 1),
        ("stress_score", "sleep_quality", 1),
    ]
    
    def __init__(self, data_path: Optional[str] = None):
        self.data_path = data_path or self._get_default_data_path()
        self._correlations: List[CorrelationInsight] = []
        self._data_cache: Dict[str, Any] = {}
        self._load_data()
        self._calculate_correlations()
    
    def _get_default_data_path(self) -> str:
        current_dir = Path(__file__).parent.parent
        return str(current_dir / "data" / "synthetic_health_data.json")
    
    def _load_data(self) -> None:
        try:
            if os.path.exists(self.data_path):
                with open(self.data_path, 'r') as f:
                    self._data_cache = json.load(f)
        except Exception as e:
            print(f"Error loading data: {e}")
            self._data_cache = {"records": []}
    
    def _extract_metric_series(self, metric_name: str) -> List[Tuple[str, float]]:
        records = self._data_cache.get("records", [])
        series = []
        
        for record in records:
            date = record.get("date")
            value = None
            
            if metric_name == "sleep_duration":
                value = record.get("sleep", {}).get("duration_hours")
            elif metric_name == "sleep_quality":
                value = record.get("sleep", {}).get("quality_score")
            elif metric_name == "resting_hr":
                value = record.get("heart_rate", {}).get("resting")
            elif metric_name == "hrv":
                value = record.get("heart_rate", {}).get("hrv")
            elif metric_name == "steps":
                value = record.get("activity", {}).get("steps")
            elif metric_name == "stress_score":
                value = record.get("wellness", {}).get("stress_score")
            elif metric_name == "energy_level":
                value = record.get("wellness", {}).get("energy_level")
            
            if value is not None:
                series.append((date, value))
        
        return series
    
    def _calculate_pearson(self, x_values: List[float], y_values: List[float]) -> Tuple[float, float]:
        n = len(x_values)
        
        if n < 10:
            return 0.0, 0.0
        
        mean_x = statistics.mean(x_values)
        mean_y = statistics.mean(y_values)
        
        covariance = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_values, y_values)) / n
        
        std_x = statistics.stdev(x_values) if len(x_values) > 1 else 0
        std_y = statistics.stdev(y_values) if len(y_values) > 1 else 0
        
        if std_x == 0 or std_y == 0:
            return 0.0, 0.0
        
        correlation = covariance / (std_x * std_y)
        confidence = min(1.0, n / 60)
        
        return correlation, confidence
    
    def _calculate_correlations(self) -> None:
        self._correlations = []
        
        for metric_a, metric_b, offset in self.CORRELATION_PAIRS:
            series_a = self._extract_metric_series(metric_a)
            series_b = self._extract_metric_series(metric_b)
            
            if not series_a or not series_b:
                continue
            
            aligned_a, aligned_b = self._align_series(series_a, series_b, offset)
            
            if len(aligned_a) < 14:
                continue
            
            correlation, confidence = self._calculate_pearson(aligned_a, aligned_b)
            
            if abs(correlation) >= self.MIN_CORRELATION:
                insight = self._create_insight(metric_a, metric_b, correlation, confidence, len(aligned_a), offset)
                self._correlations.append(insight)
        
        self._correlations.sort(key=lambda x: abs(x.correlation_coefficient), reverse=True)
    
    def _align_series(self, series_a: List[Tuple[str, float]], series_b: List[Tuple[str, float]], offset: int) -> Tuple[List[float], List[float]]:
        dict_b = {date: value for date, value in series_b}
        
        aligned_a = []
        aligned_b = []
        
        for date_a, value_a in series_a:
            target_date = datetime.strptime(date_a, "%Y-%m-%d") + timedelta(days=offset)
            target_str = target_date.strftime("%Y-%m-%d")
            
            if target_str in dict_b:
                aligned_a.append(value_a)
                aligned_b.append(dict_b[target_str])
        
        return aligned_a, aligned_b
    
    def _create_insight(self, metric_a: str, metric_b: str, correlation: float, confidence: float, sample_size: int, offset: int) -> CorrelationInsight:
        display_names = {
            "sleep_duration": "sleep duration",
            "sleep_quality": "sleep quality",
            "resting_hr": "resting heart rate",
            "hrv": "HRV",
            "steps": "daily steps",
            "stress_score": "stress level",
            "energy_level": "energy level",
        }
        
        metric_types = {
            "sleep_duration": MetricType.SLEEP,
            "sleep_quality": MetricType.SLEEP,
            "resting_hr": MetricType.HEART_RATE,
            "hrv": MetricType.HEART_RATE,
            "steps": MetricType.STEPS,
            "stress_score": MetricType.STRESS,
            "energy_level": MetricType.ENERGY,
        }
        
        name_a = display_names.get(metric_a, metric_a)
        name_b = display_names.get(metric_b, metric_b)
        
        strength = "strong" if abs(correlation) >= 0.6 else "moderate"
        direction = "positive" if correlation > 0 else "negative"
        
        description = f"A {strength} {direction} correlation between {name_a} and {name_b}"
        if offset > 0:
            description += " (next-day effect)"
        
        if correlation > 0:
            if offset == 0:
                insight_text = f"When your {name_a} is higher, your {name_b} tends to be higher too."
            else:
                insight_text = f"Higher {name_a} today correlates with higher {name_b} tomorrow."
        else:
            if offset == 0:
                insight_text = f"When your {name_a} is higher, your {name_b} tends to be lower."
            else:
                insight_text = f"Higher {name_a} today correlates with lower {name_b} tomorrow."
        
        return CorrelationInsight(
            id=str(uuid.uuid4()),
            metric_a=metric_types.get(metric_a, MetricType.SLEEP),
            metric_b=metric_types.get(metric_b, MetricType.SLEEP),
            correlation_coefficient=round(correlation, 3),
            description=description,
            sample_size=sample_size,
            confidence=round(confidence, 2),
            insight_text=insight_text
        )
    
    def get_correlations(self, limit: int = 10) -> List[CorrelationInsight]:
        return self._correlations[:limit]
    
    def get_top_correlations(self, limit: int = 3) -> List[CorrelationInsight]:
        return self._correlations[:limit]
    
    def recalculate_correlations(self) -> None:
        self._load_data()
        self._calculate_correlations()