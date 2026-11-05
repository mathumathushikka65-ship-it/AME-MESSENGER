const express = require("express");
const {
  getReminders,
  createReminder,
  updateReminder,
  toggleReminder,
  deleteReminder,
} = require("../Controller/reminderController");

const router = express.Router();

router.get("/", getReminders);
router.post("/", createReminder);
router.put("/:id", updateReminder);
router.patch("/:id/toggle", toggleReminder);
router.delete("/:id", deleteReminder);

module.exports = router;