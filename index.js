// Main entry point to run both servers
const { app: expressApp, server: expressServer } = require("./api-server");
const uWSApp = require("./websocket-server");

console.log("Starting Loto Game Backend...");
console.log("================================");
console.log("Express API Server: http://localhost:3000");
console.log("WebSocket Server: ws://localhost:9001");
console.log("================================");

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down gracefully...");
  expressServer.close(() => {
    console.log("Express server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\nShutting down gracefully...");
  expressServer.close(() => {
    console.log("Express server closed");
    process.exit(0);
  });
});
