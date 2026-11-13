const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const Assignment = require('../models/Assignment');
const authMiddleware = require('../Middleware/authMiddleware');
const cloudinary = require('../config/cloudinary');

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

// CREATE ASSIGNMENT
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            title,
            subject,
            description,
            dueDate,
            priority,
            status,
            attachmentUrl,
            totalMarks
        } = req.body;

        if (!title || !subject || !dueDate) {
            return res.status(400).json({
                message: 'Title, subject and due date are required'
            });
        }

        const assignment = await Assignment.create({
            user: req.userId,
            title,
            subject,
            description,
            dueDate,
            priority,
            status,
            attachmentUrl,
            totalMarks
        });

        res.status(201).json({
            message: 'Assignment created successfully',
            assignment
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to create assignment',
            error: error.message
        });
    }
});


// GET ALL ASSIGNMENTS
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, status, priority, sortBy } = req.query;

        const filter = {
            user: req.userId
        };

        if (status) {
            filter.status = status;
        }

        if (priority) {
            filter.priority = priority;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
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
            assignments
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
        const assignment = await Assignment.findOne({
            _id: req.params.id,
            user: req.userId
        }).populate('submissions.student', 'username email');

        if (!assignment) {
            return res.status(404).json({
                message: 'Assignment not found'
            });
        }

        res.status(200).json({ assignment });

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

            if (!assignment) {
                return res.status(404).json({
                    message: 'Assignment not found'
                });
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
