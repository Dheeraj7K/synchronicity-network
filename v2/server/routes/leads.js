const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

router.get('/my', protect, async (req, res) => {
    try {
        const { status, type } = req.query;
        
        const query = { wholesalerId: req.user._id };
        if (status) query.status = status;
        if (type) query.type = type;

        const leads = await Lead.find(query)
            .sort({ createdAt: -1 })
            .populate('adId', 'title campaignName')
            .populate('shipmentId', 'title product');

        const stats = {
            total: leads.length,
            new: leads.filter(l => l.status === 'new').length,
            qualified: leads.filter(l => l.qualified).length,
            converted: leads.filter(l => l.status === 'converted').length
        };

        res.json({ success: true, leads, stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', protect, async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id)
            .populate('adId')
            .populate('shipmentId')
            .populate('wholesalerId', 'name email company')
            .populate('sellerId', 'name email company');

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        if (lead.wholesalerId._id.toString() !== req.user._id.toString() &&
            (!lead.sellerId || lead.sellerId._id.toString() !== req.user._id.toString())) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json({ success: true, lead });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            adId, shipmentId, wholesalerId, sellerId,
            type, contact, message, productInterest, source
        } = req.body;

        if (!wholesalerId || !contact || !contact.name || !contact.email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const lead = await Lead.create({
            adId,
            shipmentId,
            wholesalerId,
            sellerId,
            type: type || 'wholesale_inquiry',
            contact,
            message,
            productInterest,
            source: source || 'direct',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        if (adId) {
            const Ad = require('../models/Ad');
            const ad = await Ad.findById(adId);
            if (ad) {
                await ad.recordLead();
            }
        }

        res.status(201).json({ success: true, lead });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status, note } = req.body;

        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        if (lead.wholesalerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        lead.status = status;
        if (note) {
            lead.notes.push(note);
        }

        if (status === 'qualified') {
            lead.qualified = true;
        }

        await lead.save();

        res.json({ success: true, lead });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/notes', protect, async (req, res) => {
    try {
        const { note } = req.body;

        if (!note) {
            return res.status(400).json({ error: 'Note is required' });
        }

        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        if (lead.wholesalerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await lead.addNote(note);

        res.json({ success: true, lead });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;