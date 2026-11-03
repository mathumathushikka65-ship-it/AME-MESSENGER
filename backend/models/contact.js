const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contactUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nickname: { type: String, trim: true, maxlength: 60, default: '' },
  collection: { type: String, trim: true, maxlength: 60, default: 'All Contacts' },
  isHidden: { type: Boolean, default: false }
}, { timestamps: true });

contactSchema.index({ owner: 1, contactUser: 1 }, { unique: true });
module.exports = mongoose.model('Contact', contactSchema);