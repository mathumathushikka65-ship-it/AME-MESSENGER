const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: ["Assignment", "Exam", "Meeting", "Study", "Personal", "Event"],
      default: "Assignment",
    },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    time: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Frontend "id" use pannuthu, so _id-ah id-ah maathrom
reminderSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Reminder", reminderSchema);