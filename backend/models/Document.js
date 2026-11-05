const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Untitled document', trim: true, maxlength: 200 },
    content: { type: String, default: '' },
  },
  { timestamps: true } // createdAt, updatedAt automatic
);

module.exports = mongoose.model('Document', documentSchema);