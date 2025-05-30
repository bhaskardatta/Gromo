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
exports.processDocument = processDocument;
var logger_1 = require("../utils/logger");
/**
 * Process document using OCR with 3-step fallback mechanism
 */
function processDocument(documentBuffer, options) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_1, error_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    logger_1.logger.info("Processing document - Type: ".concat(options.documentType, ", Size: ").concat(documentBuffer.length, " bytes"));
                    result = void 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, processTesseract(documentBuffer, options)];
                case 2:
                    result = _a.sent();
                    if (result.confidence >= 0.7) {
                        logger_1.logger.info('Tesseract OCR successful with high confidence');
                        return [2 /*return*/, result];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    logger_1.logger.warn('Tesseract OCR failed, falling back to Google Vision');
                    return [3 /*break*/, 4];
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, processGoogleVision(documentBuffer, options)];
                case 5:
                    result = _a.sent();
                    if (result.confidence >= 0.5) {
                        logger_1.logger.info('Google Vision OCR successful');
                        return [2 /*return*/, result];
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    logger_1.logger.warn('Google Vision OCR failed, triggering manual fallback');
                    return [3 /*break*/, 7];
                case 7: return [4 /*yield*/, generateManualFallback(documentBuffer, options)];
                case 8:
                    // Step 3: Return partial data for manual fallback
                    result = _a.sent();
                    logger_1.logger.info('OCR fallback completed, manual entry required');
                    return [2 /*return*/, result];
                case 9:
                    error_3 = _a.sent();
                    logger_1.logger.error('OCR processing failed:', error_3);
                    throw new Error('Document processing failed');
                case 10: return [2 /*return*/];
            }
        });
    });
}
/**
 * Process using Tesseract.js
 */
function processTesseract(documentBuffer, options) {
    return __awaiter(this, void 0, void 0, function () {
        var mockExtractedText, confidence, structuredFields;
        return __generator(this, function (_a) {
            mockExtractedText = generateMockExtractedText(options.documentType);
            confidence = 0.6 + Math.random() * 0.3;
            structuredFields = extractStructuredFields(mockExtractedText, options.documentType);
            return [2 /*return*/, {
                    extractedData: __assign({ rawText: mockExtractedText }, structuredFields),
                    confidence: confidence,
                    method: 'tesseract',
                    structuredFields: structuredFields
                }];
        });
    });
}
/**
 * Process using Google Vision API
 */
function processGoogleVision(documentBuffer, options) {
    return __awaiter(this, void 0, void 0, function () {
        var mockExtractedText, confidence, structuredFields;
        return __generator(this, function (_a) {
            mockExtractedText = generateMockExtractedText(options.documentType, true);
            confidence = 0.8 + Math.random() * 0.15;
            structuredFields = extractStructuredFields(mockExtractedText, options.documentType);
            return [2 /*return*/, {
                    extractedData: __assign(__assign({ rawText: mockExtractedText }, structuredFields), { boundingBoxes: generateMockBoundingBoxes(structuredFields) }),
                    confidence: confidence,
                    method: 'google_vision',
                    structuredFields: structuredFields
                }];
        });
    });
}
/**
 * Generate manual fallback data
 */
function generateManualFallback(documentBuffer, options) {
    return __awaiter(this, void 0, void 0, function () {
        var emptyFields;
        return __generator(this, function (_a) {
            emptyFields = getDocumentFieldsTemplate(options.documentType);
            return [2 /*return*/, {
                    extractedData: __assign(__assign({ rawText: '' }, emptyFields), { _needsManualEntry: true }),
                    confidence: 0.0,
                    method: 'manual',
                    structuredFields: emptyFields
                }];
        });
    });
}
/**
 * Generate mock extracted text based on document type
 */
function generateMockExtractedText(documentType, highQuality) {
    if (highQuality === void 0) { highQuality = false; }
    var templates = {
        bill: highQuality ?
            "APOLLO HOSPITALS\n            Medical Bill\n            Date: 15/03/2024\n            Patient: John Doe\n            Bill No: AH2024001\n            \n            Consultation Fee: \u20B9800\n            Lab Tests: \u20B92,400\n            Medicines: \u20B91,200\n            \n            Total Amount: \u20B94,400\n            \n            Diagnosis: Fever, Viral Infection\n            Doctor: Dr. Smith Kumar" :
            "APOLLO HOSPITALS\n            Medical Bill\n            Date: 15/03/2024\n            Patient: J0hn D0e\n            \n            Consultation: 800\n            Tests: 2400\n            Total: 4400",
        prescription: highQuality ?
            "Dr. Rajesh Sharma MBBS, MD\n            City Medical Center\n            \n            Date: 16/03/2024\n            Patient: Jane Smith\n            Age: 35\n            \n            Rx:\n            1. Paracetamol 500mg - 2 times daily x 5 days\n            2. Azithromycin 250mg - 1 daily x 3 days\n            3. Cough Syrup - 10ml twice daily\n            \n            Follow up after 1 week" :
            "Dr. Rajesh Sharma\n            \n            Date: 16/03/2024\n            Patient: Jane Smith\n            \n            Paracetamol 500mg\n            Azithromycin 250mg",
        accident_photo: highQuality ?
            "Accident Report\n            Location: MG Road, Bangalore\n            Date: 14/03/2024\n            Time: 2:30 PM\n            \n            Vehicle 1: KA 01 AB 1234 (Bike)\n            Vehicle 2: KA 05 CD 5678 (Car)\n            \n            Damage: Front bumper dent, headlight broken\n            Weather: Clear\n            \n            Police Report: Filed" :
            "Accident\n            MG Road\n            14/03/2024\n            \n            KA 01 AB 1234\n            Front damage",
        other: 'Document contains text that needs manual review'
    };
    return templates[documentType] || templates.other;
}
/**
 * Extract structured fields from text based on document type
 */
function extractStructuredFields(text, documentType) {
    var fields = {};
    switch (documentType) {
        case 'bill':
            fields.amount = extractAmount(text);
            fields.date = extractDate(text);
            fields.hospitalName = extractHospitalName(text);
            fields.patientName = extractPatientName(text);
            fields.billNumber = extractBillNumber(text);
            fields.diagnosis = extractDiagnosis(text);
            fields.items = extractBillItems(text);
            break;
        case 'prescription':
            fields.doctorName = extractDoctorName(text);
            fields.date = extractDate(text);
            fields.patientName = extractPatientName(text);
            fields.medicines = extractMedicines(text);
            fields.instructions = extractInstructions(text);
            break;
        case 'accident_photo':
            fields.location = extractLocation(text);
            fields.date = extractDate(text);
            fields.vehicleNumbers = extractVehicleNumbers(text);
            fields.damageDescription = extractDamageDescription(text);
            break;
    }
    return fields;
}
/**
 * Get empty template for manual entry
 */
function getDocumentFieldsTemplate(documentType) {
    var templates = {
        bill: {
            amount: null,
            date: null,
            hospitalName: null,
            patientName: null,
            billNumber: null,
            diagnosis: null,
            items: []
        },
        prescription: {
            doctorName: null,
            date: null,
            patientName: null,
            medicines: [],
            instructions: null
        },
        accident_photo: {
            location: null,
            date: null,
            vehicleNumbers: [],
            damageDescription: null
        },
        other: {
            text: null,
            date: null
        }
    };
    return templates[documentType] || templates.other;
}
// Field extraction helper functions
function extractAmount(text) {
    var amountMatches = text.match(/(?:Total|Amount|₹)\s*:?\s*₹?\s*([0-9,]+)/i);
    if (amountMatches) {
        return parseInt(amountMatches[1].replace(/,/g, ''));
    }
    return null;
}
function extractDate(text) {
    var dateMatches = text.match(/(?:Date|Date:)\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/);
    return dateMatches ? dateMatches[1] : null;
}
function extractHospitalName(text) {
    var lines = text.split('\n');
    // Usually hospital name is in the first few lines
    for (var _i = 0, _a = lines.slice(0, 3); _i < _a.length; _i++) {
        var line = _a[_i];
        if (line.trim() && !line.includes('Bill') && !line.includes('Date')) {
            return line.trim();
        }
    }
    return null;
}
function extractPatientName(text) {
    var nameMatches = text.match(/(?:Patient|Name)\s*:?\s*([A-Za-z\s]+)/i);
    return nameMatches ? nameMatches[1].trim() : null;
}
function extractBillNumber(text) {
    var billMatches = text.match(/(?:Bill|Receipt|Invoice)\s*(?:No|Number)?\s*:?\s*([A-Z0-9]+)/i);
    return billMatches ? billMatches[1] : null;
}
function extractDiagnosis(text) {
    var diagnosisMatches = text.match(/(?:Diagnosis|Condition)\s*:?\s*([A-Za-z\s,]+)/i);
    return diagnosisMatches ? diagnosisMatches[1].trim() : null;
}
function extractBillItems(text) {
    var items = [];
    var lines = text.split('\n');
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var itemMatch = line.match(/([A-Za-z\s]+)\s*:?\s*₹?\s*([0-9,]+)/);
        if (itemMatch && !line.includes('Total') && !line.includes('Date')) {
            items.push({
                description: itemMatch[1].trim(),
                amount: parseInt(itemMatch[2].replace(/,/g, ''))
            });
        }
    }
    return items;
}
function extractDoctorName(text) {
    var doctorMatches = text.match(/Dr\.\s*([A-Za-z\s]+)/i);
    return doctorMatches ? doctorMatches[1].trim() : null;
}
function extractMedicines(text) {
    var medicines = [];
    var lines = text.split('\n');
    for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
        var line = lines_2[_i];
        var medicineMatch = line.match(/\d+\.\s*([A-Za-z\s]+(?:\d+mg)?)\s*-?\s*(.*)/);
        if (medicineMatch) {
            medicines.push({
                name: medicineMatch[1].trim(),
                instructions: medicineMatch[2].trim()
            });
        }
    }
    return medicines;
}
function extractInstructions(text) {
    var instructionMatches = text.match(/(?:Follow up|Instructions)\s*:?\s*([A-Za-z\s]+)/i);
    return instructionMatches ? instructionMatches[1].trim() : null;
}
function extractLocation(text) {
    var locationMatches = text.match(/(?:Location|Place)\s*:?\s*([A-Za-z\s,]+)/i);
    return locationMatches ? locationMatches[1].trim() : null;
}
function extractVehicleNumbers(text) {
    var vehicleMatches = text.match(/[A-Z]{2}\s*\d{2}\s*[A-Z]{2}\s*\d{4}/g);
    return vehicleMatches || [];
}
function extractDamageDescription(text) {
    var damageMatches = text.match(/(?:Damage|Description)\s*:?\s*([A-Za-z\s,]+)/i);
    return damageMatches ? damageMatches[1].trim() : null;
}
function generateMockBoundingBoxes(fields) {
    // Mock bounding box coordinates for Google Vision API response
    var boxes = {};
    Object.keys(fields).forEach(function (field, index) {
        boxes[field] = {
            x: 100 + (index * 50),
            y: 100 + (index * 30),
            width: 200,
            height: 25
        };
    });
    return boxes;
}
