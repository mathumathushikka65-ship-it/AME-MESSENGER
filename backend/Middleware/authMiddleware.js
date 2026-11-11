const jwt = require("jsonwebtoken");
const User = require("../models/User");
const LoginLog = require("../models/LoginLog");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. Please login."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.userId = decoded.userId;
        req.sessionId = decoded.sessionId || null;

        const now = new Date();

        // Update user's last active time
        await User.findByIdAndUpdate(
            req.userId,
            {
                $set: {
                    lastSeen: now,
                    isOnline: true
                }
            }
        );

        // Update this login session's last active time
        if (req.sessionId) {
            await LoginLog.findOneAndUpdate(
                {
                    _id: req.sessionId,
                    user: req.userId,
                    sessionStatus: "Online"
                },
                {
                    $set: {
                        lastActiveAt: now
                    }
                }
            );
        }

        next();

    } catch (error) {
        console.error("Auth Middleware Error:", error.message);

        if (error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Invalid or expired token. Please login again."
            });
        }

        return res.status(500).json({
            message: "Authentication check failed."
        });
    }
};

module.exports = authMiddleware;


