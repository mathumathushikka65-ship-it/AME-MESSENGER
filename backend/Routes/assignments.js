
const express = require('express');
const router = express.Router();

const Assignment = require('../models/Assignment');
const authMiddleware = require('../Middleware/authMiddleware');

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

        const assignments = await Assignment.find(filter).sort(sort);

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
        });

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


// STUDENT SUBMIT ASSIGNMENT
router.post('/:id/submit', authMiddleware, async (req, res) => {
    try {
        const { fileUrl, fileName } = req.body;

        if (!fileUrl) {
            return res.status(400).json({
                message: 'Submission file URL is required'
            });
        }

        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                message: 'Assignment not found'
            });
        }

        // Find existing submission by this student
        let submission = assignment.submissions.find(
            (item) => String(item.student) === String(req.userId)
        );

        if (submission) {
            // Allow student to resubmit
            submission.fileUrl = fileUrl;
            submission.fileName = fileName || '';
            submission.submittedAt = new Date();
            submission.reviewStatus = 'Submitted';
            submission.marks = null;
            submission.feedback = '';
            submission.reviewedAt = null;
        } else {
            // Create a new submission
            assignment.submissions.push({
                student: req.userId,
                fileUrl,
                fileName: fileName || ''
            });

            submission = assignment.submissions[
                assignment.submissions.length - 1
            ];
        }

        await assignment.save();

        res.status(201).json({
            message: 'Assignment submitted successfully',
            submission
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to submit assignment',
            error: error.message
        });
    }
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

