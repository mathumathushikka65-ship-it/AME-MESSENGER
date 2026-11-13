const mongoose = require("mongoose");
const Reminder = require("../models/reminder");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/reminders
exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.userId }).sort({ date: 1, time: 1 });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/reminders
exports.createReminder = async (req, res) => {
  try {
    const { title, description, category, date, time, priority } = req.body;

    if (!title || !title.trim() || !date || !time) {
      return res
        .status(400)
        .json({ message: "Title, date and time are required." });
    }

    const reminder = await Reminder.create({
      user: req.userId,
      title,
      description,
      category,
      date,
      time,
      priority,
    });

    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/reminders/:id
exports.updateReminder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid reminder id." });
    }

    const { title, description, category, date, time, priority } = req.body;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, user: req.userId },
      { title, description, category, date, time, priority },
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found." });
    }

    res.json(reminder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/reminders/:id/toggle
exports.toggleReminder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid reminder id." });
    }

    const reminder = await Reminder.findOne({ _id: id, user: req.userId });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found." });
    }

    reminder.completed = !reminder.completed;
    await reminder.save();

    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/reminders/:id
exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid reminder id." });
    }

    const reminder = await Reminder.findOneAndDelete({ _id: id, user: req.userId });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found." });
    }

    res.json({ message: "Reminder deleted.", id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};