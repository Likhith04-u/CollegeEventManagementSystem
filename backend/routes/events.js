const express = require("express");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

async function addCounts(events) {
  const ids = events.map((event) => event._id);
  const counts = await Registration.aggregate([
    { $match: { event: { $in: ids }, status: "Registered" } },
    { $group: { _id: "$event", count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
  return events.map((event) => {
    const obj = event.toObject ? event.toObject() : event;
    obj.registeredCount = countMap.get(String(obj._id)) || 0;
    return obj;
  });
}

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== "All") filter.category = req.query.category;
    if (req.query.search) {
      const safe = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } },
        { venue: { $regex: safe, $options: "i" } },
        { organizer: { $regex: safe, $options: "i" } }
      ];
    }
    const events = await Event.find(filter).sort({ date: 1 });
    res.json({ events: await addCounts(events) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to load events." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json({ event: (await addCounts([event]))[0] });
  } catch {
    res.status(400).json({ message: "Invalid event ID." });
  }
});

router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ message: "Event created successfully.", event });
  } catch (error) {
    res.status(400).json({ message: error.message || "Invalid event details." });
  }
});

router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json({ message: "Event updated successfully.", event });
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to update event." });
  }
});

router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    await Registration.deleteMany({ event: event._id });
    res.json({ message: "Event and its registrations deleted." });
  } catch {
    res.status(400).json({ message: "Unable to delete event." });
  }
});

module.exports = router;