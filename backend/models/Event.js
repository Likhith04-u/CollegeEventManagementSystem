const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  category: { type: String, enum: ["Workshop", "Seminar", "FDP", "Technical Event", "Other"], default: "Other" },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true, trim: true },
  organizer: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1, max: 10000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);