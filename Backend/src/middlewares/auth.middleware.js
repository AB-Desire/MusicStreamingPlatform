const jwt = require('jsonwebtoken');

function extractToken(req) {
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
}

async function authArtist(req, res, next) {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "artist") {
            return res.status(403).json({ message: "Forbidden: Artist role required" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error("authArtist error:", error.message);
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
}

async function authUser(req, res, next) {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized: Please log in"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Both standard listeners ('user') and creators ('artist') can access streaming/browsing features
        req.user = decoded;
        next();
    } catch (error) {
        console.error("authUser error:", error.message);
        return res.status(401).json({
            message: "Unauthorized: Invalid or expired token"
        });
    }
}

async function authOptional(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        req.user = null;
    }
    next();
}

module.exports = { authArtist, authUser, authOptional };