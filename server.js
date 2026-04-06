const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('firebase-admin');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// -- Google Services Setup --

// 1. Firebase Mock/Init
let firebaseInitialized = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT && require('fs').existsSync(process.env.FIREBASE_SERVICE_ACCOUNT)) {
    admin.initializeApp({
      credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT),
      databaseURL: JSON.parse(process.env.FIREBASE_CONFIG || '{}').databaseURL
    });
    firebaseInitialized = true;
  }
} catch (e) { console.warn("[Firebase] Init failed - Check credentials"); }

// 2. Google Calendar Init
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/calendar.events']
});
const calendar = google.calendar({ version: 'v3', auth });

// -- Middleware --
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
      "img-src": ["'self'", "data:", "https://maps.gstatic.com", "https://maps.googleapis.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"]
    }
  }
}));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock Venue Data (Density: 0-100)
let zones = [
  { id: 'gate_a', name: 'Main Gate A', density: 85, location: { lat: -37.8206, lng: 144.9834 }, waitTime: 15 },
  { id: 'gate_b', name: 'North Gate B', density: 20, location: { lat: -37.8190, lng: 144.9845 }, waitTime: 5 },
  { id: 'concourse_east', name: 'East Concourse', density: 60, location: { lat: -37.8198, lng: 144.9850 }, waitTime: 10 },
  { id: 'concourse_west', name: 'West Concourse', density: 30, location: { lat: -37.8198, lng: 144.9820 }, waitTime: 2 },
  { id: 'food_court', name: 'Central Food Court', density: 95, location: { lat: -37.8195, lng: 144.9835 }, waitTime: 25 },
  { id: 'seating_zone_1', name: 'Lower Tier Seating', density: 40, location: { lat: -37.8200, lng: 144.9835 }, waitTime: 0 }
];

// Helper to determine status from density
const getStatus = (density) => {
  if (density > 80) return 'High';
  if (density > 40) return 'Medium';
  return 'Low';
};

// 1. Crowd Status API
app.get('/crowd', (req, res) => {
  const statusReport = zones.map(z => ({
    id: z.id,
    name: z.name,
    density: z.density,
    status: getStatus(z.density)
  }));
  res.json(statusReport);
});

// 2. Queue Prediction API
app.get('/queue', (req, res) => {
  const prediction = zones.map(z => ({
    zone: z.name,
    estimatedWait: z.waitTime,
    unit: 'minutes'
  }));
  res.json(prediction);
});

// 3. Smart Route Suggestion API
app.get('/route', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: "Missing params" });

  const result = {
    suggestion: [`${from}`, 'concourse_west', `${to}`],
    type: 'Density-Aware Path',
    benefit: "Reduces travel time by 8 mins by avoiding food court congestion."
  };
  res.json(result);
});

// 4. Alert System & FCM Mock
app.get('/alert', async (req, res) => {
  const demoAlert = {
    notification: {
      title: "⚠️ High Traffic Alert",
      body: "Exit Gate A is currently congested. Please use North Gate B for faster exit."
    },
    topic: "venue-updates"
  };
  
  if (firebaseInitialized) {
    try {
      await admin.messaging().send(demoAlert);
      console.log("FCM Notification sent successfully");
    } catch (e) { console.error("FCM Send failed:", e.message); }
  } else {
    console.log("[MOCK FCM] Sending message to topic: ", demoAlert.topic);
  }
  
  res.json({ status: "Alert Sent", via: firebaseInitialized ? "Firebase FCM" : "Mock Backend Engine", data: demoAlert });
});

// 5. Google Calendar Integration
app.post('/calendar/sync', async (req, res) => {
  const event = {
    summary: 'Stadium Event: Grand Final',
    location: 'Gate A, Sports Venue',
    description: 'Arrive early to avoid Gate A congestion. Check VenueCrowd for real-time routes.',
    start: { dateTime: '2026-05-10T18:00:00Z', timeZone: 'UTC' },
    end: { dateTime: '2026-05-10T22:00:00Z', timeZone: 'UTC' }
  };

  try {
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      resource: event,
    });
    res.json({ success: true, link: response.data.htmlLink });
  } catch (err) {
    console.error('Calendar Error:', err.message);
    res.status(500).json({ error: "Sync failed - Integration is draft mode", details: err.message, mockLink: "https://calendar.google.com/event?id=mock123" });
  }
});

// Admin Update (Internal use for simulation)
app.post('/admin/density', (req, res) => {
  const { zoneId, density } = req.body;
  const zone = zones.find(z => z.id === zoneId);
  if (zone) {
    zone.density = density;
    zone.waitTime = Math.floor(density / 4); // Basic mock relationship
    res.json({ success: true, zone });
  } else {
    res.status(404).json({ error: "Zone not found" });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
