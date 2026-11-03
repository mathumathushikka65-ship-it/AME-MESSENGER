
const express = require('express');
const router = express.Router();

const cloudinary = require('../config/cloudinary');
const upload = require('../Middleware/uploadMiddleware');
const authMiddleware = require('../Middleware/authMiddleware');

// Upload file to Cloudinary
router.post('/', authMiddleware, (req, res) => {

    upload.single('file')(req, res, async (error) => {

        if (error) {
            return res.status(400).json({
                message: error.message
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({
                    message: 'Please select a file'
                });
            }

            const result = await new Promise((resolve, reject) => {

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'AME_MESSENGER',
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

                stream.end(req.file.buffer);
            });

            res.status(200).json({
                message: 'File uploaded successfully',
                data: {
                    fileUrl: result.secure_url,
                    publicId: result.public_id,
                    fileName: req.file.originalname,
                    fileType: result.resource_type,
                    fileSize: result.bytes
                }
            });

        } catch (error) {
            console.error('Cloudinary upload error:', error.message);

            res.status(500).json({
                message: 'File upload failed',
                error: error.message
            });
        }
    });
});

module.exports = router;
