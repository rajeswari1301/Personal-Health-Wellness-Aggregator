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
4. **Targets** the case study audiences: fitness enthusiasts (recovery vs. training), health-conscious users (informed choices), and people managing chronic conditions (multi-metric tracking and correlations).

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
│  /api/dashboard/summary  /api/anomalies  /api/correlations  /api/ml/...  │
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
| **Data**    | JSON (synthetic_health_data.json)    | Unified records; script to generate 90-day synthetic data |
| **Dev**     | Git                                 | Version control |
|             | ESLint                              | Frontend linting |

*Note: Dockerfile and docker-compose are stubbed for future containerized deployment.*

---

## 4. Case Study: How You'll Be Scored

### Problem Understanding  
**How clearly you define the problem and align your solution to it.**

- Problem is explicitly framed as **fragmentation**, **lack of context**, and **missing actionable insights**.  
- Solution is aligned to **unification**, **correlation**, and **transformation** of raw data into decisions.  
- Target audiences (fitness enthusiasts, health-conscious individuals, chronic-condition management) are called out in design and features (trends, correlations, multi-metric baselines, What-If).

### Technical Rigor  
**Quality and soundness of technical approach, including how you apply AI.**

- **Anomaly detection:** Z-score over personal baselines; configurable thresholds; timeline and severity.  
- **Correlation:** Pearson over time series; confidence and sample size; multiple pairs across domains.  
- **Predictive ML:** Linear models for energy/stress; SHAP-lite contributions; confidence intervals; drift detection.  
- **API:** FastAPI with clear endpoints; validation and error handling; optional ML with graceful fallback if dependencies missing.

### Creativity  
**Originality, practicality, and forward-thinking.**

- **Security-style health:** Anomaly detection and timeline inspired by SIEM/alerting.  
- **What-If + explainability:** “Why did energy change?” via feature contributions; “How uncertain?” via ±; “Can I trust this?” via drift.  
- **Single dashboard story:** Health score, metrics, trends, anomalies, correlations, AI insights, What-If, and normal ranges in one cohesive view.

### Prototype Quality  
**How well the demo works and communicates the core concept.**

- **Working demo:** Metrics, trend chart, anomaly timeline, alerts, correlations, AI insights, What-If simulator, baselines.  
- **Clear UX:** Sections labeled; confidence and drift visible; breakdown by sleep/steps/calories.  
- **Data story:** Synthetic data with intentional patterns and anomalies so the demo illustrates cause-effect and alerts.

### Responsible AI  
**Ethical considerations, security, and limitations.**

- **Uncertainty:** Confidence intervals (e.g., 70.8 ± 3.1) so users see prediction spread.  
- **Explainability:** Feature contributions (“+4.2 from sleep”) so the model is interpretable.  
- **Drift:** “Model operating outside training distribution” when recent data diverges from training.  
- **Model validity:** Energy model shows moderate predictive power (R² ≈ 0.56), while stress model has weaker signal (R² ≈ 0.10) and should be interpreted cautiously.  
- **Limitations:** Linear models; template-based insights (no live LLM required); synthetic data for prototype—all documented and easy to extend.

---

## 5. Future Enhancements

Aligned with **scalability**, **Palo Alto Networks** mission (security, automation, AI), and the **job description** (cloud, DevOps, AI-assisted development):

### 5.1 Data & Integrations

- **Multiple real sources:** Plug in Fitbit, Apple Health, Google Fit, or other APIs; map each to the unified schema.  
- **Sync and scheduling:** Periodic ingestion, idempotent updates, and conflict handling.  
- **Historical backfill:** Support for bulk import from exports (CSV/JSON).

### 5.2 AI / ML

- **LLM-backed insights:** Replace or augment template-based insights with an LLM API (e.g., OpenAI, internal model) for richer, personalized narratives.  
- **Model upgrades:** Optional non-linear models (e.g., tree-based) with SHAP or LIME for explainability.  
- **Alerting rules:** User-configurable thresholds and notification channels (email, push).

### 5.3 Platform & DevOps

- **Containers:** Complete Dockerfile and docker-compose for backend + frontend; one-command run for local and demo.  
- **Cloud deployment:** Run backend and frontend on GCP, AWS, or Azure (e.g., Cloud Run + static hosting, or ECS/EKS).  
- **CI/CD:** Pipelines for test, lint, build, and deploy; branch-based previews.  
- **Observability:** Logging, metrics, and tracing (e.g., OpenTelemetry) for API and ML paths.

### 5.4 Security & Compliance

- **Auth:** User login (OAuth2/OpenID) and scoped access to “my data only.”  
- **Data in transit/rest:** HTTPS only; encrypt sensitive fields at rest.  
- **Audit:** Log access to health data and model usage for compliance and debugging.

### 5.5 Product

- **Goals and tracking:** User-set targets (e.g., sleep ≥ 7 hrs, steps ≥ 10k) with progress and nudges.  
- **Export/report:** PDF or CSV export of dashboard or date range for sharing with providers.  
- **Mobile:** Responsive layout or native app for on-the-go viewing.

---

## 6. Summary

Architecturally, this mirrors security analytics platforms: establish baselines, detect deviations, correlate weak signals, and translate them into actionable insights.

| Section              | Contents |
|----------------------|----------|
| **Problem & solution** | Fragmentation → unified schema; no context → correlations and baselines; no “so what?” → AI insights, What-If, recommendations. |
| **Design**           | Single ingestion, unified schema, security-style anomalies, interpretable ML (SHAP-lite, confidence, drift). |
| **Tech stack**       | React + Vite, FastAPI, pandas/NumPy/sklearn, JSON; Git, ESLint. |
| **Case study scoring** | Clear problem definition, rigorous use of stats/ML, creative SIEM-style + What-If, working prototype, responsible AI (uncertainty, explainability, drift). |
| **Future**           | Real data sources, LLM insights, containers, cloud, CI/CD, auth, compliance, goals, export, mobile. |

---

## 7. Alignment with Role (R&D / AI-Assisted Development)

This project demonstrates competencies from the job description:

| JD focus | How this project shows it |
|----------|---------------------------|
| **Collaborate and deploy with agility** | Single repo (frontend + backend), clear API contract, modular services (ingestion, anomaly, correlation, ML) that can be evolved independently. |
| **AI-assisted development** | Built with AI-assisted tools for structure, tests, and docs; code is organized for readability and maintainability. |
| **Clean, maintainable code** | Typed models (Pydantic-style), named constants, error handling, and docstrings; frontend uses reusable components and theme variables. |
| **AI for code and product** | ML for prediction and explainability (SHAP-lite, confidence, drift); AI-powered insights layer (template-based, ready for LLM). |
| **DevOps / automation** | Scripts for synthetic data; design supports containers (Dockerfile stubbed) and CI/CD; future enhancements call out pipelines and observability. |
| **Modern languages & tools** | Python (FastAPI), JavaScript (React), Git; optional Docker/K8s and cloud in future roadmap. |
| **Problem-solving & learning** | End-to-end solution from problem definition to prototype; applied stats (Z-score, Pearson), ML (linear models), and responsible AI (uncertainty, explainability, drift). |

This document serves as the **design outline**, **tech stack**, and **future enhancements** for the Personal Health & Wellness Aggregator and its alignment with the hackathon case study and role expectations.
