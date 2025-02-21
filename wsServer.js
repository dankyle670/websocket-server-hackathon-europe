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
    methods: ["GET", "POST"]
  },
});

// In-Memory Storage for Active Users and Games
const activeUsers = new Map();
const games = new Map();

// 🧩 Generate Snakes and Ladders
const generateSnakesAndLadders = () => {
  const snakes = {};
  const ladders = {};

  // Generate Snakes
  for (let i = 0; i < 10; i++) {
    let start = Math.floor(Math.random() * 89) + 10;
    let end = Math.floor(Math.random() * (start - 1)) + 1;
    snakes[start] = end;
  }

  // Generate Ladders
  for (let i = 0; i < 9; i++) {
    let start = Math.floor(Math.random() * 89) + 1;
    let end = Math.floor(Math.random() * (100 - start)) + start + 1;
    ladders[start] = end;
  }

  return { snakes, ladders };
};

// 🌐 WebSocket Event Handling
io.on("connection", (socket) => {
  console.log(`🚀 New user connected: ${socket.id}`);

  // 🎮 Register User
  socket.on("register", (userId) => {
    console.log(`✅ User ${userId} connected with socket ID: ${socket.id}`);
    activeUsers.set(userId, socket.id);
  });

  // 📩 Send Game Invite
  socket.on("invite", (data) => {
    console.log(`🎲 Game invite from ${data.senderId} to ${data.receiverId}`);
    const receiverSocketId = activeUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive-invite", data);
    }
  });

  // ✅ Accept Game Invite
  socket.on("accept-invite", (data) => {
    console.log(`🎲 Game accepted by ${data.receiverId}`);
    const senderSocketId = activeUsers.get(data.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("invite-accepted", data);
    }
  });

  // 🔥 ==============================
  //        CHECKERS EVENTS
  // 🔥 ==============================

  // 🎲 Start Checkers Game
  socket.on("checkers-game-start", (data) => {
    console.log(`♟️ Checkers Game Start: ${data.senderId} vs ${data.receiverId}`);

    // Store game data in memory
    games.set(data.senderId, {
      player1: data.senderId,
      player2: data.receiverId,
      board: null,
      turn: data.senderId,
    });

    const receiverSocketId = activeUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("checkers-game-start", {
        senderId: data.senderId,
        receiverId: data.receiverId,
        turn: data.senderId,
      });
    }
    socket.emit("checkers-game-start", {
      senderId: data.senderId,
      receiverId: data.receiverId,
      turn: data.senderId,
    });
  });

  // 🎲 Receive Checkers Move
  socket.on("checkers-move", (moveData) => {
    console.log(`♟️ Checkers Move: ${moveData.senderId} -> ${moveData.newPosition}`);
    const receiverSocketId = activeUsers.get(moveData.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("checkers-move", moveData);
    }
  });

  // 🎲 Checkers Game Over
  socket.on("checkers-game-over", (gameOverData) => {
    console.log(`🏆 Checkers Game Over: Winner is ${gameOverData.winner}`);
    const receiverSocketId = activeUsers.get(gameOverData.receiverId);
    io.to(receiverSocketId).emit("checkers-game-over", gameOverData);
    socket.emit("checkers-game-over", gameOverData);
  });

  // 🔥 ==============================
  //  SNAKES & LADDERS EVENTS
  // 🔥 ==============================

  // 🎲 Start Snakes & Ladders Game
  socket.on("snakes-game-start", (data) => {
    console.log(`🐍🪜 Snakes & Ladders Game Start: ${data.senderId} vs ${data.receiverId}`);

    // Generate Snakes and Ladders
    const { snakes, ladders } = generateSnakesAndLadders();

    // Store game data in memory
    games.set(data.senderId, {
      player1: data.senderId,
      player2: data.receiverId,
      snakes,
      ladders,
      turn: data.senderId,
    });

    const receiverSocketId = activeUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("snakes-game-start", {
        snakes,
        ladders,
        turn: data.senderId,
      });
    }
    socket.emit("snakes-game-start", {
      snakes,
      ladders,
      turn: data.senderId,
    });
  });

  // 🎲 Receive Snakes & Ladders Move
  socket.on("snakes-move", (moveData) => {
    console.log(`🐍🪜 Snakes Move: ${moveData.senderId} -> ${moveData.newPosition}`);
    const receiverSocketId = activeUsers.get(moveData.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("snakes-move", moveData);
    }
  });

  // 🎲 Snakes & Ladders Game Over
  socket.on("snakes-game-over", (gameOverData) => {
    console.log(`🏆 Snakes & Ladders Game Over: Winner is ${gameOverData.winner}`);
    const receiverSocketId = activeUsers.get(gameOverData.receiverId);
    io.to(receiverSocketId).emit("snakes-game-over", gameOverData);
    socket.emit("snakes-game-over", gameOverData);
  });

  // 🔌 User Disconnection
  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
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
  console.log(`🚀 WebSocket Server running on port ${PORT}`);
});
