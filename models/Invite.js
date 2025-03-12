const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  gameType: { type: String, enum: ["checkers", "snakes-ladders"], required: true },
  status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Invite", inviteSchema);
