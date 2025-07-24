## Security Dashboard MQTT Server,
how it works, its structure, and how to expand it with APIs

## 📘 Documentation: Security Dashboard MQTT Server

### 📌 Overview

This server is the backbone of a security system built using MQTT (Message Queuing Telemetry Transport). It handles communication between IoT devices (e.g., ESP32-based doors) and a central dashboard. Devices publish messages to specific topics (like `doors/door1`), and the server processes these messages for real-time monitoring, logging, or automated actions.



### 🧱 Project Structure


security-dashboard/
├── server/
│   ├── server.js      <-- Main server file
│   ├── package.json   <-- Node.js dependencies
└── ...




### 🚀 How It Works

#### 1. **MQTT Broker**

* You need an MQTT broker running (like Mosquitto) on `localhost:1883`.
* Devices publish messages (e.g., door open/close events) to topics like `doors/door1`.

#### 2. **WebSocket Server**

* A WebSocket server runs on port `8080`.
* This pushes MQTT updates to the frontend dashboard in real time.

#### 3. **MQTT Subscription**

* The server subscribes to a topic pattern, e.g., `doors/#`, which includes all subtopics like `doors/door1`.

#### 4. **Data Flow**

```
ESP32 Device --> MQTT (via Mosquitto) --> Node Server --> WebSocket --> Frontend Dashboard
```

---

### 🛠️ `server.js` (Simplified Logic)

```js
const mqtt = require('mqtt');
const WebSocket = require('ws');

const mqttClient = mqtt.connect('mqtt://localhost:1883');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
  console.log('WebSocket connected');
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('doors/#');
});

mqttClient.on('message', (topic, message) => {
  const msg = { topic, payload: message.toString() };

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });

  console.log(`[MQTT] ${topic}: ${message.toString()}`);
});
```

---

### 🧪 Example MQTT Payloads

#### From ESP32:

```json
{
  "doorId": "door1",
  "status": "open",
  "timestamp": "2025-07-20T01:00:00Z"
}
```

Published to:

```
Topic: doors/door1
```

---

### 🔌 WebSocket Data Format (Frontend Receives)

```json
{
  "topic": "doors/door1",
  "payload": "{\"doorId\":\"door1\",\"status\":\"open\",\"timestamp\":\"...\"}"
}
```

---

### 🧱 How to Expand

#### ✅ 1. Add a REST API

Use `Express.js` to create HTTP endpoints:

```bash
npm install express
```

Example API:

```js
const express = require('express');
const app = express();
app.use(express.json());

app.get('/doors', (req, res) => {
  // Fetch and return door status
});

app.listen(5000, () => {
  console.log('REST API running on port 5000');
});
```

---

#### ✅ 2. Store Events in a Database

Install MongoDB or MySQL, then modify `mqttClient.on('message')` to save data.

Example with MongoDB:

```js
const mongoose = require('mongoose');
const DoorEvent = require('./models/DoorEvent');

mongoose.connect('mongodb://localhost/security');

mqttClient.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  DoorEvent.create(data);
});
```

---

#### ✅ 3. Add Authentication

Use `jsonwebtoken` or `bcrypt` for secure login:

```bash
npm install jsonwebtoken bcrypt
```

---

### 📡 MQTT Topic Naming Convention

| Topic Pattern         | Description             |
| --------------------- | ----------------------- |
| `doors/door1`         | Events for Door 1       |
| `doors/door2`         | Events for Door 2       |
| `alerts/unauthorized` | Access violation alerts |

---

### 🔐 Security Tips

* Use `wss://` for encrypted WebSocket.
* Use authentication for WebSocket and MQTT.
* Sanitize all incoming data before storage/display.

---

### ✅ To Run the Server

1. Start the MQTT broker (e.g., Mosquitto).
2. Start the server:

```bash
npm install
npm start
```

3. Connect devices to publish to MQTT topics.
4. Connect your frontend dashboard to WebSocket `ws://localhost:8080`.


### 📈 Future Ideas

* Role-based access control
* Remote door locking via MQTT
* Admin dashboard analytics
* Email/SMS alerts on breach

