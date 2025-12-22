# Loto Game Backend

A Node.js backend server with WebSocket support (µWebSockets.js) and REST API (Express) with basic authentication.

## Features

- **WebSocket Server** (µWebSockets.js) - Real-time communication on port 9001
- **REST API** (Express) - HTTP endpoints with basic auth on port 3000

## Installation

```bash
npm install
```

## Running the Server

```bash
npm start
```

The application will start both servers:

- Express API: `http://localhost:3000`
- WebSocket Server: `ws://localhost:9001`

## API Endpoints

### Public Endpoints

- `GET /` - Welcome message and available endpoints
- `GET /api/health` - Health check endpoint

### Authentication Required

All protected endpoints require Basic Authentication header:

```
Authorization: Basic <base64(username:password)>
```

**Default Users:**

- Username: `admin`, Password: `admin123`
- Username: `user`, Password: `user123`

#### Login

- `POST /api/login` - Authenticate user with basic auth

**Example using curl:**

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)"
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "username": "admin"
  },
  "timestamp": "2025-12-22T..."
}
```

#### Profile

- `GET /api/profile` - Get user profile (protected)

**Example:**

```bash
curl http://localhost:3000/api/profile \
  -H "Authorization: Basic $(echo -n 'admin:admin123' | base64)"
```

## WebSocket Server

Connect to `ws://localhost:9001`

### Events

**On Connection:**

- Receives welcome message with client ID

**Send Message:**

```json
{
  "action": "message",
  "content": "Hello from client"
}
```

**Receive Echo:**

```json
{
  "type": "echo",
  "data": { "action": "message", "content": "Hello from client" },
  "timestamp": "2025-12-22T..."
}
```

**Broadcast to Other Clients:**

```json
{
  "type": "broadcast",
  "from": 1234567890.123,
  "data": { "action": "message", "content": "Hello from client" },
  "timestamp": "2025-12-22T..."
}
```

### WebSocket Client Example (JavaScript)

```javascript
const ws = new WebSocket("ws://localhost:9001");

ws.onopen = () => {
  console.log("Connected to WebSocket server");

  // Send a message
  ws.send(
    JSON.stringify({
      action: "message",
      content: "Hello from client",
    })
  );
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("Disconnected from WebSocket server");
};
```

## Project Structure

```
lotogame-be/
├── index.js              # Main entry point
├── api-server.js         # Express REST API with basic auth
├── websocket-server.js   # µWebSockets.js WebSocket server
├── package.json
└── README.md
```

## License

ISC
