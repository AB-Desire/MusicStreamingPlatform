const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const COOKIE_OPTIONS = {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
};

async function registerUser(req, res) {
    try {
        const { username, email, password, role = "user" } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [
                { username: username.trim() },
                { email: email.trim().toLowerCase() }
            ]
        });

        if (isUserAlreadyExists) {
            return res.status(409).json({
                message: "User with this username or email already exists"
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hash,
            role: role === 'artist' ? 'artist' : 'user'
        });

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("registerUser error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

async function loginUser(req, res) {
    try {
        const { username, email, password, identifier } = req.body;

        const loginQuery = [];
        if (identifier) {
            loginQuery.push({ username: identifier.trim() });
            loginQuery.push({ email: identifier.trim().toLowerCase() });
        }
        if (username) loginQuery.push({ username: username.trim() });
        if (email) loginQuery.push({ email: email.trim().toLowerCase() });

        if (loginQuery.length === 0 || !password) {
            return res.status(400).json({ message: "Username/Email and password are required" });
        }

        const user = await userModel.findOne({ $or: loginQuery });

        if (!user) {
            return res.status(401).json({
                message: "Invalid Credentials"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid Credentials"
            });
        }

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(200).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("loginUser error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

async function getMe(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("getMe error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function switchRole(req, res) {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Toggle between user and artist or set to requested role
        const targetRole = req.body.role || (user.role === 'artist' ? 'user' : 'artist');
        user.role = targetRole;
        await user.save();

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(200).json({
            message: `Role switched to ${user.role} successfully`,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("switchRole error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function logoutUser(req, res) {
    res.clearCookie("token", { path: '/' });
    return res.status(200).json({ message: "User logged out successfully" });
}

module.exports = { registerUser, loginUser, logoutUser, getMe, switchRole };