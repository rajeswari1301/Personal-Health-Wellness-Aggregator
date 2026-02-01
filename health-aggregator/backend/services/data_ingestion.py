"""
Data Ingestion Service
Handles loading, normalizing, and serving health data.
"""

import json
import os
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from pathlib import Path

from models.health_data import HealthMetrics, TrendSummary, MetricType


class DataIngestionService:
    """Service for ingesting and normalizing health data."""
    
    def __init__(self, data_path: Optional[str] = None):
        self.data_path = data_path or self._get_default_data_path()
        self._data_cache: Dict[str, Any] = {}
        self._load_data()
    
    def _get_default_data_path(self) -> str:
        current_dir = Path(__file__).parent.parent
        return str(current_dir / "data" / "synthetic_health_data.json")
    
    def _load_data(self) -> None:
        try:
            if os.path.exists(self.data_path):
                with open(self.data_path, 'r') as f:
                    self._data_cache = json.load(f)
            else:
                self._data_cache = {"records": []}
        except Exception as e:
            print(f"Error loading data: {e}")
            self._data_cache = {"records": []}
    
    def refresh_data(self) -> None:
        self._load_data()
    
    def get_latest_metrics(self) -> HealthMetrics:
        records = self._data_cache.get("records", [])
        
        if not records:
            return HealthMetrics(
                date=date.today(),
                sleep_hours=0, sleep_quality=0, resting_heart_rate=0,
                hrv=0, steps=0, active_minutes=0, calories_consumed=0,
                calories_burned=0, stress_level=0, energy_level=0
            )
        
        latest = records[-1]
        
        return HealthMetrics(
            date=datetime.strptime(latest["date"], "%Y-%m-%d").date(),
            sleep_hours=latest.get("sleep", {}).get("duration_hours", 0),
            sleep_quality=latest.get("sleep", {}).get("quality_score", 0),
            resting_heart_rate=latest.get("heart_rate", {}).get("resting", 0),
            hrv=latest.get("heart_rate", {}).get("hrv", 0),
            steps=latest.get("activity", {}).get("steps", 0),
            active_minutes=latest.get("activity", {}).get("active_minutes", 0),
            calories_consumed=latest.get("nutrition", {}).get("calories", 0),
            calories_burned=latest.get("activity", {}).get("calories_burned", 0),
            weight_kg=latest.get("weight", {}).get("weight_kg"),
            stress_level=latest.get("wellness", {}).get("stress_score", 50),
            energy_level=latest.get("wellness", {}).get("energy_level", 50)
        )
    
    def get_metrics_history(self, days: int = 30, metric_type: Optional[str] = None) -> List[Dict[str, Any]]:
        records = self._data_cache.get("records", [])
        
        if len(records) > days:
            records = records[-days:]
        
        if metric_type:
            return self._extract_metric_type(records, metric_type)
        
        return records
    
    def _extract_metric_type(self, records: List[Dict], metric_type: str) -> List[Dict[str, Any]]:
        result = []
        
        for record in records:
            extracted = {"date": record["date"]}
            
            if metric_type == "sleep":
                extracted.update(record.get("sleep", {}))
            elif metric_type == "heart_rate":
                extracted.update(record.get("heart_rate", {}))
            elif metric_type == "steps":
                extracted.update(record.get("activity", {}))
            elif metric_type == "nutrition":
                extracted.update(record.get("nutrition", {}))
            elif metric_type == "weight":
                extracted.update(record.get("weight", {}))
            elif metric_type == "stress":
                extracted.update(record.get("wellness", {}))
            
            result.append(extracted)
        
        return result
    
    def get_trend_summary(self) -> List[TrendSummary]:
        records = self._data_cache.get("records", [])
        
        if len(records) < 14:
            return []
        
        recent = records[-7:]
        previous = records[-14:-7]
        
        trends = []
        
        # Sleep trend
        recent_sleep = sum(r.get("sleep", {}).get("duration_hours", 0) for r in recent) / 7
        prev_sleep = sum(r.get("sleep", {}).get("duration_hours", 0) for r in previous) / 7
        if prev_sleep > 0:
            change = ((recent_sleep - prev_sleep) / prev_sleep) * 100
            trends.append(TrendSummary(
                metric_type=MetricType.SLEEP,
                direction="up" if change > 2 else "down" if change < -2 else "stable",
                change_percent=round(change, 1),
                period_days=7
            ))
        
        # Steps trend
        recent_steps = sum(r.get("activity", {}).get("steps", 0) for r in recent) / 7
        prev_steps = sum(r.get("activity", {}).get("steps", 0) for r in previous) / 7
        if prev_steps > 0:
            change = ((recent_steps - prev_steps) / prev_steps) * 100
            trends.append(TrendSummary(
                metric_type=MetricType.STEPS,
                direction="up" if change > 5 else "down" if change < -5 else "stable",
                change_percent=round(change, 1),
                period_days=7
            ))
        
        # Heart rate trend
        recent_hr = sum(r.get("heart_rate", {}).get("resting", 0) for r in recent) / 7
        prev_hr = sum(r.get("heart_rate", {}).get("resting", 0) for r in previous) / 7
        if prev_hr > 0:
            change = ((recent_hr - prev_hr) / prev_hr) * 100
            trends.append(TrendSummary(
                metric_type=MetricType.HEART_RATE,
                direction="up" if change > 3 else "down" if change < -3 else "stable",
                change_percent=round(change, 1),
                period_days=7
            ))
        
        return trends
    
    def get_records_for_analysis(self) -> List[Dict[str, Any]]:
        return self._data_cache.get("records", [])