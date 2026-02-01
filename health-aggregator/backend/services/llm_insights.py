"""
LLM Insight Generator
Generates AI-powered natural language insights from health data.
"""

from datetime import datetime
from typing import List, Optional
import uuid

from models.health_data import (
    AnomalyAlert, CorrelationInsight, TrendSummary,
    AIInsight, MetricType, SeverityLevel
)


class LLMInsightGenerator:
    """Generates AI-powered insights from health data."""
    
    def __init__(self):
        # OpenAI client would be initialized here if API key available
        self.client = None
    
    def generate_insights(
        self,
        anomalies: List[AnomalyAlert],
        correlations: List[CorrelationInsight],
        trends: List[TrendSummary]
    ) -> List[AIInsight]:
        """Generate comprehensive insights from health data."""
        insights = []
        
        if anomalies:
            insights.append(self._anomaly_insight(anomalies))
        
        if correlations:
            insights.append(self._correlation_insight(correlations))
        
        if trends:
            insights.append(self._trend_insight(trends))
        
        insights.append(self._recommendation(anomalies, correlations, trends))
        
        return [i for i in insights if i is not None]
    
    def _anomaly_insight(self, anomalies: List[AnomalyAlert]) -> AIInsight:
        critical = [a for a in anomalies if a.severity == SeverityLevel.CRITICAL]
        warnings = [a for a in anomalies if a.severity == SeverityLevel.WARNING]
        
        if critical:
            title = "⚠️ Critical Health Patterns Detected"
            content = f"Your health data shows {len(critical)} critical anomalies requiring attention. "
            content += f"Most significant: {critical[0].title}. {critical[0].description} "
            content += "Consider consulting a healthcare provider if patterns persist."
        elif warnings:
            title = "📊 Health Patterns Worth Monitoring"
            content = f"We detected {len(warnings)} metrics outside your normal range. "
            content += f"Notable: {warnings[0].title}. {warnings[0].description}"
        else:
            title = "📈 Minor Variations Noted"
            content = f"Small variations detected: {anomalies[0].title}. "
            content += "These are within expected fluctuations."
        
        return AIInsight(
            id=str(uuid.uuid4()),
            category="anomaly",
            title=title,
            content=content,
            confidence=0.85,
            related_metrics=list(set(a.metric_type for a in anomalies[:3])),
            generated_at=datetime.now()
        )
    
    def _correlation_insight(self, correlations: List[CorrelationInsight]) -> AIInsight:
        strongest = correlations[0]
        
        title = "🔗 Personal Pattern Discovered"
        content = f"Interesting pattern found: {strongest.insight_text} "
        content += f"This correlation ({abs(strongest.correlation_coefficient):.0%} strength) was observed over {strongest.sample_size} days. "
        
        if abs(strongest.correlation_coefficient) > 0.5:
            content += "This is a strong relationship worth paying attention to."
        else:
            content += "Understanding these patterns can help optimize your habits."
        
        return AIInsight(
            id=str(uuid.uuid4()),
            category="correlation",
            title=title,
            content=content,
            confidence=strongest.confidence,
            related_metrics=[strongest.metric_a, strongest.metric_b],
            generated_at=datetime.now()
        )
    
    def _trend_insight(self, trends: List[TrendSummary]) -> Optional[AIInsight]:
        if not trends:
            return None
        
        improving = [t for t in trends if 
            (t.direction == "up" and t.metric_type in [MetricType.SLEEP, MetricType.STEPS, MetricType.ENERGY]) or
            (t.direction == "down" and t.metric_type in [MetricType.STRESS, MetricType.HEART_RATE])]
        
        declining = [t for t in trends if
            (t.direction == "down" and t.metric_type in [MetricType.SLEEP, MetricType.STEPS, MetricType.ENERGY]) or
            (t.direction == "up" and t.metric_type in [MetricType.STRESS, MetricType.HEART_RATE])]
        
        if improving:
            title = "📈 Positive Trends This Week"
            content = f"Great progress! Your {improving[0].metric_type.value} improved by {abs(improving[0].change_percent):.1f}% this week. "
            if len(improving) > 1:
                content += f"Also seeing improvement in {improving[1].metric_type.value}. "
            content += "Keep it up!"
        elif declining:
            title = "📉 Areas to Focus On"
            content = f"Your {declining[0].metric_type.value} declined by {abs(declining[0].change_percent):.1f}% this week. "
            content += "Consider what factors might be affecting this."
        else:
            title = "➡️ Stable Health Metrics"
            content = "Your metrics have remained stable this week. Consistency is valuable!"
        
        return AIInsight(
            id=str(uuid.uuid4()),
            category="trend",
            title=title,
            content=content,
            confidence=0.8,
            related_metrics=[t.metric_type for t in trends[:2]],
            generated_at=datetime.now()
        )
    
    def _recommendation(
        self,
        anomalies: List[AnomalyAlert],
        correlations: List[CorrelationInsight],
        trends: List[TrendSummary]
    ) -> AIInsight:
        # Determine priority area
        critical = [a for a in anomalies if a.severity == SeverityLevel.CRITICAL] if anomalies else []
        
        if critical:
            focus = critical[0].metric_type.value
        elif anomalies:
            focus = anomalies[0].metric_type.value
        else:
            focus = "general"
        
        recommendations = {
            "sleep": "🌙 Prioritize sleep tonight. Try a 30-minute wind-down routine, limit screens, and keep your room cool.",
            "heart_rate": "❤️ Focus on cardiovascular health. Consider gentle exercise, stay hydrated, and practice relaxation.",
            "steps": "🚶 Boost your activity. Even a 10-minute walk helps. Schedule movement breaks throughout your day.",
            "stress": "🧘 Stress management is key. Try deep breathing, take breaks, and identify stress contributors.",
            "energy": "⚡ Focus on energy restoration. Check sleep quality, nutrition timing, and hydration.",
            "general": "✨ Your health looks good! Maintain current routines and consider adding one positive habit."
        }
        
        content = recommendations.get(focus, recommendations["general"])
        
        return AIInsight(
            id=str(uuid.uuid4()),
            category="recommendation",
            title="💡 Today's Recommendation",
            content=content,
            confidence=0.85,
            related_metrics=[],
            generated_at=datetime.now()
        )