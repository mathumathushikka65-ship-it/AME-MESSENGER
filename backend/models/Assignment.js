const mongoose = require('mongoose');

// File (local + Cloudinary) illa link attachment
const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['file', 'link'],
    required: true
  },
  kind: {
    type: String,
    enum: ['image', 'video', 'pdf', 'document', 'youtube', 'drive', 'website'],
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 0
  },
  // Link-na: link URL. File-na: Cloudinary URL
  url: {
    type: String,
    default: ''
  },
  // File-na: server-la save aana local path (/uploads/assignments/...)
  localPath: {
    type: String,
    default: ''
  },
  // Cloudinary public id (cloud file-a delete panna venum-na use aagum)
  publicId: {
    type: String,
    default: ''
  },
  youtubeId: {
    type: String,
    default: ''
  }
});

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // fileUrl ippo required illa, links mattum submit panna mudiyum
  fileUrl: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  attachments: [attachmentSchema],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewStatus: {
    type: String,
    enum: ['Submitted', 'Reviewed'],
    default: 'Submitted'
  },
  marks: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date,
    default: null
  }
});

const assignmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  totalMarks: {
    type: Number,
    default: 100
  },
  attachmentUrl: {
    type: String,
    default: ''
  },
  submissions: [submissionSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);
