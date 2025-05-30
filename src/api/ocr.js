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
var multer_1 = require("multer");
var ocrService_1 = require("../services/ocrService");
var logger_1 = require("../utils/logger");
var router = express_1.default.Router();
// Configure multer for document uploads
var upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        var allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPG, PNG, and PDF files are allowed'));
        }
    }
});
/**
 * POST /api/v1/ocr/process-document
 * Process document using OCR with fallback mechanism
 */
router.post('/process-document', upload.single('document'), function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, documentType, _c, fallbackMethod, result, status_1, needsManualReview, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({
                            error: {
                                code: 'MISSING_DOCUMENT',
                                message: 'Document file is required'
                            }
                        })];
                }
                _a = req.body, _b = _a.documentType, documentType = _b === void 0 ? 'bill' : _b, _c = _a.fallbackMethod, fallbackMethod = _c === void 0 ? 'auto' : _c;
                logger_1.logger.info("Processing document - Type: ".concat(documentType, ", Size: ").concat(req.file.size, " bytes"));
                return [4 /*yield*/, (0, ocrService_1.processDocument)(req.file.buffer, {
                        documentType: documentType,
                        fallbackMethod: fallbackMethod,
                        fileName: req.file.originalname,
                        mimeType: req.file.mimetype
                    })];
            case 1:
                result = _d.sent();
                status_1 = 'success';
                needsManualReview = false;
                if (result.confidence < 0.5) {
                    status_1 = 'low_confidence';
                    needsManualReview = true;
                }
                else if (result.confidence < 0.7) {
                    status_1 = 'medium_confidence';
                }
                res.json({
                    status: status_1,
                    data: {
                        extractedData: result.extractedData,
                        confidence: result.confidence,
                        ocrMethod: result.method,
                        needsManualReview: needsManualReview,
                        fallbackSuggestion: needsManualReview ? 'manual_entry' : null,
                        structuredFields: result.structuredFields
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _d.sent();
                logger_1.logger.error('OCR processing error:', error_1);
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/v1/ocr/manual-fallback
 * Handle manual data entry when OCR fails
 */
router.post('/manual-fallback', function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, documentId, manualData, originalExtractedData, mergedData;
    return __generator(this, function (_b) {
        try {
            _a = req.body, documentId = _a.documentId, manualData = _a.manualData, originalExtractedData = _a.originalExtractedData;
            if (!manualData) {
                return [2 /*return*/, res.status(400).json({
                        error: {
                            code: 'MISSING_MANUAL_DATA',
                            message: 'Manual data is required'
                        }
                    })];
            }
            mergedData = __assign(__assign(__assign({}, originalExtractedData), manualData), { _meta: {
                    method: 'manual_override',
                    confidence: 1.0,
                    processedAt: new Date().toISOString(),
                    fallbackReason: 'ocr_low_confidence'
                } });
            logger_1.logger.info("Manual fallback processed for document: ".concat(documentId));
            res.json({
                status: 'success',
                data: {
                    extractedData: mergedData,
                    confidence: 1.0,
                    method: 'manual_override'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Manual fallback error:', error);
            next(error);
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/v1/ocr/supported-document-types
 * Get list of supported document types
 */
router.get('/supported-document-types', function (req, res) {
    var documentTypes = [
        {
            type: 'bill',
            name: 'Medical Bill',
            expectedFields: ['amount', 'date', 'hospitalName', 'patientName', 'diagnosis']
        },
        {
            type: 'prescription',
            name: 'Prescription',
            expectedFields: ['doctorName', 'medicines', 'date', 'patientName']
        },
        {
            type: 'accident_photo',
            name: 'Accident Photo',
            expectedFields: ['location', 'timestamp', 'vehicleNumber', 'damageDescription']
        },
        {
            type: 'other',
            name: 'Other Document',
            expectedFields: ['text', 'date']
        }
    ];
    res.json({
        status: 'success',
        data: {
            documentTypes: documentTypes
        }
    });
});
exports.default = router;
