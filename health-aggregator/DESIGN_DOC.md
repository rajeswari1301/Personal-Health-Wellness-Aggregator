# Personal Health & Wellness Aggregator  
## Design Documentation

**Case Study: Intelligent platform for unified wellness insights**

---

## 1. Problem Understanding & Solution Alignment

### Problem Statement (Case Study)

Health-conscious individuals are drowning in data from **disconnected sources**—wearables (sleep), nutrition apps, smart scales, blood pressure monitors. This **fragmentation** makes it hard to see the bigger picture and understand the **interplay** between diet, exercise, sleep, and well-being.

### How We Define the Problem

- **Fragmentation:** Multiple tools, no single source of truth.  
- **Lack of context:** Raw numbers without baselines or relationships.  
- **No “so what?”:** Few actionable, personalized insights.  
- **Uncertainty:** No sense of confidence or when models might be wrong.

### Solution Alignment

We built an **intelligent platform** that:

1. **Unifies** disparate health data streams (sleep, heart rate, activity, nutrition, wellness) into one normalized schema and ingestion path.  
2. **Correlates** across domains (e.g., sleep ↔ energy, steps ↔ sleep quality) so users see **relationships**, not just metrics.  
3. **Transforms** raw numbers into **actionable insights**: anomaly alerts, AI-generated summaries, recommendations, and a What-If simulator with explainability and uncertainty.  
4. **Targets** health-conscious users and people managing long-term wellness.

---

## 2. Design Outline

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (React + Vite)                          │
│  Dashboard · Metrics · Trends · Anomalies · Correlations · What-If      │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ REST (JSON)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Backend API (FastAPI)                               │
│  /api/dashboard/summary  /api/anomalies  /api/correlations  /api/ml/simulate │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ Data Ingestion   │    │ Anomaly Detection     │    │ Correlation Engine   │
│ (normalize,      │    │ (Z-score, baselines,  │    │ (Pearson, pairs,     │
│  latest, history)│    │  severity, timeline)  │    │  confidence)         │
└──────────────────┘    └──────────────────────┘    └──────────────────────┘
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      ▼
                          ┌──────────────────────┐
                          │ Unified health data   │
                          │ (sleep, HR, activity, │
                          │  nutrition, wellness) │
                          └──────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ LLM Insight      │    │ Counterfactual       │    │ Baselines /          │
│ Generator        │    │ Engine (ML)          │    │ Health Score         │
│ (AI summaries,   │    │ (linear models,      │    │ (normal ranges)      │
│  recommendations) │    │  SHAP-lite, drift)   │    │                      │
└──────────────────┘    └──────────────────────┘    └──────────────────────┘
```

**Example API surface:** `/api/dashboard/summary` · `/api/anomalies` + `/api/anomalies/timeline` · `/api/correlations` · `/api/ml/simulate` (what-if)

### 2.2 Data Model (Unified Schema)

A single **record** per day aggregates five logical domains (each can map to different sources in production):

| Domain      | Fields                                      | Example sources (future)     |
|------------|---------------------------------------------|------------------------------|
| **Sleep**  | duration_hours, quality_score               | Wearable, app                |
| **Heart rate** | resting, hrv                            | Wearable, BP monitor         |
| **Activity**  | steps, active_minutes, calories_burned  | Phone, wearable              |
| **Nutrition** | calories (in)                            | Logging app                  |
| **Wellness**  | stress_score, energy_level               | App, self-report             |

All services (ingestion, anomaly, correlation, ML) consume this **same** schema so one pipeline feeds the entire dashboard and ML layer.

### 2.3 Key Design Decisions

This architecture intentionally mirrors security analytics workflows (SIEM/SOC)—establishing baselines, detecting deviations, correlating signals, and generating analyst-friendly explanations—demonstrating transferable thinking for a NetSec team.

- **Single ingestion path:** One service loads and normalizes records; easy to extend to multiple APIs (Fitbit, Apple Health, etc.) that map into this schema.  
- **Security-style anomaly detection:** Z-score over **personal** baselines (not population), severity tiers (Info / Warning / Critical), and timeline view—analogous to SIEM-style alerts for health.  
- **Interpretable ML:** Linear models for What-If; contributions = coefficient × delta (SHAP-lite); confidence from residuals; drift detector when recent data differs from training.  
- **Why linear models:** Linear models were chosen intentionally for interpretability and stable counterfactual reasoning; more complex models can be explored in future work with SHAP/LIME.  
- **Responsible AI:** Uncertainty (±), explainability (breakdown by input), and drift warning so users know when to trust the model.

---

## 3. Tech Stack

| Layer        | Technology                          | Purpose |
|-------------|-------------------------------------|--------|
| **Frontend**| React 19, Vite 7                    | SPA, fast dev/build |
|             | Lucide React                        | Icons |
|             | Recharts                            | Trend and correlation charts |
| **Backend** | Python 3.x, FastAPI                 | REST API, async |
|             | Uvicorn                             | ASGI server |
| **Data / ML** | pandas, NumPy, scikit-learn      | Training frame, linear models |
| **Insights**| Custom LLM insight generator        | Narrative summaries, recommendations (template-based; pluggable to LLM API) |
| **Data**    | JSON (synthetic_health_data.json)    | Unified records; script to generate 90-day synthetic data. Prototype uses 90 days of synthetic daily records to demonstrate baselines, correlations, and counterfactuals end-to-end. |
| **Dev**     | Git                                 | Version control |
|             | ESLint                              | Frontend linting |

*Note: Docker configuration is prepared for containerized deployment (not fully implemented due to time constraint, but architecture supports it).*

### 3.1 Prototype Metrics

| Metric | Value |
|--------|-------|
| Days of synthetic data | 90 |
| Health metrics tracked | 10 (sleep, HR, HRV, steps, etc.) |
| Anomaly severity levels | 3 (Info, Warning, Critical) |
| Correlation pairs analyzed | 9 |
| ML model R² (energy) | ~0.56 |
| ML model R² (stress) | ~0.10 |
| API endpoints | 10 |
| React components | 12+ |

---

## 4. Case Study Alignment

- **Technical rigor:** baselines + anomaly detection + correlation + counterfactual ML  
- **Creativity:** SIEM-style health alerts + What-If simulator  
- **Responsible AI:** explainability + uncertainty + drift warnings

---

## 5. Key Differentiators

| Feature | Why It Matters |
|---------|----------------|
| **Security-style anomaly detection** | Z-score baselines + severity tiers mirror SOC/SIEM workflows—directly relevant to Palo Alto's domain |
| **What-If Simulator with ML** | Not just dashboards—actionable predictions with interpretability |
| **Personal baselines, not population** | Anomalies are relative to *your* history, not generic thresholds |
| **Correlation discovery** | Surfaces non-obvious relationships (HRV → Energy, Sleep → Steps) |
| **Responsible AI** | Confidence intervals, drift detection, explainable coefficients |

---

## 6. Demo Walkthrough (5–7 min video)

1. **Overview** (30s): Problem statement, solution approach  
2. **Dashboard Tour** (1.5 min): Metrics cards, health score, trends chart  
3. **Anomaly Detection** (1.5 min): SIEM-style timeline, severity levels, filtering  
4. **Correlations & AI Insights** (1 min): Discovered patterns, recommendations  
5. **What-If Simulator** (1.5 min): Adjust sliders, show predictions, explain ML interpretability  
6. **Architecture & Code** (30s): Quick look at clean code structure  
7. **Wrap-up** (30s): Key differentiators, future vision  

---

## 7. Future Enhancements

- **Real data integrations:** Fitbit, Apple Health, or similar APIs mapped into the unified schema.  
- **LLM insights upgrade:** Replace or augment template-based insights with an LLM API for richer, personalized narratives.  
- **Production deployment:** Docker + cloud (e.g., complete Dockerfile/docker-compose; run on GCP, AWS, or Azure).

---

## 8. Limitations & Honest Assessment

| Limitation | Mitigation / Future Work |
|------------|--------------------------|
| Synthetic data only | Architecture supports real API integration (Fitbit, Apple Health) |
| Linear models (low R² for stress) | Chosen for interpretability; future: ensemble models with SHAP |
| No user authentication | Out of scope for prototype; would add OAuth in production |
| Single-user design | Multi-tenancy would require database + user isolation |

---

## 9. Alignment with Role (R&D / AI-Assisted Development)

This project demonstrates competencies from the job description:

| JD focus | How this project shows it |
|----------|---------------------------|
| **Collaborate and deploy with agility** | Single repo (frontend + backend), clear API contract, modular services (ingestion, anomaly, correlation, ML) that can be evolved independently. |
| **AI-assisted development** | Built with AI-assisted tools for structure, tests, and docs; code is organized for readability and maintainability. |
| **Clean, maintainable code** | Typed models (Pydantic-style), named constants, error handling, and docstrings; frontend uses reusable components and theme variables. |
| **AI for code and product** | ML for prediction and explainability (SHAP-lite, confidence, drift); AI-powered insights layer (template-based, ready for LLM). |
| **DevOps / automation** | Scripts for synthetic data; design supports containers and CI/CD; future enhancements call out pipelines and observability. |
| **Modern languages & tools** | Python (FastAPI), JavaScript (React), Git; optional Docker/K8s and cloud in future roadmap. |
| **Problem-solving & learning** | End-to-end solution from problem definition to prototype; applied stats (Z-score, Pearson), ML (linear models), and responsible AI (uncertainty, explainability, drift). |

---

## 10. Summary

Architecturally, this mirrors security analytics platforms: establish baselines, detect deviations, correlate weak signals, and translate them into actionable insights.

| Section              | Contents |
|----------------------|----------|
| **Problem & solution** | Fragmentation → unified schema; no context → correlations and baselines; no "so what?" → AI insights, What-If, recommendations. |
| **Design**           | Single ingestion, unified schema, security-style anomalies, interpretable ML (SHAP-lite, confidence, drift). |
| **Tech stack**       | React + Vite, FastAPI, pandas/NumPy/sklearn, JSON; Git, ESLint. |
| **Case study**       | Technical rigor, creativity (security-style health), responsible AI (uncertainty, explainability, drift). |
| **Future**           | Real data integrations, LLM insights upgrade, production deployment (Docker + cloud). |

This document serves as the **design outline**, **tech stack**, and **future enhancements** for the Personal Health & Wellness Aggregator and its alignment with the hackathon case study and role expectations.
