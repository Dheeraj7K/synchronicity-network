const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const { protect, checkPlan } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const { category, country, status, limit = 100 } = req.query;
        
        const query = { active: true };
        
        if (category) query['product.category'] = category;
        if (country) {
            query.$or = [
                { 'origin.country': country },
                { 'destination.country': country }
            ];
        }
        if (status) query.status = status;

        const shipments = await Shipment.find(query)
            .populate('userId', 'name company verified')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ success: true, count: shipments.length, shipments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/my', protect, async (req, res) => {
    try {
        const shipments = await Shipment.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        const stats = {
            total: shipments.length,
            inTransit: shipments.filter(s => s.status === 'in_transit').length,
            delivered: shipments.filter(s => s.status === 'delivered').length,
            totalViews: shipments.reduce((sum, s) => sum + s.views, 0),
            totalRevenue: shipments.reduce((sum, s) => sum + s.adRevenue, 0)
        };

        res.json({ success: true, shipments, stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id)
            .populate('userId', 'name company verified');

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        await shipment.incrementView();

        res.json({ success: true, shipment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', protect, checkPlan('plus', 'pro', 'enterprise'), async (req, res) => {
    try {
        const {
            title, description, product,
            origin, destination,
            trackingNumber, carrier, estimatedArrival
        } = req.body;

        if (!title || !origin || !destination) {
            return res.status(400).json({ error: 'Title, origin, and destination are required' });
        }

        const shipment = await Shipment.create({
            userId: req.user._id,
            title,
            description,
            product,
            origin,
            destination,
            trackingNumber,
            carrier,
            estimatedArrival,
            adsEnabled: req.user.canHostAds()
        });

        res.status(201).json({ success: true, shipment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        let shipment = await Shipment.findById(req.params.id);

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        if (shipment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const {
            title, description, product, status,
            progress, adsEnabled, actualArrival
        } = req.body;

        shipment = await Shipment.findByIdAndUpdate(
            req.params.id,
            { title, description, product, status, progress, adsEnabled, actualArrival },
            { new: true, runValidators: true }
        );

        res.json({ success: true, shipment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const shipment = await Shipment.findById(req.params.id);

        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        if (shipment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        shipment.active = false;
        await shipment.save();

        res.json({ success: true, message: 'Shipment deactivated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;