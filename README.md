# 🏟️ VenueCrowd: Smart Event Optimizer

A production-ready, lightweight system for optimizing physical event experiences in large sporting venues. 

Features real-time crowd movement optimization, density tracking, and smart navigation integrated with Google Maps.

## 🚀 Key Features

- **Crowd Status API**: Real-time zone density monitoring (High/Medium/Low).
- **Smart Route Suggestion**: AI-inspired routing that avoids high-density "bottleneck" zones.
- **Queue Prediction**: Estimated wait times for gates, food courts, and restrooms.
- **Alert System**: Simulated push notifications for emergency or traffic updates.
- **Interactive Dashboard**: Premium UI with Google Maps visualization and one-click routing.

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), JavaScript (No heavy frameworks)
- **Google Services**: Google Maps Platform (Visualization)
- **Security**: Helmet.js for CSP and secure headers.

## 📦 Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd Physical-Event
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and update your settings.
   ```bash
   cp .env.example .env
   ```

4. **Google Maps API Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Enable **Maps JavaScript API**.
   - Create an API key.
   - Update `public/index.html` at `GOOGLE_API_KEY = "YOUR_KEY"`.

5. **Run Locally**:
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your browser.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/crowd` | Returns real-time zone density status. |
| GET | `/queue` | Returns estimated wait times per zone. |
| GET | `/route?from=A&to=B` | Returns specialized route avoiding high density. |
| GET | `/alert` | Simulates a push notification for users. |
| POST | `/admin/density` | Updates zone density (Requires body: `{zoneId, density}`) |

## 🧪 Testing (Manual)

Use these commands to verify the API functionality:

```bash
# Get Crowd Status
curl http://localhost:3000/crowd

# Get Queue Estimates
curl http://localhost:3000/queue

# Get Optimized Route
curl "http://localhost:3000/route?from=gate_a&to=seating_zone_1"

# Trigger Alert Simulation
curl http://localhost:3000/alert
```

## 📐 Project Structure

```text
/
├── public/
│   └── index.html      # Lightweight frontend dashboard
├── server.js           # Express backend with pathfinding logic
├── .env.example        # Environment variable template
├── package.json        # Dependencies & Scripts
└── README.md           # This file!
```

## 🚀 Deployment (Google Cloud Console)

This project is Docker-ready for **Google Cloud Run** or **GKE**.

### 1. Build and Test Locally
```bash
docker build -t venue-optimization .
docker run -p 3000:3000 venue-optimization
```

### 2. Deploy to Cloud Run
Using the **gcloud CLI**:
```bash
# Set your project ID
gcloud config set project [PROJECT_ID]

# Submit build to Artifact Registry
gcloud builds submit --tag gcr.io/[PROJECT_ID]/venue-optimization

# Deploy to Cloud Run
gcloud run deploy venue-optimization \
  --image gcr.io/[PROJECT_ID]/venue-optimization \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---
Built with ❤️ for better event experiences by **Antigravity AI**.
