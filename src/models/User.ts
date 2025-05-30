import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    phone: string;
    email?: string;
    name: string;
    policyNumber?: string;
    lastKnownLocation?: {
        lat: number;
        lng: number;
        timestamp: Date;
    };
    claimsThisMonth: number;
    totalClaims: number;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    phone: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        sparse: true
    },
    name: {
        type: String,
        required: true
    },
    policyNumber: {
        type: String,
        sparse: true
    },
    lastKnownLocation: {
        lat: Number,
        lng: Number,
        timestamp: Date
    },
    claimsThisMonth: {
        type: Number,
        default: 0
    },
    totalClaims: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);
