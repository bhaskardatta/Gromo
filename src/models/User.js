"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
var mongoose_1 = require("mongoose");
var userSchema = new mongoose_1.Schema({
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
exports.User = mongoose_1.default.model('User', userSchema);
