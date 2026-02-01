#!/usr/bin/env python3
"""
Synthetic Health Data Generator
Generates realistic health data with intentional patterns and anomalies.
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
import math


def generate_synthetic_data(days: int = 90, output_path: str = None) -> dict:
    """Generate synthetic health data with realistic patterns."""
    
    profile = {
        "avg_sleep": 7.2,
        "avg_resting_hr": 62,
        "avg_hrv": 45,
        "avg_steps": 8500,
        "avg_weight": 70.5,
        "base_stress": 35,
        "base_energy": 65
    }
    
    records = []
    start_date = datetime.now() - timedelta(days=days)
    prev_day = None
    
    # Anomaly periods for demonstration
    anomaly_periods = [
        (65, 68, "illness"),
        (75, 78, "high_stress"),
        (82, 85, "low_activity"),
    ]
    
    for day_num in range(days):
        current_date = start_date + timedelta(days=day_num)
        day_of_week = current_date.weekday()
        
        anomaly_type = None
        for start, end, atype in anomaly_periods:
            if start <= day_num <= end:
                anomaly_type = atype
                break
        
        record = generate_daily_record(
            date=current_date,
            profile=profile,
            day_of_week=day_of_week,
            day_num=day_num,
            prev_day=prev_day,
            anomaly_type=anomaly_type
        )
        
        records.append(record)
        prev_day = record
    
    data = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "days": days,
            "profile": profile
        },
        "records": records
    }
    
    if output_path:
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Generated {days} days of data → {output_path}")
    
    return data


def generate_daily_record(date, profile, day_of_week, day_num, prev_day, anomaly_type=None):
    """Generate a single day's health record."""
    
    is_weekend = day_of_week in [5, 6]
    weekend_factor = 1.1 if is_weekend else 1.0
    
    prev_sleep = prev_day.get("sleep", {}).get("duration_hours", profile["avg_sleep"]) if prev_day else profile["avg_sleep"]
    prev_stress = prev_day.get("wellness", {}).get("stress_score", profile["base_stress"]) if prev_day else profile["base_stress"]
    
    sleep_effect = (prev_sleep - profile["avg_sleep"]) / profile["avg_sleep"]
    
    sleep = generate_sleep(profile, weekend_factor, anomaly_type, prev_stress)
    heart_rate = generate_heart_rate(profile, sleep, anomaly_type)
    activity = generate_activity(profile, sleep_effect, is_weekend, anomaly_type)
    nutrition = generate_nutrition(is_weekend, activity["steps"])
    weight = generate_weight(profile, day_num)
    wellness = generate_wellness(profile, sleep, activity, anomaly_type, is_weekend)
    
    return {
        "date": date.strftime("%Y-%m-%d"),
        "sleep": sleep,
        "heart_rate": heart_rate,
        "activity": activity,
        "nutrition": nutrition,
        "weight": weight,
        "wellness": wellness
    }


def generate_sleep(profile, weekend_factor, anomaly_type, prev_stress):
    """Generate sleep metrics."""
    base_sleep = profile["avg_sleep"] * weekend_factor
    stress_effect = -0.3 if prev_stress > 60 else 0
    
    if anomaly_type == "illness":
        base_sleep -= 1.5
        quality_modifier = -20
    elif anomaly_type == "high_stress":
        base_sleep -= 0.8
        quality_modifier = -15
    else:
        quality_modifier = 0
    
    duration = max(4, min(10, base_sleep + random.gauss(0, 0.7) + stress_effect))
    base_quality = 70 + (duration - 6) * 5
    quality = int(max(30, min(100, base_quality + random.gauss(0, 8) + quality_modifier)))
    
    deep_sleep = duration * (0.15 + random.gauss(0, 0.03))
    rem_sleep = duration * (0.22 + random.gauss(0, 0.04))
    
    return {
        "duration_hours": round(duration, 1),
        "quality_score": quality,
        "deep_sleep_hours": round(max(0.5, deep_sleep), 1),
        "rem_sleep_hours": round(max(0.5, rem_sleep), 1),
        "time_to_sleep_minutes": int(max(5, 15 + random.gauss(0, 10))),
        "wake_ups": int(max(0, random.gauss(1.5, 1)))
    }


def generate_heart_rate(profile, sleep, anomaly_type):
    """Generate heart rate metrics."""
    sleep_quality = sleep["quality_score"]
    sleep_effect = max(-5, min(5, (70 - sleep_quality) * 0.1))
    
    if anomaly_type == "illness":
        hr_modifier = 12
        hrv_modifier = -15
    elif anomaly_type == "high_stress":
        hr_modifier = 6
        hrv_modifier = -10
    else:
        hr_modifier = 0
        hrv_modifier = 0
    
    resting = int(profile["avg_resting_hr"] + random.gauss(0, 3) + sleep_effect + hr_modifier)
    resting = max(45, min(100, resting))
    
    hrv = profile["avg_hrv"] - (resting - profile["avg_resting_hr"]) * 0.5
    hrv = max(15, min(80, hrv + random.gauss(0, 5) + hrv_modifier))
    
    avg_hr = int(resting + 15 + random.gauss(0, 5))
    max_hr = int(avg_hr + 40 + random.gauss(0, 15))
    
    return {
        "resting": resting,
        "average": avg_hr,
        "max": min(200, max_hr),
        "hrv": round(hrv, 1)
    }


def generate_activity(profile, sleep_effect, is_weekend, anomaly_type):
    """Generate activity metrics."""
    weekend_mod = random.choice([-1500, 500, 2000]) if is_weekend else 0
    sleep_mod = sleep_effect * 1500
    
    if anomaly_type == "illness":
        steps_modifier = -5000
    elif anomaly_type == "low_activity":
        steps_modifier = -4000
    elif anomaly_type == "high_stress":
        steps_modifier = -1500
    else:
        steps_modifier = 0
    
    steps = int(profile["avg_steps"] + random.gauss(0, 1500) + weekend_mod + sleep_mod + steps_modifier)
    steps = max(1000, min(25000, steps))
    
    active_minutes = int((steps / 100) + random.gauss(0, 10))
    active_minutes = max(10, min(180, active_minutes))
    
    calories = int(1800 + steps * 0.04 + active_minutes * 3 + random.gauss(0, 100))
    distance_km = round(steps * 0.0008, 1)
    
    return {
        "steps": steps,
        "active_minutes": active_minutes,
        "calories_burned": calories,
        "distance_km": distance_km,
        "floors_climbed": int(max(0, random.gauss(8, 4)))
    }


def generate_nutrition(is_weekend, steps):
    """Generate nutrition metrics."""
    base_calories = 2000 + (steps / 50)
    weekend_mod = 200 if is_weekend else 0
    calories = int(base_calories + random.gauss(0, 200) + weekend_mod)
    
    protein = round(max(40, calories * 0.15 / 4 + random.gauss(0, 15)), 1)
    carbs = round(max(100, calories * 0.50 / 4 + random.gauss(0, 30)), 1)
    fat = round(max(30, calories * 0.35 / 9 + random.gauss(0, 15)), 1)
    water = int(max(1000, 2500 + random.gauss(0, 500)))
    
    return {
        "calories": calories,
        "protein_g": protein,
        "carbs_g": carbs,
        "fat_g": fat,
        "water_ml": water,
        "sugar_g": round(max(10, 40 + random.gauss(0, 15)), 1),
        "fiber_g": round(max(10, 25 + random.gauss(0, 8)), 1)
    }


def generate_weight(profile, day_num):
    """Generate weight metrics."""
    trend = math.sin(day_num / 30) * 0.5
    daily_variation = random.gauss(0, 0.3)
    weight = profile["avg_weight"] + trend + daily_variation
    body_fat = 18.5 + random.gauss(0, 0.5) if day_num % 3 == 0 else None
    
    return {
        "weight_kg": round(weight, 1),
        "body_fat_percent": round(body_fat, 1) if body_fat else None
    }


def generate_wellness(profile, sleep, activity, anomaly_type, is_weekend):
    """Generate wellness/stress metrics."""
    sleep_quality = sleep["quality_score"]
    energy_from_sleep = (sleep_quality - 70) * 0.4
    
    steps = activity["steps"]
    activity_energy = min(10, (steps - 5000) / 1000)
    weekend_stress = -10 if is_weekend else 0
    
    if anomaly_type == "illness":
        stress_modifier = 15
        energy_modifier = -25
    elif anomaly_type == "high_stress":
        stress_modifier = 30
        energy_modifier = -15
    elif anomaly_type == "low_activity":
        stress_modifier = 5
        energy_modifier = -10
    else:
        stress_modifier = 0
        energy_modifier = 0
    
    stress = profile["base_stress"] + random.gauss(0, 10) + weekend_stress + stress_modifier
    stress = int(max(5, min(95, stress)))
    
    energy = profile["base_energy"] + energy_from_sleep + activity_energy + random.gauss(0, 8) + energy_modifier
    energy = int(max(10, min(100, energy)))
    
    mood = int((energy * 0.6) + ((100 - stress) * 0.4) + random.gauss(0, 5))
    mood = max(20, min(100, mood))
    
    return {
        "stress_score": stress,
        "energy_level": energy,
        "mood_score": mood
    }


if __name__ == "__main__":
    import sys
    output_path = sys.argv[1] if len(sys.argv) > 1 else "../backend/data/synthetic_health_data.json"
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 90
    generate_synthetic_data(days=days, output_path=output_path)