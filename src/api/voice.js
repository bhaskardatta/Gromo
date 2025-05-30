"use strict";
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
var voiceService_1 = require("../services/voiceService");
var logger_1 = require("../utils/logger");
var router = express_1.default.Router();
// Configure multer for audio file uploads
var upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});
/**
 * POST /api/v1/voice/process
 * Process voice input for claim initiation
 */
router.post('/process', upload.single('audio'), function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, language, result, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({
                            error: {
                                code: 'MISSING_AUDIO',
                                message: 'Audio file is required'
                            }
                        })];
                }
                _a = req.body.language, language = _a === void 0 ? 'en-IN' : _a;
                logger_1.logger.info("Processing voice input - Language: ".concat(language, ", Size: ").concat(req.file.size, " bytes"));
                return [4 /*yield*/, (0, voiceService_1.processVoiceInput)(req.file.buffer, {
                        language: language,
                        audioFormat: req.file.mimetype
                    })];
            case 1:
                result = _b.sent();
                res.json({
                    status: 'success',
                    data: {
                        transcript: result.transcript,
                        keywords: result.keywords,
                        confidence: result.confidence,
                        language: result.detectedLanguage,
                        formData: result.extractedClaimData
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                logger_1.logger.error('Voice processing error:', error_1);
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/v1/voice/supported-languages
 * Get list of supported languages for voice input
 */
router.get('/supported-languages', function (req, res) {
    var supportedLanguages = [
        { code: 'en-IN', name: 'English (India)' },
        { code: 'hi-IN', name: 'Hindi' },
        { code: 'ta-IN', name: 'Tamil' },
        { code: 'te-IN', name: 'Telugu' },
        { code: 'kn-IN', name: 'Kannada' },
        { code: 'ml-IN', name: 'Malayalam' },
        { code: 'mr-IN', name: 'Marathi' },
        { code: 'gu-IN', name: 'Gujarati' },
        { code: 'bn-IN', name: 'Bengali' },
        { code: 'pa-IN', name: 'Punjabi' }
    ];
    res.json({
        status: 'success',
        data: {
            languages: supportedLanguages
        }
    });
});
exports.default = router;
