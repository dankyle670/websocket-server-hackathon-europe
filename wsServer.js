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

io.on("connection", (socket) => {
  console.log(`New user connected: ${socket.id}`);

  socket.on("register", (userId) => {
    activeUsers.set(userId, socket.id);
  });

  socket.on("game-start", (data) => {
    const receiverSocketId = activeUsers.get(data.receiverId);
    if (receiverSocketId) {
      const snakes = generateSnakes();
      const ladders = generateLadders();
      games.set(data.senderId, { snakes, ladders });
      io.to(receiverSocketId).emit("game-start", { snakes, ladders, turn: data.senderId });
      socket.emit("game-start", { snakes, ladders, turn: data.senderId });
    }
  });

  socket.on("player-move", (data) => {
    const receiverSocketId = activeUsers.get(data.receiverId);
    io.to(receiverSocketId).emit("player-move", data);
  });

  socket.on("game-over", (data) => {
    const receiverSocketId = activeUsers.get(data.winner === data.senderId ? data.receiverId : data.senderId);
    io.to(receiverSocketId).emit("game-over", data);
    socket.emit("game-over", data);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`WebSocket Server running on port ${PORT}`);
});
