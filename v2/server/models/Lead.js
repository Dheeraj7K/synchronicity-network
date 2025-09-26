const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    adId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ad',
        index: true
    },
    shipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        index: true
    },
    wholesalerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['wholesale_inquiry', 'product_interest', 'contact_request', 'quote_request'],
        required: true
    },
    contact: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        phone: String,
        company: String
    },
    message: {
        type: String,
        maxlength: 2000
    },
    productInterest: {
        category: String,
        quantity: Number,
        budget: Number
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
        default: 'new'
    },
    notes: [String],
    qualified: {
        type: Boolean,
        default: false
    },
    source: {
        type: String,
        enum: ['ad_click', 'shipment_view', 'direct'],
        required: true
    },
    ipAddress: String,
    userAgent: String,
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ 'contact.email': 1 });

leadSchema.methods.markQualified = function() {
    this.qualified = true;
    this.status = 'qualified';
    return this.save();
};

leadSchema.methods.addNote = function(note) {
    this.notes.push(note);
    return this.save();
};

module.exports = mongoose.model('Lead', leadSchema);