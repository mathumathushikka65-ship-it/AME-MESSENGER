const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const authMiddleware = require('../Middleware/authMiddleware');
const cloudinary = require('../config/cloudinary');
const { sendAssignmentCards } = require('../utils/assignmentChat');

// ---------------- ATTACHMENT SETTINGS ----------------
const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const FILE_TYPES = {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    video: ['.mp4', '.mov', '.webm', '.mkv', '.avi'],
    pdf: ['.pdf'],
    document: ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt']
};

const getFileKind = (filename) => {
    const extension = path.extname(filename).toLowerCase();

    return (
        Object.keys(FILE_TYPES).find((kind) =>
            FILE_TYPES[kind].includes(extension)
        ) || null
    );
};

// Local folder: backend/uploads/assignments
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'assignments');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Files memory-la vaanguvom, piragu local + Cloudinary rendulayum save pannuvom
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_ATTACHMENTS
    },
    fileFilter: (req, file, cb) => {
        if (getFileKind(file.originalname)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    'Unsupported file type. Use image, video, PDF or document files.'
                )
            );
        }
    }
});

const uploadErrorMessage = (error) => {
    if (error.code === 'LIMIT_FILE_SIZE') {
        return 'Each file must be 50 MB or smaller.';
    }

    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return `You can upload up to ${MAX_ATTACHMENTS} files.`;
    }

    return error.message;
};

// Local save
const saveLocal = async (file) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const storedName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;

    await fs.promises.writeFile(path.join(UPLOAD_DIR, storedName), file.buffer);

    return `/uploads/assignments/${storedName}`;
};

// Cloudinary save
const saveCloud = (file) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'AME_MESSENGER/assignments',
                resource_type: 'auto',
                use_filename: true,
                unique_filename: true
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(file.buffer);
    });

// ---------------- LINK HELPERS ----------------
const getLinkKind = (url) => {
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
        return 'youtube';
    }

    if (host === 'drive.google.com' || host === 'docs.google.com') {
        return 'drive';
    }

    return 'website';
};

const getYouTubeId = (url) => {
    const host = url.hostname.replace(/^www\./, '');
    let id = null;

    if (host === 'youtu.be') {
        id = url.pathname.slice(1);
    } else if (url.searchParams.get('v')) {
        id = url.searchParams.get('v');
    } else {
        const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
        id = match ? match[1] : null;
    }

    return id && /^[\w-]{6,20}$/.test(id) ? id : '';
};

// Frontend anuppura links JSON-a validate pannum (kind-a server-la thirumba kandupidikkum)
const parseLinks = (raw) => {
    if (!raw) return [];

    let list;

    try {
        list = JSON.parse(raw);
    } catch {
        return [];
    }

    if (!Array.isArray(list)) return [];

    return list
        .slice(0, MAX_ATTACHMENTS)
        .map((item) => {
            try {
                const url = new URL(String(item.url));

                if (!['http:', 'https:'].includes(url.protocol)) return null;

                const kind = getLinkKind(url);

                return {
                    type: 'link',
                    kind,
                    name: String(item.name || url.hostname).slice(0, 200),
                    url: url.href,
                    youtubeId: kind === 'youtube' ? getYouTubeId(url) : ''
                };
            } catch {
                return null;
            }
        })
        .filter(Boolean);
};

// Role helper: authorization is enforced by the API, not only by the UI.
const requireRole = async (req, res, allowed) => {
    const user = await User.findById(req.userId).select('role');
    if (!user || !allowed.includes(user.role)) {
        res.status(403).json({ message: 'You do not have permission to perform this action.' });
        return false;
    }
    req.userRole = user.role;
    return true;
};

// Teacher-ku ellam; student-ku avanoda own submission mattum
const forViewer = (assignment, userId) => {
    const data = assignment.toObject();
    const isOwner = String(data.user?._id || data.user) === String(userId);

    if (isOwner) return data;

    data.submissions = (data.submissions || []).filter(
        (item) => String(item.student?._id || item.student) === String(userId)
    );
    delete data.recipients;

    return data;
};

// CREATE ASSIGNMENT (teachers only; supports teacher attachments and recipient IDs)
router.post('/', authMiddleware, (req, res) => {
    upload.array('files', MAX_ATTACHMENTS)(req, res, async (uploadError) => {
        if (uploadError) {
            return res.status(400).json({ message: uploadErrorMessage(uploadError) });
        }
        try {
            if (!(await requireRole(req, res, ['teacher']))) return;

            const { title, subject, description, dueDate, priority, status, totalMarks } = req.body;
            if (!title || !subject || !dueDate) {
                return res.status(400).json({ message: 'Title, subject and due date are required' });
            }

            const files = req.files || [];
            const links = parseLinks(req.body.links);
            if (files.length + links.length > MAX_ATTACHMENTS) {
                return res.status(400).json({ message: `You can add up to ${MAX_ATTACHMENTS} attachments` });
            }

            let recipientIds = [];
            try { recipientIds = JSON.parse(req.body.recipients || '[]'); } catch { recipientIds = []; }
            if (!Array.isArray(recipientIds)) recipientIds = [];
            recipientIds = [...new Set(recipientIds.map(String))];
            // Groups: select panna group-la irukkura members-aiyum recipients-la serkkum
            let groupIds = [];
            try { groupIds = JSON.parse(req.body.groupIds || '[]'); } catch { groupIds = []; }
            if (!Array.isArray(groupIds)) groupIds = [];
            groupIds = [...new Set(groupIds.map(String))];

            let groupConversations = [];
            if (groupIds.length) {
                // Teacher irukkura groups mattum
                groupConversations = await Conversation.find({
                    _id: { $in: groupIds }, type: 'group', participants: req.userId
                }).select('_id participants');
                if (groupConversations.length !== groupIds.length) {
                    return res.status(400).json({ message: 'Invalid group selected.' });
                }
                groupConversations.forEach((group) => {
                    group.participants.forEach((id) => recipientIds.push(String(id)));
                });
            }

            // Teacher thannai thaane recipient-aa serkka koodathu
            recipientIds = [...new Set(recipientIds)].filter((id) => id !== String(req.userId));

            if (recipientIds.length) {
                const validUsers = await User.find({ _id: { $in: recipientIds } }).select('_id');
                if (validUsers.length !== recipientIds.length) {
                    return res.status(400).json({ message: 'Some selected recipients are invalid.' });
                }
            }

            const warnings = [];
            const fileAttachments = await Promise.all(files.map(async (file) => {
                const localPath = await saveLocal(file);
                let cloud = {};
                try { cloud = await saveCloud(file); }
                catch (error) { warnings.push(`${file.originalname}: cloud backup failed`); }
                return {
                    type: 'file', kind: getFileKind(file.originalname), name: file.originalname,
                    size: file.size, localPath, url: cloud.secure_url || '', publicId: cloud.public_id || ''
                };
            }));

            const assignment = await Assignment.create({
                user: req.userId, title, subject, description, dueDate, priority, status,
                totalMarks, recipients: recipientIds, attachments: [...fileAttachments, ...links]
            });

            // Select panna students-oda personal chat-ku assignment card anuppum
            await sendAssignmentCards({
                io: req.app.get('io'),
                assignment,
                senderId: req.userId,
                recipientIds,
                groupConversations
            });

            return res.status(201).json({ message: 'Assignment created successfully', assignment, warnings });
        } catch (error) {
            return res.status(500).json({ message: 'Failed to create assignment', error: error.message });
        }
    });
});


// GET ALL ASSIGNMENTS
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, status, priority, sortBy } = req.query;

        const user = await User.findById(req.userId).select('role');
        if (!user) return res.status(401).json({ message: 'User not found. Please login again.' });
        const filter = user.role === 'teacher'
            ? { user: req.userId }
            : { $or: [{ recipients: req.userId }, { recipients: { $size: 0 } }, { user: req.userId }] };

        if (status) {
            filter.status = status;
        }

        if (priority) {
            filter.priority = priority;
        }

        if (search) {
            const searchCondition = { $or: [
                { title: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ] };
            if (filter.$or) filter.$and = [{ $or: filter.$or }, searchCondition];
            else Object.assign(filter, searchCondition);
            delete filter.$or;
        }

        const sortOptions = {
            dueDate: { dueDate: 1 },
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 }
        };

        const sort = sortOptions[sortBy] || { createdAt: -1 };

        const assignments = await Assignment.find(filter)
            .populate('submissions.student', 'username email')
            .sort(sort);

        res.status(200).json({
            count: assignments.length,
            assignments: assignments.map((item) => forViewer(item, req.userId))
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch assignments',
            error: error.message
        });
    }
});


// GET SINGLE ASSIGNMENT
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('role');
        const accessFilter = user?.role === 'teacher'
            ? { user: req.userId }
            : { $or: [{ recipients: req.userId }, { recipients: { $size: 0 } }, { user: req.userId }] };
        const assignment = await Assignment.findOne({ _id: req.params.id, ...accessFilter })
            .populate('submissions.student', 'username email');

        if (!assignment) {
            return res.status(404).json({
                message: 'Assignment not found'
            });
        }

        res.status(200).json({ assignment: forViewer(assignment, req.userId) });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch assignment',
            error: error.message
        });
    }
});


// UPDATE ASSIGNMENT
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (!(await requireRole(req, res, ['teacher']))) return;
        const allowedFields = [
            'title',
            'subject',
            'description',
            'dueDate',
            'priority',
            'status',
            'attachmentUrl',
            'totalMarks'
        ];

        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const assignment = await Assignment.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.userId
            },
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        if (!assignment) {
            return res.status(404).json({
                message: 'Assignment not found'
            });
        }

        res.status(200).json({
            message: 'Assignment updated successfully',
            assignment
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update assignment',
            error: error.message
        });
    }
});


// STUDENT SUBMIT ASSIGNMENT (files + links)
router.post('/:id/submit', authMiddleware, (req, res) => {
    upload.array('files', MAX_ATTACHMENTS)(req, res, async (uploadError) => {
        if (uploadError) {
            return res.status(400).json({
                message: uploadErrorMessage(uploadError)
            });
        }

        try {
            if (!(await requireRole(req, res, ['student']))) return;
            const files = req.files || [];
            const links = parseLinks(req.body.links);

            if (files.length + links.length === 0) {
                return res.status(400).json({
                    message: 'Please add at least one file or link'
                });
            }

            if (files.length + links.length > MAX_ATTACHMENTS) {
                return res.status(400).json({
                    message: `You can add up to ${MAX_ATTACHMENTS} attachments`
                });
            }

            const assignment = await Assignment.findById(req.params.id);

            if (!assignment || (assignment.recipients?.length && !assignment.recipients.some(id => String(id) === String(req.userId)))) {
                return res.status(404).json({ message: 'Assignment not found or not assigned to you' });
            }

            const warnings = [];

            // Ovoru file-um local + Cloudinary rendulayum save aagum
            const fileAttachments = await Promise.all(
                files.map(async (file) => {
                    const localPath = await saveLocal(file);

                    let cloud = {};

                    try {
                        cloud = await saveCloud(file);
                    } catch (cloudError) {
                        console.error('Cloudinary upload error:', cloudError.message);
                        warnings.push(`${file.originalname}: cloud backup failed`);
                    }

                    return {
                        type: 'file',
                        kind: getFileKind(file.originalname),
                        name: file.originalname,
                        size: file.size,
                        localPath,
                        url: cloud.secure_url || '',
                        publicId: cloud.public_id || ''
                    };
                })
            );

            const attachments = [...fileAttachments, ...links];

            const fileName =
                attachments.length === 1
                    ? attachments[0].name
                    : `${attachments.length} attachments`;

            const fileUrl = fileAttachments[0]?.url || '';
            const notes = (req.body.notes || '').toString();

            // Find existing submission by this student
            let submission = assignment.submissions.find(
                (item) => String(item.student) === String(req.userId)
            );

            if (submission) {
                // Allow student to resubmit
                submission.fileName = fileName;
                submission.fileUrl = fileUrl;
                submission.notes = notes;
                submission.attachments = attachments;
                submission.submittedAt = new Date();
                submission.reviewStatus = 'Submitted';
                submission.marks = null;
                submission.feedback = '';
                submission.reviewedAt = null;
            } else {
                // Create a new submission
                assignment.submissions.push({
                    student: req.userId,
                    fileName,
                    fileUrl,
                    notes,
                    attachments
                });

                submission = assignment.submissions[
                    assignment.submissions.length - 1
                ];
            }

            await assignment.save();

            // Teacher-ku real-time-la theriyappaduthum (data illa, refresh signal mattum)
            const io = req.app.get('io');
            if (io) {
                io.to(`user:${assignment.user}`).emit('assignment-updated', {
                    assignmentId: String(assignment._id)
                });
            }

            res.status(201).json({
                message: 'Assignment submitted successfully',
                submission,
                warnings
            });

        } catch (error) {
            console.error('Submit error:', error.message);

            res.status(500).json({
                message: 'Failed to submit assignment',
                error: error.message
            });
        }
    });
});


// TEACHER REVIEW SUBMISSION
router.put('/:id/submissions/:submissionId/review', authMiddleware, async (req, res) => {
    try {
        if (!(await requireRole(req, res, ['teacher']))) return;
        const { marks, feedback } = req.body;

        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                message: 'Assignment not found'
            });
        }

        // Only assignment owner can review
        if (String(assignment.user) !== String(req.userId)) {
            return res.status(403).json({
                message: 'Only the assignment owner can review submissions'
            });
        }

        if (marks === undefined || marks === null || marks === '') {
            return res.status(400).json({
                message: 'Marks are required'
            });
        }

        const numericMarks = Number(marks);

        if (
            !Number.isFinite(numericMarks) ||
            numericMarks < 0 ||
            numericMarks > assignment.totalMarks
        ) {
            return res.status(400).json({
                message: `Marks must be between 0 and ${assignment.totalMarks}`
            });
        }

        const submission = assignment.submissions.id(
            req.params.submissionId
        );

        if (!submission) {
            return res.status(404).json({
                message: 'Submission not found'
            });
        }

        submission.marks = numericMarks;
        submission.feedback = feedback || '';
        submission.reviewStatus = 'Reviewed';
        submission.reviewedAt = new Date();

        await assignment.save();

        // Andha student-ku mattum marks vandhuruchu nu signal anuppum
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${submission.student}`).emit('assignment-updated', {
                assignmentId: String(assignment._id)
            });
        }

        res.status(200).json({
            message: 'Submission reviewed successfully',
            submission
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to review submission',
            error: error.message
        });
    }
});


// DELETE ASSIGNMENT
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!(await requireRole(req, res, ['teacher']))) return;
        const assignment = await Assignment.findOneAndDelete({
            _id: req.params.id,
            user: req.userId
        });

        if (!assignment) {
            return res.status(404).json({
                message: 'Assignment not found'
            });
        }

        res.status(200).json({
            message: 'Assignment deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete assignment',
            error: error.message
        });
    }
});

module.exports = router;