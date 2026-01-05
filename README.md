<img width="1900" height="948" alt="image" src="https://github.com/user-attachments/assets/c9d5a8e2-f084-4e24-81ed-02e3eaac1bab" />

## Check my app here- https://ai.studio/apps/drive/15D1swWo2IlYxhoAyo355Q6w9TtUi3gOp?fullscreenApplet=true

# WardSense – AI-Driven Pollution Action & Accountability System

WardSense is a **ward-wise air quality intelligence and decision-support platform** designed to move beyond traditional AQI dashboards.  
It transforms air pollution data into **actionable insights, early warnings, accountability metrics, and health risk intelligence** for smarter urban governance.

---

## 🚨 Problem Statement

Urban air pollution varies significantly across different wards due to traffic density, construction activity, industrial presence, and population concentration.  
However, most existing air quality platforms provide **city-level averages**, which hide local pollution hotspots and delay targeted interventions.

Key challenges:
- Lack of **ward-level visibility**
- Reactive pollution management
- No prioritization of high-risk areas
- No accountability or action tracking
- Limited citizen understanding of health risks

---

## 💡 Our Solution

WardSense is an **AI-enabled civic-tech dashboard** that provides:
- Near real-time **ward-wise AQI monitoring**
- **Predictive intelligence** to forecast future AQI
- **Priority ranking** of wards for government action
- **Accountability scoring** to track response effectiveness
- **Health risk insights** for citizens

It bridges the gap between **pollution monitoring and real-world action**.

---

## ⭐ Key Innovations & Novelty

### 1️⃣ Ward Pollution Accountability Score
Each ward is assigned an **Action & Accountability Score (0–100)** based on:
- Duration of high AQI
- Frequency of pollution spikes
- Trend improvement or deterioration
- Preventive vs reactive response

This introduces **measurable governance accountability**, not just monitoring.

---

### 2️⃣ Future AQI Prediction (Using Historical Data)
WardSense predicts **future AQI (next 6–24 hours)** using historical trends and time-series analysis, enabling:
- Preventive action
- Early warnings
- Better planning for authorities and citizens

---

### 3️⃣ Ward Priority Ranking System
Wards are ranked based on:
- AQI severity
- Exposure duration
- Trend direction

This helps authorities **allocate limited resources efficiently** and act where impact is highest.

---

### 4️⃣ Citizen Health Risk Index
Instead of raw AQI numbers, pollution levels are translated into **health risk categories** for:
- Children
- Elderly citizens
- Asthma and respiratory patients
- Outdoor workers

This makes pollution data **human-centric and actionable**.

---

## 🏗️ System Architecture

1. **Data Ingestion Layer**  
   Real-time air quality data from public APIs (WAQI, OpenAQ)

2. **Geo-Mapping Layer**  
   Mapping monitoring stations to ward coordinates

3. **Processing & Analytics Layer**  
   AQI computation, trend analysis, aggregation

4. **AI & Intelligence Layer**  
   - Anomaly detection  
   - AQI forecasting  
   - Accountability scoring  
   - Ward prioritization  

5. **Visualization & Action Layer**  
   Interactive dashboard, maps, alerts, and recommendations

---

## 🛠️ Technology Stack

### Frontend & Visualization
- **Streamlit** – Interactive dashboard UI
- **Leaflet (Folium)** – Ward-wise geospatial visualization

### Data Sources
- **World Air Quality Index (WAQI) API**
- **OpenAQ – Open Air Quality Data Platform**
- **data.gov.in** – Government of India open datasets
- **Free GIS Maps of India** – Ward and boundary references

### Backend & Analytics
- **Python**
- **Pandas** – Data processing and analysis

### AI / Intelligence
- Anomaly detection for pollution spikes
- Trend-based AQI forecasting
- Scoring and ranking algorithms

---

## 🌍 Social Impact

### For Citizens
- Awareness of **local air quality**
- Better health-related decision making
- Improved preparedness for high-pollution periods

### For Government Authorities
- Faster and targeted interventions
- Data-driven prioritization of wards
- Transparent and accountable governance

---

## 📈 Expected Outcomes

- Improved ward-level pollution visibility
- Faster response to pollution events
- Shift from reactive to preventive governance
- Better public health preparedness
- Scalable framework for smart cities

---

## 🚀 Scalability & Future Scope

- Integration with ward-level IoT sensors
- 24–72 hour AQI forecasting
- Traffic and weather data fusion
- Policy impact simulation
- Multi-city deployment

---


## 🔗 References & Resources

- World Air Quality Index (WAQI) API  
- OpenAQ Open Air Quality Data Platform  
- data.gov.in – Government of India Open Data  
- Free GIS Maps of India  
- Streamlit, Leaflet, and Pandas documentation  

---

## 🏁 Conclusion

WardSense transforms air quality data into **predictive, actionable, and accountable intelligence**.  
By empowering both citizens and authorities, it enables smarter urban governance and contributes toward healthier, more sustainable cities.

> *From AQI monitoring to pollution action and accountability.*

---


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
