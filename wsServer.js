require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());

// WebSocket Server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const activeUsers = new Map();

io.on("connection", (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Register user with socket
  socket.on("register", (userId) => {
    console.log(`User ${userId} connected with socket ID: ${socket.id}`);
    activeUsers.set(userId, socket.id);
  });

  // Send game invite
  socket.on("invite", (data) => {
    console.log(`Game invite from ${data.senderId} to ${data.receiverId}`);
    const receiverSocketId = activeUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive-invite", data);
    }
  });

  // Accept game invite
  socket.on("accept-invite", (data) => {
    console.log(`Game accepted by ${data.receiverId}`);
    const senderSocketId = activeUsers.get(data.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("invite-accepted", data);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    activeUsers.forEach((value, key) => {
      if (value === socket.id) {
        activeUsers.delete(key);
      }
    });
  });
});

// Start WebSocket Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`WebSocket Server running on port ${PORT}`);
});
