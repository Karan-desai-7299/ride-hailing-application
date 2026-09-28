
<div align="center">

# 🚗 Ride Hailing Web Application
### Full-Stack Ride-Hailing Web Application

![MERN Stack](https://img.shields.io/badge/Stack-MERN-20232A?style=for-the-badge&logo=mongodb&logoColor=4EA94B)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-black?style=for-the-badge&logo=socket.io)
![Mapbox](https://img.shields.io/badge/Maps-Mapbox_GL-000000?style=for-the-badge&logo=mapbox&logoColor=white)
![Vite](https://img.shields.io/badge/Frontend-Vite_+_React-646CFF?style=for-the-badge&logo=vite&logoColor=white)

> An end-to-end ride-hailing platform — real-time tracking, live fare estimates, OTP-secured rides, and a full captain dashboard — built on the MERN stack.

</div>

---

## ✨ Features at a Glance

### 👤 Rider Experience

| Feature | Description |
|---|---|
| 📍 Autocomplete Search | Smart pickup & destination suggestions powered by Google Maps |
| 💰 Fare Estimator | Instant quotes for UberGo, Moto, and UberAuto |
| 🗺️ Live Routing | Route lines drawn on the map the moment a captain accepts |
| 🔄 Real-Time Status | Live updates: *Looking → Accepted → OTP Verified → Riding* |
| 🚦 Smart Matching | Car requests go to car drivers, moto to moto, auto to auto — no mismatches |
| 📋 Ride History | Bottom drawer with full history: fare, route, captain, and status |

### 🚕 Captain (Driver) Experience

| Feature | Description |
|---|---|
| 🟢 Auto Status Sync | Automatically goes online/offline via socket on login/logout |
| 🔔 Ride Alerts | Real-time pop-up notification when a nearby user books |
| 🗺️ Interactive Map | Directions drawn from current location to pickup to drop |
| 🔐 OTP Verification | Secure 6-digit OTP to start every ride — no spoofing |
| 💸 Earnings Tracker | Running total + full history of completed rides |

---

## 🛠️ Tech Stack

```
Frontend          →  React.js · Vite · TailwindCSS · GSAP · React Google Maps API
Backend           →  Node.js · Express.js · MongoDB (Mongoose) · Socket.io · Express Validator
External APIs     →  Google Maps Geocoding API · Google Maps Directions API
```

---

## ⚙️ Local Setup

### Prerequisites

- Node.js **v18+**
- MongoDB Atlas account or a local MongoDB instance

---

### 1 — Clone the Repository

```bash
git clone https://github.com/Karan-desai-7299/ride-hailing-application
cd uber-clone-mern
```

---

### 2 — Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in `/Backend`:

```env
PORT=3000
DB_CONNECT=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
GOOGLE_MAPS_API=<your_google_maps_api_key>
```

Start the server:

```bash
npm run dev
```

> Server runs on `http://localhost:3000`

---

### 3 — Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `/frontend`:

```env
VITE_BASE_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=<your_google_maps_api_key>
```

Start the dev server:

```bash
npm run dev
```

> App runs on `http://localhost:5173`

---

## 📁 Project Structure

```
uber-clone-mern/
│
├── Backend/
│   ├── controllers/        # Request handlers — user, captain, ride, maps
│   ├── models/             # Mongoose schemas — User, Captain, Ride
│   ├── routes/             # REST API endpoints
│   ├── services/           # Business logic — maps, ride creation, crypto
│   └── socket.js           # Socket.io event orchestration
│
└── frontend/
    └── src/
        ├── components/     # UI blocks — LiveTracking, Panels, Confirm forms
        ├── pages/          # Route views — Home, Riding, Login, Signup
        └── context/        # Global state — Socket, User, Captain contexts
```

---

## 🧪 Testing Notes

- Use **Pune** coordinates in both rider and captain inputs for realistic local testing.
- A **5,000 km fallback radius** is built in — captains at any location can receive and accept bookings during development, so you can test the full ride flow without needing two devices in the same city.

---

## 🔑 Google Maps API — Required Permissions

Make sure the following APIs are enabled in your Google Cloud project:

- ✅ Maps JavaScript API
- ✅ Geocoding API
- ✅ Directions API
- ✅ Places API *(for autocomplete)*

---

<div align="center">

Made with ☕ by [Karansinh Desai](https://www.linkedin.com/in/karansinh-desai/)

</div>
