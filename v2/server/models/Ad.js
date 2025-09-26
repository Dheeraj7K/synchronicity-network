const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    campaignName: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    image: {
        type: String,
        required: true
    },
    videoUrl: String,
    destinationUrl: {
        type: String,
        required: true
    },
    callToAction: {
        type: String,
        enum: ['shop_now', 'learn_more', 'get_quote', 'contact_us', 'buy_wholesale'],
        default: 'shop_now'
    },
    targeting: {
        categories: [{
            type: String,
            enum: ['fashion', 'electronics', 'beauty', 'home', 'toys', 'food', 'other']
        }],
        countries: [String],
        regions: [String]
    },
    budget: {
        total: {
            type: Number,
            required: true,
            min: 20
        },
        spent: {
            type: Number,
            default: 0
        },
        daily: Number
    },
    pricing: {
        type: {
            type: String,
            enum: ['cpm', 'cpc'],
            default: 'cpm'
        },
        amount: Number
    },
    impressions: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    leads: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'paused', 'completed', 'rejected'],
        default: 'draft'
    },
    featured: {
        type: Boolean,
        default: false
    },
    startDate: Date,
    endDate: Date,
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

adSchema.index({ status: 1, active: 1 });
adSchema.index({ 'targeting.categories': 1 });
adSchema.index({ 'targeting.countries': 1 });

adSchema.methods.recordImpression = async function() {
    this.impressions += 1;
    const cost = this.pricing.type === 'cpm' ? (this.pricing.amount / 1000) : 0;
    this.budget.spent += cost;
    
    if (this.budget.spent >= this.budget.total) {
        this.status = 'completed';
        this.active = false;
    }
    
    return this.save();
};

adSchema.methods.recordClick = async function() {
    this.clicks += 1;
    const cost = this.pricing.type === 'cpc' ? this.pricing.amount : 0;
    this.budget.spent += cost;
    
    if (this.budget.spent >= this.budget.total) {
        this.status = 'completed';
        this.active = false;
    }
    
    return this.save();
};

adSchema.methods.recordLead = function() {
    this.leads += 1;
    return this.save();
};

adSchema.virtual('ctr').get(function() {
    return this.impressions > 0 ? (this.clicks / this.impressions * 100).toFixed(2) : 0;
});

adSchema.virtual('cpl').get(function() {
    return this.leads > 0 ? (this.budget.spent / this.leads).toFixed(2) : 0;
});

module.exports = mongoose.model('Ad', adSchema);