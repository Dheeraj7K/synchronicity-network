const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['wholesaler', 'seller', 'admin'],
        default: 'wholesaler'
    },
    plan: {
        type: String,
        enum: ['free', 'plus', 'pro', 'enterprise'],
        default: 'free'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: {
        type: String,
        enum: ['active', 'inactive', 'canceled', 'past_due'],
        default: 'inactive'
    },
    subscriptionEndDate: Date,
    adCredits: {
        type: Number,
        default: 0
    },
    company: String,
    phone: String,
    website: String,
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: Date
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.canCreateShipment = function() {
    if (this.plan === 'free') {
        return false;
    }
    return true;
};

userSchema.methods.canHostAds = function() {
    return ['plus', 'pro', 'enterprise'].includes(this.plan);
};

userSchema.methods.getRevenueShare = function() {
    const shares = {
        free: 0,
        plus: 0.70,
        pro: 0.80,
        enterprise: 0.85
    };
    return shares[this.plan] || 0;
};

module.exports = mongoose.model('User', userSchema);