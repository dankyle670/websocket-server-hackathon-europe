// wsServer.js
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
const games = new Map();

io.on("connection", (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // Register user with socket
  socket.on("register", (userId) => {
    console.log(`User ${userId} connected with socket ID: ${socket.id}`);
    activeUsers.set(userId, socket.id);
  });

  // 🎲 Start Snakes & Ladders Game
  socket.on("snakes-game-start", (data) => {
    console.log(`Starting Snakes Game: ${data.senderId} vs ${data.receiverId}`);
    const receiverSocketId = activeUsers.get(data.receiverId);

    if (receiverSocketId) {
      games.set(data.senderId, { turn: data.senderId });
      games.set(data.receiverId, { turn: data.senderId });

      // Notify both players about game start
      io.to(receiverSocketId).emit("snakes-game-start", {
        turn: data.senderId,
      });
      socket.emit("snakes-game-start", {
        turn: data.senderId,
      });
    }
  });

  // 🎲 Player Move
  socket.on("snakes-move", (moveData) => {
    console.log("Player Move:", moveData);
    const receiverSocketId = activeUsers.get(moveData.receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("snakes-move", moveData);
    }

    // Switch turns
    games.set(moveData.senderId, { turn: moveData.receiverId });
    games.set(moveData.receiverId, { turn: moveData.receiverId });
  });

  // 🎲 Game Over
  socket.on("snakes-game-over", (gameOverData) => {
    console.log("Game Over:", gameOverData);
    const receiverSocketId = activeUsers.get(
      gameOverData.winner === gameOverData.senderId
        ? gameOverData.receiverId
        : gameOverData.senderId
    );

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("snakes-game-over", gameOverData);
    }

    socket.emit("snakes-game-over", gameOverData);

    // Clear game data
    games.delete(gameOverData.senderId);
    games.delete(gameOverData.receiverId);
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
