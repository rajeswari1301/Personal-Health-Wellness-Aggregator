"""
Anomaly Detection Service
Security-style anomaly detection for health metrics using Z-score analysis.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pathlib import Path
import statistics
from collections import defaultdict
import uuid

from models.health_data import (
    AnomalyAlert, SeverityLevel, MetricType,
    Baseline, HealthScoreComponent, HealthScoreResponse
)


class AnomalyDetectionService:
    """Anomaly detection using statistical baselines and Z-score analysis."""
    
    THRESHOLDS = {
        SeverityLevel.INFO: 1.5,
        SeverityLevel.WARNING: 2.0,
        SeverityLevel.CRITICAL: 2.5
    }
    
    METRIC_DIRECTIONS = {
        "sleep_duration": "higher_better",
        "sleep_quality": "higher_better",
        "resting_hr": "lower_better",
        "hrv": "higher_better",
        "steps": "higher_better",
        "stress_score": "lower_better",
        "energy_level": "higher_better",
    }
    
    def __init__(self, data_path: Optional[str] = None):
        self.data_path = data_path or self._get_default_data_path()
        self._baselines: Dict[str, Baseline] = {}
        self._anomalies: List[AnomalyAlert] = []
        self._data_cache: Dict[str, Any] = {}
        self._load_data()
        self._calculate_baselines()
        self._detect_anomalies()
    
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
    
    def _calculate_baselines(self) -> None:
        records = self._data_cache.get("records", [])
        
        if len(records) < 14:
            return
        
        baseline_period = min(60, int(len(records) * 0.66))
        baseline_records = records[:baseline_period]
        
        metrics_data = defaultdict(list)
        
        for record in baseline_records:
            sleep = record.get("sleep", {})
            if sleep.get("duration_hours"):
                metrics_data["sleep_duration"].append(sleep["duration_hours"])
            if sleep.get("quality_score"):
                metrics_data["sleep_quality"].append(sleep["quality_score"])
            
            hr = record.get("heart_rate", {})
            if hr.get("resting"):
                metrics_data["resting_hr"].append(hr["resting"])
            if hr.get("hrv"):
                metrics_data["hrv"].append(hr["hrv"])
            
            activity = record.get("activity", {})
            if activity.get("steps"):
                metrics_data["steps"].append(activity["steps"])
            
            wellness = record.get("wellness", {})
            if wellness.get("stress_score"):
                metrics_data["stress_score"].append(wellness["stress_score"])
            if wellness.get("energy_level"):
                metrics_data["energy_level"].append(wellness["energy_level"])
        
        metric_type_mapping = {
            "sleep_duration": MetricType.SLEEP,
            "sleep_quality": MetricType.SLEEP,
            "resting_hr": MetricType.HEART_RATE,
            "hrv": MetricType.HEART_RATE,
            "steps": MetricType.STEPS,
            "stress_score": MetricType.STRESS,
            "energy_level": MetricType.ENERGY,
        }
        
        for metric_name, values in metrics_data.items():
            if len(values) >= 7:
                mean = statistics.mean(values)
                std_dev = statistics.stdev(values) if len(values) > 1 else 0
                
                self._baselines[metric_name] = Baseline(
                    metric_type=metric_type_mapping.get(metric_name, MetricType.SLEEP),
                    mean=round(mean, 2),
                    std_dev=round(std_dev, 2),
                    min_normal=round(mean - 2 * std_dev, 2),
                    max_normal=round(mean + 2 * std_dev, 2),
                    sample_days=len(values),
                    last_updated=datetime.now()
                )
    
    def _detect_anomalies(self) -> None:
        records = self._data_cache.get("records", [])
        self._anomalies = []
        
        if len(records) < 14:
            return
        
        recent_records = records[-30:]
        consecutive_anomalies = defaultdict(int)
        
        for record in recent_records:
            record_date = datetime.strptime(record["date"], "%Y-%m-%d")
            anomalies_today = self._check_record_for_anomalies(record, record_date, consecutive_anomalies)
            self._anomalies.extend(anomalies_today)
        
        self._anomalies.sort(key=lambda x: x.timestamp, reverse=True)
    
    def _check_record_for_anomalies(self, record: Dict, record_date: datetime, consecutive_tracker: Dict[str, int]) -> List[AnomalyAlert]:
        anomalies = []
        
        sleep = record.get("sleep", {})
        if sleep.get("duration_hours") and "sleep_duration" in self._baselines:
            anomaly = self._check_metric("sleep_duration", sleep["duration_hours"], record_date, consecutive_tracker, "Sleep Duration", "hours")
            if anomaly:
                anomalies.append(anomaly)
        
        hr = record.get("heart_rate", {})
        if hr.get("resting") and "resting_hr" in self._baselines:
            anomaly = self._check_metric("resting_hr", hr["resting"], record_date, consecutive_tracker, "Resting Heart Rate", "bpm")
            if anomaly:
                anomalies.append(anomaly)
        
        if hr.get("hrv") and "hrv" in self._baselines:
            anomaly = self._check_metric("hrv", hr["hrv"], record_date, consecutive_tracker, "Heart Rate Variability", "ms")
            if anomaly:
                anomalies.append(anomaly)
        
        activity = record.get("activity", {})
        if activity.get("steps") and "steps" in self._baselines:
            anomaly = self._check_metric("steps", activity["steps"], record_date, consecutive_tracker, "Daily Steps", "steps")
            if anomaly:
                anomalies.append(anomaly)
        
        wellness = record.get("wellness", {})
        if wellness.get("stress_score") and "stress_score" in self._baselines:
            anomaly = self._check_metric("stress_score", wellness["stress_score"], record_date, consecutive_tracker, "Stress Level", "score")
            if anomaly:
                anomalies.append(anomaly)
        
        return anomalies
    
    def _check_metric(self, metric_name: str, value: float, record_date: datetime, consecutive_tracker: Dict[str, int], display_name: str, unit: str) -> Optional[AnomalyAlert]:
        baseline = self._baselines[metric_name]
        
        if baseline.std_dev == 0:
            return None
        
        z_score = abs(value - baseline.mean) / baseline.std_dev
        
        if z_score < self.THRESHOLDS[SeverityLevel.INFO]:
            consecutive_tracker[metric_name] = 0
            return None
        
        if z_score >= self.THRESHOLDS[SeverityLevel.CRITICAL]:
            severity = SeverityLevel.CRITICAL
        elif z_score >= self.THRESHOLDS[SeverityLevel.WARNING]:
            severity = SeverityLevel.WARNING
        else:
            severity = SeverityLevel.INFO
        
        consecutive_tracker[metric_name] += 1
        consecutive_days = consecutive_tracker[metric_name]
        
        if consecutive_days >= 3 and severity == SeverityLevel.INFO:
            severity = SeverityLevel.WARNING
        elif consecutive_days >= 5 and severity == SeverityLevel.WARNING:
            severity = SeverityLevel.CRITICAL
        
        deviation_percent = ((value - baseline.mean) / baseline.mean) * 100
        direction_word = "below" if value < baseline.mean else "above"
        
        description = f"{display_name} is {abs(deviation_percent):.1f}% {direction_word} your baseline of {baseline.mean:.1f} {unit}. Current: {value:.1f} {unit}."
        
        if consecutive_days > 1:
            description += f" Persisted for {consecutive_days} days."
        
        metric_type_mapping = {
            "sleep_duration": MetricType.SLEEP,
            "resting_hr": MetricType.HEART_RATE,
            "hrv": MetricType.HEART_RATE,
            "steps": MetricType.STEPS,
            "stress_score": MetricType.STRESS,
            "energy_level": MetricType.ENERGY,
        }
        
        return AnomalyAlert(
            id=str(uuid.uuid4()),
            timestamp=record_date,
            severity=severity,
            metric_type=metric_type_mapping.get(metric_name, MetricType.SLEEP),
            title=f"{display_name} Anomaly Detected",
            description=description,
            current_value=value,
            baseline_value=baseline.mean,
            deviation_percent=round(deviation_percent, 1),
            consecutive_days=consecutive_days,
            recommended_action=self._get_recommendation(metric_name, value < baseline.mean)
        )
    
    def _get_recommendation(self, metric_name: str, is_low: bool) -> str:
        recommendations = {
            "sleep_duration": ("Consider a consistent bedtime routine.", "Extended sleep may indicate fatigue."),
            "resting_hr": ("Monitor for other symptoms.", "Elevated HR may indicate stress or illness."),
            "hrv": ("Prioritize rest and stress management.", "Great recovery indicator!"),
            "steps": ("Try adding short walks.", "Great activity! Ensure recovery."),
            "stress_score": ("Maintain current practices.", "Consider relaxation techniques."),
        }
        rec = recommendations.get(metric_name, ("Monitor this metric.", "Monitor this metric."))
        return rec[0] if is_low else rec[1]
    
    def get_anomalies(self, severity: Optional[str] = None, limit: int = 20) -> List[AnomalyAlert]:
        anomalies = self._anomalies
        if severity:
            anomalies = [a for a in anomalies if a.severity.value == severity]
        return anomalies[:limit]
    
    def get_recent_anomalies(self, limit: int = 5) -> List[AnomalyAlert]:
        return self._anomalies[:limit]
    
    def get_anomaly_timeline(self, days: int = 14) -> List[Dict[str, Any]]:
        cutoff = datetime.now() - timedelta(days=days)
        timeline = defaultdict(lambda: {"info": 0, "warning": 0, "critical": 0})
        
        for anomaly in self._anomalies:
            if anomaly.timestamp >= cutoff:
                date_str = anomaly.timestamp.strftime("%Y-%m-%d")
                timeline[date_str][anomaly.severity.value] += 1
        
        result = []
        for i in range(days):
            check_date = (datetime.now() - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
            counts = timeline.get(check_date, {"info": 0, "warning": 0, "critical": 0})
            result.append({"date": check_date, **counts, "total": sum(counts.values())})
        
        return result
    
    def get_baselines(self) -> Dict[str, Dict[str, Any]]:
        return {
            name: {
                "metric_type": b.metric_type.value,
                "mean": b.mean,
                "std_dev": b.std_dev,
                "min_normal": b.min_normal,
                "max_normal": b.max_normal,
            }
            for name, b in self._baselines.items()
        }
    
    def calculate_health_score(self) -> int:
        return self.calculate_health_score_detailed().overall_score
    
    def calculate_health_score_detailed(self) -> HealthScoreResponse:
        cutoff = datetime.now() - timedelta(days=7)
        recent = [a for a in self._anomalies if a.timestamp >= cutoff]
        
        critical = sum(1 for a in recent if a.severity == SeverityLevel.CRITICAL)
        warning = sum(1 for a in recent if a.severity == SeverityLevel.WARNING)
        info = sum(1 for a in recent if a.severity == SeverityLevel.INFO)
        
        deduction = (critical * 15) + (warning * 8) + (info * 3)
        
        components = [
            HealthScoreComponent(category="Sleep", score=max(0, 100 - len([a for a in recent if a.metric_type == MetricType.SLEEP]) * 10), weight=0.25, contributing_factors=["Duration", "Quality"]),
            HealthScoreComponent(category="Cardiovascular", score=max(0, 100 - len([a for a in recent if a.metric_type == MetricType.HEART_RATE]) * 10), weight=0.25, contributing_factors=["Resting HR", "HRV"]),
            HealthScoreComponent(category="Activity", score=max(0, 100 - len([a for a in recent if a.metric_type == MetricType.STEPS]) * 10), weight=0.25, contributing_factors=["Steps", "Active minutes"]),
            HealthScoreComponent(category="Wellness", score=max(0, 100 - len([a for a in recent if a.metric_type in [MetricType.STRESS, MetricType.ENERGY]]) * 10), weight=0.25, contributing_factors=["Stress", "Energy"]),
        ]
        
        weighted = sum(c.score * c.weight for c in components)
        final = max(0, min(100, int(weighted - deduction * 0.3)))
        
        return HealthScoreResponse(
            overall_score=final,
            components=components,
            trend="stable",
            trend_percentage=0.0,
            calculated_at=datetime.now()
        )
    
    def recalculate_anomalies(self) -> None:
        self._load_data()
        self._calculate_baselines()
        self._detect_anomalies()