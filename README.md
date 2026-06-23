# Uber Clone - Ride Hailing Web Application

An end-to-end ride-hailing application built using the MERN stack with Socket.io for real-time tracking, Google Maps Platform for directions/geocoding, and a highly responsive, premium React-based frontend.

---

## 🚀 Key Features

### 👤 User View
- **Find Rides**: Enter pickup and destination locations with autocomplete suggestions.
- **Fare Breakdown**: Instantly get fare estimates for different vehicle options (UberGo, Moto, UberAuto).
- **Directions & Routing**: Real-time directions and route lines are plotted on the Google Map from your pickup point to the destination as soon as the ride is accepted.
- **Ride Status Tracking**: Live updates from "Looking for Driver" to "Waiting for Driver" (once accepted, showing Captain name, vehicle type, color, plate, and OTP code).
- **Request Filtering**: Car requests are strictly routed to car drivers, motorcycle requests to motorcycle drivers, and auto requests to auto rickshaws.
- **Ride History**: Drawer at the bottom displaying all past requested rides, including fares, routes, status, and driver details.

### 🚕 Captain (Driver) View
- **Status Updates**: Automated online/offline socket status update when logging in and out.
- **Ride Requests**: Real-time pop-up notification when a user books a ride nearby (with a test-fallback to match far-away bookings during testing).
- **Interactive Routing**: Map draws directions from the captain's location or pickup to the destination.
- **Secure OTP Verification**: Start a ride by entering the secure 6-digit OTP provided by the passenger.
- **Ride History & Earnings**: Track your earnings and view details of all previous completed rides.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, TailwindCSS, GSAP (animations), React Google Maps API (`useJsApiLoader`).
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, Express Validator.
- **External Services**: Google Maps Geocoding & Directions API.

---

## ⚙️ Quick Setup Guide

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local installation.

### 2. Backend Configuration
1. Open the `/Backend` directory.
2. Ensure your `.env` contains:
   ```env
   PORT=3000
   DB_CONNECT=<your_mongodb_connection_string>
   JWT_SECRET=<your_jwt_secret>
   GOOGLE_MAPS_API=<your_google_maps_api_key>
   ```
3. Run `npm install` and start the server with:
   ```bash
   npm run dev
   ```

### 3. Frontend Configuration
1. Open the `/frontend` directory.
2. Ensure your `.env` contains:
   ```env
   VITE_BASE_URL=http://localhost:3000
   VITE_GOOGLE_MAPS_API_KEY=<your_google_maps_api_key>
   ```
3. Run `npm install` and start the Vite development server with:
   ```bash
   npm run dev
   ```

---

## 📁 Directory Structure
```
uber/
├── Backend/              # Node/Express API Server & Socket server
│   ├── controllers/      # Route controllers (user, captain, ride, maps)
│   ├── models/           # Mongoose schemas (user, captain, ride)
│   ├── routes/           # REST endpoints
│   ├── services/         # Business logic (maps, rides, cryptography)
│   └── socket.js         # Socket.io event orchestration
└── frontend/             # React SPA (Vite)
    ├── src/
    │   ├── components/   # Visual elements (LiveTracking, Panels, Confirm forms)
    │   ├── pages/        # Views (Home, Riding, Login, Signup)
    │   └── context/      # Shared state (Socket, User, Captain contexts)
```

---

## 🛠️ Verification & Testing
- Use **Pune** as your location coordinates in both client and captain inputs for local testing.
- The system includes a **5000 km testing-fallback** allowing captains located at different coordinates to easily receive and accept bookings for any requested pickup address.
