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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVoiceInput = processVoiceInput;
var logger_1 = require("../utils/logger");
// Keywords that trigger claim type detection
var CLAIM_KEYWORDS = {
    accident: ['accident', 'crash', 'collision', 'hit', 'vehicle', 'bike', 'car', 'truck'],
    medical: ['hospital', 'doctor', 'treatment', 'surgery', 'illness', 'disease', 'fever', 'pain'],
    pharmacy: ['medicine', 'pharmacy', 'drug', 'prescription', 'tablet', 'injection', 'syrup']
};
/**
 * Process voice input using Google Speech-to-Text API
 * This is a mock implementation - in production, integrate with @google-cloud/speech
 */
function processVoiceInput(audioBuffer, options) {
    return __awaiter(this, void 0, void 0, function () {
        var mockTranscripts, transcript, confidence, detectedKeywords, claimType, extractedClaimData;
        return __generator(this, function (_a) {
            try {
                logger_1.logger.info("Processing voice input - Language: ".concat(options.language, ", Format: ").concat(options.audioFormat));
                mockTranscripts = [
                    "I had an accident near the hospital yesterday and need to file a claim for vehicle damage",
                    "I went to the doctor for fever and have medical bills to claim",
                    "I bought medicines from pharmacy and want to submit the bills for reimbursement",
                    "There was a collision at the traffic signal and my bike got damaged",
                    "I was hospitalized for surgery and have all the medical documents"
                ];
                transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
                confidence = 0.85 + Math.random() * 0.1;
                detectedKeywords = extractKeywords(transcript);
                claimType = determineClaimType(detectedKeywords);
                extractedClaimData = extractClaimData(transcript, detectedKeywords, claimType);
                logger_1.logger.info("Voice processing completed - Transcript: \"".concat(transcript.substring(0, 50), "...\""));
                return [2 /*return*/, {
                        transcript: transcript,
                        keywords: detectedKeywords,
                        confidence: confidence,
                        detectedLanguage: options.language,
                        extractedClaimData: extractedClaimData
                    }];
            }
            catch (error) {
                logger_1.logger.error('Voice processing failed:', error);
                throw new Error('Voice processing failed');
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Extract relevant keywords from transcript
 */
function extractKeywords(transcript) {
    var words = transcript.toLowerCase().split(/\s+/);
    var keywords = [];
    // Check for claim-related keywords
    Object.values(CLAIM_KEYWORDS).flat().forEach(function (keyword) {
        if (words.some(function (word) { return word.includes(keyword) || keyword.includes(word); })) {
            keywords.push(keyword);
        }
    });
    // Extract specific entities (mock implementation)
    var entities = {
        locations: extractLocations(transcript),
        amounts: extractAmounts(transcript),
        dates: extractDates(transcript)
    };
    // Add extracted entities as keywords
    Object.values(entities).flat().forEach(function (entity) {
        if (entity)
            keywords.push(entity);
    });
    return __spreadArray([], new Set(keywords), true); // Remove duplicates
}
/**
 * Determine claim type based on detected keywords
 */
function determineClaimType(keywords) {
    var scores = {
        accident: 0,
        medical: 0,
        pharmacy: 0
    };
    keywords.forEach(function (keyword) {
        Object.entries(CLAIM_KEYWORDS).forEach(function (_a) {
            var type = _a[0], typeKeywords = _a[1];
            if (typeKeywords.includes(keyword)) {
                scores[type]++;
            }
        });
    });
    // Return the type with highest score
    return Object.entries(scores).reduce(function (a, b) { return scores[a[0]] > scores[b[0]] ? a : b; })[0];
}
/**
 * Extract structured claim data from transcript
 */
function extractClaimData(transcript, keywords, claimType) {
    var baseData = {
        claimType: claimType,
        severity: determineSeverity(transcript, keywords),
        extractedEntities: {
            locations: extractLocations(transcript),
            amounts: extractAmounts(transcript),
            dates: extractDates(transcript)
        }
    };
    // Add type-specific data
    switch (claimType) {
        case 'accident':
            return __assign(__assign({}, baseData), { vehicleType: extractVehicleType(transcript), damageType: extractDamageType(transcript) });
        case 'medical':
            return __assign(__assign({}, baseData), { treatmentType: extractTreatmentType(transcript), symptoms: extractSymptoms(transcript) });
        case 'pharmacy':
            return __assign(__assign({}, baseData), { medicineType: extractMedicineType(transcript) });
        default:
            return baseData;
    }
}
// Helper functions for entity extraction
function extractLocations(transcript) {
    var locationKeywords = ['hospital', 'clinic', 'pharmacy', 'road', 'street', 'near', 'at'];
    var words = transcript.split(/\s+/);
    var locations = [];
    words.forEach(function (word, index) {
        if (locationKeywords.includes(word.toLowerCase()) && index < words.length - 1) {
            locations.push(words[index + 1]);
        }
    });
    return locations;
}
function extractAmounts(transcript) {
    var amountRegex = /₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)/g;
    var matches = transcript.match(amountRegex);
    return matches || [];
}
function extractDates(transcript) {
    var dateKeywords = ['yesterday', 'today', 'last week', 'last month'];
    var words = transcript.toLowerCase().split(/\s+/);
    return dateKeywords.filter(function (keyword) { return words.includes(keyword); });
}
function determineSeverity(transcript, keywords) {
    var highSeverityWords = ['emergency', 'urgent', 'severe', 'critical', 'surgery', 'accident'];
    var lowSeverityWords = ['minor', 'small', 'light', 'routine'];
    var text = transcript.toLowerCase();
    if (highSeverityWords.some(function (word) { return text.includes(word); })) {
        return 'high';
    }
    else if (lowSeverityWords.some(function (word) { return text.includes(word); })) {
        return 'low';
    }
    return 'medium';
}
function extractVehicleType(transcript) {
    var vehicles = ['car', 'bike', 'motorcycle', 'truck', 'bus', 'auto', 'vehicle'];
    var text = transcript.toLowerCase();
    return vehicles.find(function (vehicle) { return text.includes(vehicle); }) || null;
}
function extractDamageType(transcript) {
    var damageTypes = ['scratch', 'dent', 'broken', 'damaged', 'collision', 'crash'];
    var text = transcript.toLowerCase();
    return damageTypes.find(function (damage) { return text.includes(damage); }) || null;
}
function extractTreatmentType(transcript) {
    var treatments = ['surgery', 'consultation', 'treatment', 'checkup', 'operation'];
    var text = transcript.toLowerCase();
    return treatments.find(function (treatment) { return text.includes(treatment); }) || null;
}
function extractSymptoms(transcript) {
    var symptoms = ['fever', 'pain', 'headache', 'cough', 'cold', 'injury'];
    var text = transcript.toLowerCase();
    return symptoms.filter(function (symptom) { return text.includes(symptom); });
}
function extractMedicineType(transcript) {
    var medicineTypes = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops'];
    var text = transcript.toLowerCase();
    return medicineTypes.find(function (medicine) { return text.includes(medicine); }) || null;
}
