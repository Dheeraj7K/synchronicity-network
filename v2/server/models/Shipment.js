const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        maxlength: 1000
    },
    product: {
        name: String,
        category: {
            type: String,
            enum: ['fashion', 'electronics', 'beauty', 'home', 'toys', 'food', 'other'],
            default: 'other'
        },
        image: String,
        price: Number,
        quantity: Number
    },
    origin: {
        city: String,
        country: String,
        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        lon: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },
    destination: {
        city: String,
        country: String,
        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        lon: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },
    status: {
        type: String,
        enum: ['pending', 'in_transit', 'delivered', 'canceled'],
        default: 'in_transit'
    },
    trackingNumber: String,
    carrier: String,
    estimatedArrival: Date,
    actualArrival: Date,
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    adsEnabled: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    adRevenue: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

shipmentSchema.index({ 'origin.lat': 1, 'origin.lon': 1 });
shipmentSchema.index({ 'destination.lat': 1, 'destination.lon': 1 });
shipmentSchema.index({ 'product.category': 1 });
shipmentSchema.index({ status: 1, active: 1 });

shipmentSchema.methods.incrementView = function() {
    this.views += 1;
    return this.save();
};

shipmentSchema.methods.incrementClick = function() {
    this.clicks += 1;
    return this.save();
};

shipmentSchema.methods.addRevenue = function(amount) {
    this.adRevenue += amount;
    return this.save();
};

module.exports = mongoose.model('Shipment', shipmentSchema);