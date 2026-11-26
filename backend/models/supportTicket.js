const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () { return this.senderRole !== 'guest'; },
  },
  senderRole: {
    type: String,
    enum: ['user', 'guest', 'admin'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  },
  guestName: { type: String, trim: true, maxlength: 80, default: '' },
  guestEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  category: {
    type: String,
    enum: [
      'Account & Login',
      'Messenger',
      'Contacts & Groups',
      'Assignments',
      'Documents',
      'Payments',
      'Other',
    ],
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open',
    index: true,
  },
  messages: {
    type: [supportMessageSchema],
    validate: [(items) => items.length > 0, 'A support ticket must contain a message.'],
  },
}, { timestamps: true });

supportTicketSchema.index({ updatedAt: -1 });
supportTicketSchema.pre('validate', function (next) {
  if (!this.user && (!this.guestName || !this.guestEmail)) {
    return next(new Error('Guest name and email are required for public support requests.'));
  }
  next();
});

module.exports = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);