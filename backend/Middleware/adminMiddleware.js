const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('role');

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access only' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Admin check failed' });
    }
};

module.exports = adminMiddleware;