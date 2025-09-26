const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');
const Shipment = require('../models/Shipment');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/match', async (req, res) => {
    try {
        const { shipmentId, category, country } = req.query;

        const query = { status: 'active', active: true };

        if (category) {
            query['targeting.categories'] = category;
        }

        if (country) {
            query.$or = [
                { 'targeting.countries': country },
                { 'targeting.countries': { $size: 0 } }
            ];
        }

        const ads = await Ad.find(query)
            .sort({ featured: -1, createdAt: -1 })
            .limit(5)
            .populate('userId', 'name company verified');

        res.json({ success: true, count: ads.length, ads });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/my', protect, async (req, res) => {
    try {
        const ads = await Ad.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        const stats = {
            total: ads.length,
            active: ads.filter(a => a.status === 'active').length,
            totalImpressions: ads.reduce((sum, a) => sum + a.impressions, 0),
            totalClicks: ads.reduce((sum, a) => sum + a.clicks, 0),
            totalSpent: ads.reduce((sum, a) => sum + a.budget.spent, 0)
        };

        res.json({ success: true, ads, stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id)
            .populate('userId', 'name company verified');

        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        res.json({ success: true, ad });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const {
            campaignName, title, description, image, videoUrl,
            destinationUrl, callToAction, targeting, budget, pricing
        } = req.body;

        if (!campaignName || !title || !description || !image || !destinationUrl) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!budget || budget.total < 20) {
            return res.status(400).json({ error: 'Minimum budget is $20' });
        }

        if (req.user.adCredits < budget.total) {
            return res.status(400).json({ 
                error: 'Insufficient ad credits',
                required: budget.total,
                available: req.user.adCredits
            });
        }

        const ad = await Ad.create({
            userId: req.user._id,
            campaignName,
            title,
            description,
            image,
            videoUrl,
            destinationUrl,
            callToAction,
            targeting: targeting || {},
            budget,
            pricing: pricing || { type: 'cpm', amount: 20 },
            status: 'pending'
        });

        req.user.adCredits -= budget.total;
        await req.user.save();

        res.status(201).json({ success: true, ad });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/impression', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        const { shipmentId } = req.body;

        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        await ad.recordImpression();

        if (shipmentId) {
            const shipment = await Shipment.findById(shipmentId);
            if (shipment && shipment.adsEnabled) {
                const revenueShare = await User.findById(shipment.userId);
                const revenue = ad.pricing.type === 'cpm' ? (ad.pricing.amount / 1000) : 0;
                const wholesalerCut = revenue * revenueShare.getRevenueShare();
                
                await shipment.addRevenue(wholesalerCut);
            }
        }

        res.json({ success: true, impressions: ad.impressions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/click', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        const { shipmentId } = req.body;

        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        await ad.recordClick();

        if (shipmentId) {
            const shipment = await Shipment.findById(shipmentId);
            if (shipment) {
                await shipment.incrementClick();
            }
        }

        res.json({ success: true, clicks: ad.clicks, url: ad.destinationUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        let ad = await Ad.findById(req.params.id);

        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        if (ad.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { status, targeting, budget } = req.body;

        ad = await Ad.findByIdAndUpdate(
            req.params.id,
            { status, targeting, budget },
            { new: true, runValidators: true }
        );

        res.json({ success: true, ad });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);

        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        if (ad.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        ad.active = false;
        ad.status = 'paused';
        await ad.save();

        const refund = ad.budget.total - ad.budget.spent;
        if (refund > 0) {
            const user = await User.findById(req.user._id);
            user.adCredits += refund;
            await user.save();
        }

        res.json({ success: true, message: 'Ad paused', refund });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;