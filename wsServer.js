// wsServer.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const activeUsers = new Map();
const games = new Map();

// Handle User Connection
io.on("connection", (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Handle User Registration
  socket.on("register", (userId) => {
    activeUsers.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ID: ${socket.id}`);
  });

  // ================================
  //        CHECKERS EVENTS
  // ================================

  // Start Checkers Game
  socket.on("checkers-game-start", (data) => {
    const receiverSocketId = activeUsers.get(data.receiverId);
    if (receiverSocketId) {
      games.set(data.senderId, { board: data.board, turn: data.senderId });
      io.to(receiverSocketId).emit("checkers-game-start", { turn: data.senderId });
      socket.emit("checkers-game-start", { turn: data.senderId });
    }
  });

  // Handle Checkers Move
  socket.on("checkers-move", (data) => {
    const receiverSocketId = activeUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("checkers-move", data);
    }
  });

  // Handle Checkers Game Over
  socket.on("checkers-game-over", (data) => {
    const receiverSocketId = activeUsers.get(data.winner === data.senderId ? data.receiverId : data.senderId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("checkers-game-over", data);
    }
    socket.emit("checkers-game-over", data);
  });

  // ================================
  //  SNAKES & LADDERS EVENTS
  // ================================

  // Start Snakes & Ladders Game
  socket.on("snakes-game-start", (data) => {
    const receiverSocketId = activeUsers.get(data.receiverId);
    if (receiverSocketId) {
      games.set(data.senderId, { snakes: data.snakes, ladders: data.ladders, turn: data.senderId });
      io.to(receiverSocketId).emit("snakes-game-start", { snakes: data.snakes, ladders: data.ladders, turn: data.senderId });
      socket.emit("snakes-game-start", { snakes: data.snakes, ladders: data.ladders, turn: data.senderId });
    }
  });

  // 🔥 Handle Snakes & Ladders Move
  socket.on("snakes-move", (data) => {
    const receiverSocketId = activeUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("snakes-move", data);
    }
  });

  // 🔥 Handle Snakes & Ladders Game Over
  socket.on("snakes-game-over", (data) => {
    const receiverSocketId = activeUsers.get(data.winner === data.senderId ? data.receiverId : data.senderId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("snakes-game-over", data);
    }
    socket.emit("snakes-game-over", data);
  });

  // 🔥 Handle Disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    activeUsers.forEach((value, key) => {
      if (value === socket.id) {
        activeUsers.delete(key);
      }
    });
  });
});

// ================================
// Start WebSocket Server
// ================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`WebSocket Server running on port ${PORT}`);
});
