import mongoose, { Schema, Document } from 'mongoose';

export interface IClaim extends Document {
    user: mongoose.Types.ObjectId;
    type: 'medical' | 'accident' | 'pharmacy';
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FRAUD_REVIEW' | 'MANUAL_REVIEW';
    amount: number;
    estimatedAmount?: number;
    description?: string;
    
    // Voice processing data
    voiceData?: {
        transcript: string;
        keywords: string[];
        language: string;
        confidence: number;
    };
    
    // OCR processed documents
    documents: Array<{
        url: string;
        type: 'bill' | 'prescription' | 'accident_photo' | 'other';
        extractedData: Map<string, any>;
        confidence: number;
        ocrMethod: 'tesseract' | 'google_vision' | 'manual';
    }>;
    
    // Form data
    claimDetails: {
        items?: Array<{
            description: string;
            amount: number;
            category: string;
        }>;
        location?: {
            lat: number;
            lng: number;
            address: string;
        };
        incidentDate: Date;
        description: string;
        severity?: 'low' | 'medium' | 'high';
    };
    
    // Fraud detection simulation
    simulation?: {
        approvedAmount: number;
        gaps: string[];
        rulesTriggered: string[];
        fraudScore: number;
        autoApproved: boolean;
    };
    
    // Agent escalation tracking
    escalation?: {
        requestedAt: Date;
        confirmedAt?: Date;
        agentAssigned?: string;
        confirmationLevel: number; // 1, 2, or 3
        transferReason: string;
    };
    
    // Escalation history for tracking multiple escalations
    escalationHistory?: Array<{
        timestamp: Date;
        level: number;
        reason: string;
        agent?: string;
    }>;
    
    // Processing metadata
    processingSteps: Array<{
        step: string;
        completedAt: Date;
        success: boolean;
        details?: any;
    }>;
    
    expiresAt: Date; // 72h TTL
    createdAt: Date;
    updatedAt: Date;
}

const claimSchema = new Schema<IClaim>({
    user: {
        type: Schema.Types.ObjectId,
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
            of: Schema.Types.Mixed
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
        details: Schema.Types.Mixed
    }],
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        expires: 0
    }
}, {
    timestamps: true
});

// Indexes for performance
claimSchema.index({ user: 1, createdAt: -1 });
claimSchema.index({ status: 1, createdAt: -1 });
claimSchema.index({ 'simulation.fraudScore': -1 });

export const Claim = mongoose.model<IClaim>('Claim', claimSchema);
