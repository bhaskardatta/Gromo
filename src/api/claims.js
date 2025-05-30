"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var Claim_1 = require("../models/Claim");
var User_1 = require("../models/User");
var logger_1 = require("../utils/logger");
var router = express_1.default.Router();
/**
 * POST /api/v1/claims
 * Create a new claim
 */
router.post('/', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userPhone, type, amount, claimDetails, voiceData, documents, user, claim, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, userPhone = _a.userPhone, type = _a.type, amount = _a.amount, claimDetails = _a.claimDetails, voiceData = _a.voiceData, documents = _a.documents;
                return [4 /*yield*/, User_1.User.findOne({ phone: userPhone })];
            case 1:
                user = _b.sent();
                if (!!user) return [3 /*break*/, 3];
                user = new User_1.User({
                    phone: userPhone,
                    name: req.body.userName || 'Unknown User',
                    claimsThisMonth: 0,
                    totalClaims: 0
                });
                return [4 /*yield*/, user.save()];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                claim = new Claim_1.Claim({
                    user: user._id,
                    type: type,
                    amount: amount,
                    claimDetails: claimDetails,
                    voiceData: voiceData,
                    documents: documents || [],
                    processingSteps: [{
                            step: 'claim_initiated',
                            completedAt: new Date(),
                            success: true,
                            details: { source: 'api' }
                        }]
                });
                return [4 /*yield*/, claim.save()];
            case 4:
                _b.sent();
                // Update user statistics
                user.claimsThisMonth += 1;
                user.totalClaims += 1;
                return [4 /*yield*/, user.save()];
            case 5:
                _b.sent();
                logger_1.logger.info("New claim created: ".concat(claim._id, " for user: ").concat(user.phone));
                res.status(201).json({
                    status: 'success',
                    data: {
                        claimId: claim._id,
                        status: claim.status,
                        amount: claim.amount,
                        type: claim.type,
                        expiresAt: claim.expiresAt
                    }
                });
                return [3 /*break*/, 7];
            case 6:
                error_1 = _b.sent();
                logger_1.logger.error('Claim creation error:', error_1);
                next(error_1);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/v1/claims/:claimId
 * Get claim details
 */
router.get('/:claimId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var claim, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Claim_1.Claim.findById(req.params.claimId)
                        .populate('user', 'name phone')
                        .lean()];
            case 1:
                claim = _a.sent();
                if (!claim) {
                    return [2 /*return*/, res.status(404).json({
                            error: {
                                code: 'CLAIM_NOT_FOUND',
                                message: 'Claim not found'
                            }
                        })];
                }
                res.json({
                    status: 'success',
                    data: claim
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_1.logger.error('Claim retrieval error:', error_2);
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * PUT /api/v1/claims/:claimId
 * Update claim details
 */
router.put('/:claimId', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, claimDetails, documents, additionalData, claim, error_3;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                _a = req.body, claimDetails = _a.claimDetails, documents = _a.documents, additionalData = _a.additionalData;
                return [4 /*yield*/, Claim_1.Claim.findById(req.params.claimId)];
            case 1:
                claim = _c.sent();
                if (!claim) {
                    return [2 /*return*/, res.status(404).json({
                            error: {
                                code: 'CLAIM_NOT_FOUND',
                                message: 'Claim not found'
                            }
                        })];
                }
                // Update claim fields
                if (claimDetails) {
                    claim.claimDetails = __assign(__assign({}, claim.claimDetails), claimDetails);
                }
                if (documents) {
                    (_b = claim.documents).push.apply(_b, documents);
                }
                // Add processing step
                claim.processingSteps.push({
                    step: 'claim_updated',
                    completedAt: new Date(),
                    success: true,
                    details: additionalData || {}
                });
                return [4 /*yield*/, claim.save()];
            case 2:
                _c.sent();
                logger_1.logger.info("Claim updated: ".concat(claim._id));
                res.json({
                    status: 'success',
                    data: {
                        claimId: claim._id,
                        status: claim.status,
                        lastUpdated: claim.updatedAt
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _c.sent();
                logger_1.logger.error('Claim update error:', error_3);
                next(error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/v1/claims/user/:userPhone
 * Get all claims for a user
 */
router.get('/user/:userPhone', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, claims, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, User_1.User.findOne({ phone: req.params.userPhone })];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({
                            error: {
                                code: 'USER_NOT_FOUND',
                                message: 'User not found'
                            }
                        })];
                }
                return [4 /*yield*/, Claim_1.Claim.find({ user: user._id })
                        .sort({ createdAt: -1 })
                        .select('_id type status amount claimDetails.incidentDate createdAt')
                        .lean()];
            case 2:
                claims = _a.sent();
                res.json({
                    status: 'success',
                    data: {
                        user: {
                            phone: user.phone,
                            name: user.name,
                            totalClaims: user.totalClaims,
                            claimsThisMonth: user.claimsThisMonth
                        },
                        claims: claims
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                logger_1.logger.error('User claims retrieval error:', error_4);
                next(error_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
