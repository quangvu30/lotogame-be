const uWS = require("uWebSockets.js");
const { v4: uuidv4 } = require("uuid");

const PORT = 9001;

const app = uWS.App({});
const ADMIN_ID = "random-generated-token-12345";

// Store connected clients
const clients = new Map();

const TOPIC_BROADCAST = "broadcast";
const TOPIC_ADMIN = "admin";
const TOPIC_USERS = "users";

app.ws("/*", {
  /* Options */
  compression: uWS.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 60,

  /* Handlers */
  upgrade: (res, req, context) => {
    console.log(
      "An Http connection wants to become WebSocket, URL: " + req.getUrl() + "!"
    );

    const upgradeAborted = { aborted: false };

    res.onAborted(() => {
      upgradeAborted.aborted = true;
    });

    // Parse query parameters
    const url = req.getUrl();
    const query = req.getQuery();
    const params = new URLSearchParams(query);
    const clientName = params.get("clientName") || "Anonymous";

    res.upgrade(
      {
        url: url,
        clientName: clientName,
      },
      req.getHeader("sec-websocket-key"),
      req.getHeader("sec-websocket-protocol"),
      req.getHeader("sec-websocket-extensions"),
      context
    );
  },

  open: (ws) => {
    console.log("A WebSocket connected!");
    const id = ws.clientName === ADMIN_ID ? ws.clientName : uuidv4();
    ws.id = id;
    ws.clientName = ws.clientName || `Client-${id}`;
    ws.connectedAt = new Date();
    clients.set(id, ws);

    console.log(`Client ${ws.clientName} (${id}) connected`);
    id !== ADMIN_ID &&
      app.publish(
        TOPIC_ADMIN,
        JSON.stringify({
          type: "user_connected",
          clientId: id,
          clientName: ws.clientName,
          timestamp: new Date(),
        })
      );

    if (ws.id === ADMIN_ID) {
      ws.subscribe(TOPIC_ADMIN);
    } else {
      ws.subscribe(TOPIC_USERS);
    }
    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "connection",
        message: "Connected to WebSocket server",
        clientId: id,
        clientName: ws.clientName,
      })
    );

    // for admin
    if (ws.id == ADMIN_ID) {
      ws.send(
        JSON.stringify({
          type: "count_users_online",
          data: {
            count: clients.size - 1, // exclude admin
            users: Array.from(clients.values())
              .filter((client) => client.id !== ADMIN_ID)
              .map((client) => ({
                clientId: client.id,
                clientName: client.clientName,
                connectedAt: client.connectedAt,
              })),
          },
        })
      );
    }
  },

  message: (ws, message, isBinary) => {
    try {
      const data = Buffer.from(message).toString();
      const parsedData = JSON.parse(data);
      switch (parsedData.type) {
        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;
        case "reset":
          app.publish(
            TOPIC_USERS,
            JSON.stringify({
              type: "reset",
            })
          );
          break;
        case "pick_number":
          app.publish(
            TOPIC_USERS,
            JSON.stringify({
              type: "pick_number",
              data: parsedData.data,
            })
          );
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }
  },

  drain: (ws) => {
    console.log("WebSocket backpressure: " + ws.getBufferedAmount());
  },

  close: (ws, code, message) => {
    app.publish(
      TOPIC_ADMIN,
      JSON.stringify({
        type: "user_disconnected",
        clientId: ws.id,
        clientName: ws.clientName,
        timestamp: new Date(),
      })
    );
    console.log("WebSocket closed with code:", code);
    clients.delete(ws.id);
  },
});

app.listen(PORT, (token) => {
  if (token) {
    console.log(`WebSocket server listening on port ${PORT}`);
  } else {
    console.log(`Failed to listen on port ${PORT}`);
  }
});

module.exports = app;
