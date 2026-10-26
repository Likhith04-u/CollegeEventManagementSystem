const express = require("express");
const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const { verifyToken, verifyAdmin, verifyStudent } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", verifyToken, verifyStudent, async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user.id })
      .populate("event").sort({ createdAt: -1 });
    res.json({ registrations });
  } catch {
    res.status(500).json({ message: "Unable to load registration history." });
  }
});

router.post("/", verifyToken, verifyStudent, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!mongoose.isValidObjectId(eventId)) return res.status(400).json({ message: "A valid event ID is required." });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found." });
    if (new Date(event.date) < new Date(new Date().toDateString())) {
      return res.status(400).json({ message: "Registration is closed for past events." });
    }
    const existing = await Registration.findOne({ student: req.user.id, event: eventId });
    if (existing?.status === "Registered") return res.status(409).json({ message: "You are already registered for this event." });
    const count = await Registration.countDocuments({ event: eventId, status: "Registered" });
    if (count >= event.capacity) return res.status(409).json({ message: "This event is full." });
    let registration;
    if (existing) {
      existing.status = "Registered";
      registration = await existing.save();
    } else {
      registration = await Registration.create({ student: req.user.id, event: eventId });
    }
    res.status(201).json({ message: "Event registration successful.", registration });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "You are already registered for this event." });
    console.error(error);
    res.status(500).json({ message: "Unable to register for event." });
  }
});

router.patch("/:id/cancel", verifyToken, verifyStudent, async (req, res) => {
  try {
    const registration = await Registration.findOne({ _id: req.params.id, student: req.user.id });
    if (!registration) return res.status(404).json({ message: "Registration not found." });
    registration.status = "Cancelled";
    await registration.save();
    res.json({ message: "Registration cancelled.", registration });
  } catch {
    res.status(400).json({ message: "Unable to cancel registration." });
  }
});

router.get("/event/:eventId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId })
      .populate("student", "name email").populate("event", "title date venue")
      .sort({ createdAt: -1 });
    res.json({ registrations });
  } catch {
    res.status(400).json({ message: "Unable to load participants." });
  }
});

router.patch("/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Registered", "Cancelled"].includes(status)) return res.status(400).json({ message: "Invalid status." });
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ message: "Registration not found." });
    if (status === "Registered" && registration.status !== "Registered") {
      const event = await Event.findById(registration.event);
      const count = await Registration.countDocuments({ event: registration.event, status: "Registered" });
      if (event && count >= event.capacity) return res.status(409).json({ message: "Event capacity has been reached." });
    }
    registration.status = status;
    await registration.save();
    res.json({ message: "Registration status updated.", registration });
  } catch {
    res.status(400).json({ message: "Unable to update registration." });
  }
});

module.exports = router;