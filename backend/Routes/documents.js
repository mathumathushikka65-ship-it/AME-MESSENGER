const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Document = require('../models/Document');

const router = express.Router();

// ---- auth: same token & userId as your socket auth ----
const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
     } catch (err) {
    console.error('JWT error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ---- helpers ----
const handle = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error('Document route error:', err.message);
    res.status(500).json({ error: 'Server error' });
  });

const toClient = (d) => ({
  id: d._id,
  title: d.title,
  content: d.content, // undefined in the list view, so it is left out
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

const validate = ({ title, content }) => {
  if (title !== undefined && (typeof title !== 'string' || title.length > 200)) return 'Invalid title';
  if (content !== undefined && typeof content !== 'string') return 'Invalid content';
  return null;
};

const checkId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ error: 'Invalid id' });

router.use(auth);

// ---- routes ----
router.get('/', handle(async (req, res) => {
  const docs = await Document.find({ owner: req.userId }).select('title updatedAt').sort({ updatedAt: -1 });
  res.json(docs.map(toClient));
}));

router.get('/:id', checkId, handle(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, owner: req.userId });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(toClient(doc));
}));

router.post('/', handle(async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const doc = await Document.create({
    owner: req.userId,
    title: req.body.title || undefined,
    content: req.body.content || '',
  });
  res.status(201).json(toClient(doc));
}));

router.put('/:id', checkId, handle(async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const update = {};
  if (req.body.title !== undefined) update.title = req.body.title;
  if (req.body.content !== undefined) update.content = req.body.content;

  const doc = await Document.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(toClient(doc));
}));

router.delete('/:id', checkId, handle(async (req, res) => {
  const doc = await Document.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
}));

module.exports = router;