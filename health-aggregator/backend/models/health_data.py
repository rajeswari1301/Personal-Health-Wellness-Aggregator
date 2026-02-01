"""
Health Data Models
Pydantic models for type safety and API documentation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class SeverityLevel(str, Enum):
    """Anomaly severity levels - mirrors security alert patterns"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class MetricType(str, Enum):
    """Types of health metrics tracked"""
    SLEEP = "sleep"
    HEART_RATE = "heart_rate"
    STEPS = "steps"
    NUTRITION = "nutrition"
    WEIGHT = "weight"
    STRESS = "stress"
    ENERGY = "energy"


class HealthMetrics(BaseModel):
    """Current/latest health metrics snapshot"""
    date: date
    sleep_hours: float
    sleep_quality: int
    resting_heart_rate: int
    hrv: float
    steps: int
    active_minutes: int
    calories_consumed: int
    calories_burned: int
    weight_kg: Optional[float] = None
    stress_level: int
    energy_level: int


class AnomalyAlert(BaseModel):
    """Anomaly alert - designed to mirror security SOC alerts."""
    id: str
    timestamp: datetime
    severity: SeverityLevel
    metric_type: MetricType
    title: str
    description: str
    current_value: float
    baseline_value: float
    deviation_percent: float
    consecutive_days: int = Field(default=1)
    recommended_action: Optional[str] = None


class CorrelationInsight(BaseModel):
    """Discovered correlation between two health metrics."""
    id: str
    metric_a: MetricType
    metric_b: MetricType
    correlation_coefficient: float = Field(..., ge=-1, le=1)
    description: str
    sample_size: int
    confidence: float = Field(..., ge=0, le=1)
    insight_text: str


class Baseline(BaseModel):
    """Personal baseline for a metric"""
    metric_type: MetricType
    mean: float
    std_dev: float
    min_normal: float
    max_normal: float
    sample_days: int
    last_updated: datetime


class HealthScoreComponent(BaseModel):
    """Individual component of overall health score"""
    category: str
    score: int = Field(..., ge=0, le=100)
    weight: float
    contributing_factors: List[str]


class HealthScoreResponse(BaseModel):
    """Detailed health score breakdown"""
    overall_score: int = Field(..., ge=0, le=100)
    components: List[HealthScoreComponent]
    trend: str
    trend_percentage: float
    calculated_at: datetime


class TrendSummary(BaseModel):
    """Summary of metric trends"""
    metric_type: MetricType
    direction: str
    change_percent: float
    period_days: int


class DashboardSummary(BaseModel):
    """Complete dashboard summary response"""
    current_metrics: HealthMetrics
    recent_anomalies: List[AnomalyAlert]
    key_correlations: List[CorrelationInsight]
    health_score: int
    last_updated: datetime


class AIInsight(BaseModel):
    """AI-generated insight"""
    id: str
    category: str
    title: str
    content: str
    confidence: float
    related_metrics: List[MetricType]
    generated_at: datetime