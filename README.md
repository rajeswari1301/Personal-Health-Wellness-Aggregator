# Personal Health & Wellness Aggregator

An intelligent platform that unifies disparate health data streams to provide actionable, personalized insights with security-style anomaly detection and ML-powered predictions.

---

## 🎬 Video Presentation

**(https://vimeo.com/1160885016?share=copy&fl=sv&fe=ci)**
> The demo is slightly longer than the suggested range to clearly walk through the full system design, AI components, and technical decisions.

---

### Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install fastapi uvicorn pandas numpy scikit-learn

# Run the server
python -m uvicorn main:app --reload --port 8000
```

Backend will be running at: http://localhost:8000

API documentation available at: http://localhost:8000/docs

### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

Frontend will be running at: http://localhost:5173

### Generate Synthetic Data (Optional)

If you need to regenerate the health data:
```bash
cd scripts
python generate_synthetic_data.py
```

---

## 📁 Project Structure
```
health-aggregator/
├── backend/
│   ├── main.py
│   ├── services/
│   │   ├── data_ingestion.py
│   │   ├── anomaly_detection.py
│   │   ├── correlation_engine.py
│   │   ├── counterfactual_engine.py
│   │   └── llm_insights.py
│   ├── models/
│   │   └── health_data.py
│   └── data/
│       └── synthetic_health_data.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── components/
│   │       ├── Dashboard.jsx
│   │       ├── AnomalyAlerts.jsx
│   │       ├── AnomalyTimeline.jsx
│   │       ├── MetricsTrendChart.jsx
│   │       ├── CorrelationChart.jsx
│   │       ├── WhatIfSimulator.jsx
│   │       ├── HealthScoreBreakdown.jsx
│   │       ├── BaselinesPanel.jsx
│   │       └── WeeklyStoryCard.jsx
│   └── package.json
│
├── scripts/
│   └── generate_synthetic_data.py
│
├── DESIGN_DOC.md
└── README.md
```



## 📄 Documentation

See [DESIGN_DOC.md](./DESIGN_DOC.md) for detailed design documentation including architecture, data model, and technical decisions.


