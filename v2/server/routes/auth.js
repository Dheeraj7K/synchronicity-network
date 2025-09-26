const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, company } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Please provide email, password, and name' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await User.create({
            email,
            password,
            name,
            role: role || 'wholesaler',
            company
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.plan
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        user.lastLogin = Date.now();
        await user.save();

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.plan,
                adCredits: user.adCredits
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
            plan: req.user.plan,
            adCredits: req.user.adCredits,
            company: req.user.company,
            verified: req.user.verified,
            subscriptionStatus: req.user.subscriptionStatus
        }
    });
});

router.put('/me', protect, async (req, res) => {
    try {
        const { name, company, phone, website } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, company, phone, website },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;