"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Claim = void 0;
var mongoose_1 = require("mongoose");
var claimSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['medical', 'accident', 'pharmacy'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'FRAUD_REVIEW', 'MANUAL_REVIEW'],
        default: 'PENDING',
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    estimatedAmount: {
        type: Number,
        min: 0
    },
    description: {
        type: String,
        maxlength: 2000
    },
    voiceData: {
        transcript: String,
        keywords: [String],
        language: String,
        confidence: Number
    },
    documents: [{
            url: String,
            type: {
                type: String,
                enum: ['bill', 'prescription', 'accident_photo', 'other']
            },
            extractedData: {
                type: Map,
                of: mongoose_1.Schema.Types.Mixed
            },
            confidence: Number,
            ocrMethod: {
                type: String,
                enum: ['tesseract', 'google_vision', 'manual']
            }
        }],
    claimDetails: {
        items: [{
                description: String,
                amount: Number,
                category: String
            }],
        location: {
            lat: Number,
            lng: Number,
            address: String
        },
        incidentDate: {
            type: Date,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high']
        }
    },
    simulation: {
        approvedAmount: Number,
        gaps: [String],
        rulesTriggered: [String],
        fraudScore: Number,
        autoApproved: Boolean
    },
    escalation: {
        requestedAt: Date,
        confirmedAt: Date,
        agentAssigned: String,
        confirmationLevel: {
            type: Number,
            min: 1,
            max: 3
        },
        transferReason: String
    },
    escalationHistory: [{
            timestamp: {
                type: Date,
                default: Date.now
            },
            level: {
                type: Number,
                min: 1,
                max: 3
            },
            reason: String,
            agent: String
        }],
    processingSteps: [{
            step: String,
            completedAt: Date,
            success: Boolean,
            details: mongoose_1.Schema.Types.Mixed
        }],
    expiresAt: {
        type: Date,
        default: function () { return new Date(Date.now() + 72 * 60 * 60 * 1000); }, // 72 hours
        expires: 0
    }
}, {
    timestamps: true
});
// Indexes for performance
claimSchema.index({ user: 1, createdAt: -1 });
claimSchema.index({ status: 1, createdAt: -1 });
claimSchema.index({ 'simulation.fraudScore': -1 });
exports.Claim = mongoose_1.default.model('Claim', claimSchema);
