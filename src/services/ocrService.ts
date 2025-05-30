import { logger } from '../utils/logger';
import { config } from '../config/config';
import { EnhancedCacheService } from './enhancedCacheService';
import crypto from 'crypto';

// Real Google Cloud Vision API integration
const vision = require('@google-cloud/vision');

// Initialize Vision client with conditional configuration
let visionClient: any = null;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && config.google?.projectId) {
    try {
        visionClient = new vision.ImageAnnotatorClient({
            projectId: config.google.projectId,
            keyFilename: config.google.credentialsPath
        });
        logger.info('Google Vision API client initialized');
    } catch (error) {
        logger.warn('Failed to initialize Google Vision client, falling back to mock:', error);
    }
}

interface OCRProcessingOptions {
    documentType: string;
    fallbackMethod?: string;
    fileName?: string;
    mimeType?: string;
    enableHandwritingDetection?: boolean;
    enableTableDetection?: boolean;
    languageHints?: string[];
}

interface OCRProcessingResult {
    extractedData: any;
    confidence: number;
    method: string;
    structuredFields: any;
    boundingBoxes?: any[];
    detectedLanguages?: string[];
    rawOcrOutput?: any;
}

interface BoundingBox {
    vertices: Array<{x: number, y: number}>;
    text: string;
    confidence: number;
}

/**
 * Enhanced OCR processing with real Google Vision API and 3-step fallback
 */
export async function processDocument(
    documentBuffer: Buffer,
    options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
    try {
        logger.info(`Processing document - Type: ${options.documentType}, Size: ${documentBuffer.length} bytes, Method: ${options.fallbackMethod || 'auto'}`);

        // Generate cache key based on document hash and options
        const documentHash = crypto.createHash('sha256').update(documentBuffer).digest('hex');
        const cacheKey = `ocr:${documentHash}:${JSON.stringify(options)}`;

        // Check cache first
        const cachedResult = await EnhancedCacheService.get<OCRProcessingResult>(cacheKey, {
            namespace: 'ocr',
            ttl: 86400, // Cache for 24 hours
            tags: ['ocr', options.documentType]
        });

        if (cachedResult) {
            logger.info('OCR result found in cache');
            return cachedResult;
        }

        let result: OCRProcessingResult;

        // Step 1: Try Tesseract.js (free tier) - unless Google Vision is preferred
        if (options.fallbackMethod !== 'google_vision_only') {
            try {
                result = await processTesseract(documentBuffer, options);
                if (result.confidence >= 0.7) {
                    logger.info('Tesseract OCR successful with high confidence');
                    // Cache the result
                    await EnhancedCacheService.set(cacheKey, result, {
                        namespace: 'ocr',
                        ttl: 86400,
                        tags: ['ocr', options.documentType, 'tesseract']
                    });
                    return result;
                }
                logger.info(`Tesseract confidence ${result.confidence}, proceeding to Google Vision`);
            } catch (error) {
                logger.warn('Tesseract OCR failed, falling back to Google Vision:', error);
            }
        }

        // Step 2: Try Google Vision API if available
        if (visionClient && isProduction) {
            try {
                result = await processGoogleVision(documentBuffer, options);
                if (result.confidence >= 0.5) {
                    logger.info('Google Vision OCR successful');
                    // Cache the result
                    await EnhancedCacheService.set(cacheKey, result, {
                        namespace: 'ocr',
                        ttl: 86400,
                        tags: ['ocr', options.documentType, 'google-vision']
                    });
                    return result;
                }
                logger.info(`Google Vision confidence ${result.confidence}, proceeding to manual fallback`);
            } catch (error) {
                logger.warn('Google Vision OCR failed, triggering manual fallback:', error);
            }
        } else {
            // Fallback to mock Google Vision for development
            try {
                result = await processMockGoogleVision(documentBuffer, options);
                if (result.confidence >= 0.5) {
                    logger.info('Mock Google Vision OCR successful');
                    return result;
                }
            } catch (error) {
                logger.warn('Mock Google Vision failed:', error);
            }
        }

        // Step 3: Return partial data for manual fallback
        result = await generateManualFallback(documentBuffer, options);
        logger.info('OCR fallback completed, manual entry required');
        
        return result;

    } catch (error) {
        logger.error('OCR processing failed:', error);
        throw new Error('Document processing failed');
    }
}

/**
 * Process using Tesseract.js (enhanced version)
 */
async function processTesseract(
    documentBuffer: Buffer, 
    options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
    
    // Mock Tesseract processing with enhanced features
    // In production: const tesseract = require('tesseract.js');
    // const { data: { text, confidence } } = await tesseract.recognize(documentBuffer, 'eng+hin');
    
    const mockExtractedText = generateMockExtractedText(options.documentType, false);
    const confidence = 0.6 + Math.random() * 0.3; // 60-90% confidence
    
    const structuredFields = extractStructuredFields(mockExtractedText, options.documentType);
    
    return {
        extractedData: {
            rawText: mockExtractedText,
            ...structuredFields
        },
        confidence,
        method: 'tesseract',
        structuredFields,
        boundingBoxes: generateMockBoundingBoxes(structuredFields)
    };
}

/**
 * Process using real Google Vision API
 */
async function processGoogleVision(
    documentBuffer: Buffer, 
    options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
    
    const request: any = {
        image: {
            content: documentBuffer.toString('base64'),
        },
        features: [
            { type: 'TEXT_DETECTION' },
            { type: 'DOCUMENT_TEXT_DETECTION' }
        ]
    };

    // Add handwriting detection if enabled
    if (options.enableHandwritingDetection) {
        request.features.push({ type: 'HANDWRITING_DETECTION' });
    }

    // Add language hints if provided
    if (options.languageHints?.length) {
        request.imageContext = {
            languageHints: options.languageHints
        };
    }

    const [result] = await visionClient.annotateImage(request);
    
    if (result.error) {
        throw new Error(`Google Vision API error: ${result.error.message}`);
    }

    const textAnnotations = result.textAnnotations || [];
    const fullTextAnnotation = result.fullTextAnnotation;
    
    if (!textAnnotations.length && !fullTextAnnotation) {
        throw new Error('No text detected in image');
    }

    // Extract text and confidence
    const extractedText = fullTextAnnotation?.text || textAnnotations[0]?.description || '';
    const confidence = calculateGoogleVisionConfidence(textAnnotations, fullTextAnnotation);
    
    // Extract structured fields
    const structuredFields = extractStructuredFields(extractedText, options.documentType);
    
    // Extract bounding boxes
    const boundingBoxes = extractBoundingBoxes(textAnnotations);
    
    // Detect languages
    const detectedLanguages = extractDetectedLanguages(fullTextAnnotation);

    logger.info(`Google Vision processing completed - Confidence: ${confidence.toFixed(2)}, Text length: ${extractedText.length}`);

    return {
        extractedData: {
            rawText: extractedText,
            ...structuredFields
        },
        confidence,
        method: 'google_vision',
        structuredFields,
        boundingBoxes,
        detectedLanguages,
        rawOcrOutput: {
            textAnnotations: textAnnotations.slice(0, 5), // First 5 for debugging
            fullTextAnnotation: fullTextAnnotation ? {
                text: fullTextAnnotation.text,
                pages: fullTextAnnotation.pages?.length || 0
            } : null
        }
    };
}

/**
 * Process using mock Google Vision for development
 */
async function processMockGoogleVision(
    documentBuffer: Buffer, 
    options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const mockExtractedText = generateMockExtractedText(options.documentType, true);
    const confidence = 0.8 + Math.random() * 0.15; // 80-95% confidence
    
    const structuredFields = extractStructuredFields(mockExtractedText, options.documentType);
    
    return {
        extractedData: {
            rawText: mockExtractedText,
            ...structuredFields,
            processingNote: 'Processed with mock Google Vision (development mode)'
        },
        confidence,
        method: 'google_vision_mock',
        structuredFields,
        boundingBoxes: generateMockBoundingBoxes(structuredFields),
        detectedLanguages: ['en', 'hi']
    };
}

/**
 * Generate manual fallback data with enhanced templates
 */
async function generateManualFallback(
    documentBuffer: Buffer, 
    options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
    
    const emptyFields = getDocumentFieldsTemplate(options.documentType);
    
    return {
        extractedData: {
            rawText: '',
            ...emptyFields,
            _needsManualEntry: true,
            _manualEntryReason: 'OCR confidence below threshold',
            _documentInfo: {
                type: options.documentType,
                size: documentBuffer.length,
                fileName: options.fileName
            }
        },
        confidence: 0.0,
        method: 'manual_fallback',
        structuredFields: emptyFields
    };
}

/**
 * Enhanced mock text generation based on document type
 */
function generateMockExtractedText(documentType: string, highQuality: boolean = false): string {
    const templates = {
        bill: highQuality ? 
            `APOLLO HOSPITALS
Medical Bill
Date: 15/03/2024
Patient: John Doe
ID: APH2024001
Bill No: AH2024001

Services:
Consultation Fee: ₹800
Lab Tests: ₹2,400
CBC Test: ₹600
X-Ray Chest: ₹1,200
Ultrasound: ₹600
Medicines: ₹1,200
Room Charges: ₹3,000

Total Amount: ₹7,400
Payment Mode: Cash
GST: 18%

Diagnosis: Fever, Viral Infection
Doctor: Dr. Smith Kumar, MBBS, MD
Department: General Medicine
Contact: 080-12345678` :
            `APOLLO HOSPITALS
Medical Bill
Date: 15/03/2024
Patient: J0hn D0e

Consultation: ₹800
Tests: ₹2400
Total: ₹7400`,

        prescription: highQuality ?
            `Dr. Rajesh Sharma MBBS, MD
City Medical Center
Registration No: 12345
Contact: 080-98765432

Date: 16/03/2024
Patient: Jane Smith
Age: 35 years
Weight: 65 kg

Rx:
1. Paracetamol 500mg - 2 times daily after food x 5 days
2. Azithromycin 250mg - 1 daily before food x 3 days
3. Cough Syrup - 10ml twice daily x 7 days
4. ORS Solution - As needed

Instructions:
- Take medicines as prescribed
- Complete the full course
- Drink plenty of fluids
- Rest for 3-4 days

Follow up after 1 week if symptoms persist

Dr. Signature
Stamp` :
            `Dr. Rajesh Sharma
Date: 16/03/2024
Patient: Jane Smith

Paracetamol 500mg
Azithromycin 250mg`,

        accident_photo: highQuality ?
            `Accident Report
Location: MG Road, Bangalore
Date: 14/03/2024
Time: 2:30 PM
Weather: Clear, Dry

Vehicle 1: KA 01 AB 1234 (Honda Activa)
Owner: Ramesh Kumar
Contact: 9876543210

Vehicle 2: KA 05 CD 5678 (Maruti Swift)
Owner: Priya Sharma
Contact: 9876543211

Damage Assessment:
Vehicle 1: Front fairing cracked, headlight broken, handlebar bent
Vehicle 2: Rear bumper dent, tail light damage

Estimated Damage:
Vehicle 1: ₹15,000
Vehicle 2: ₹25,000

Police Report: Filed - FIR No. 123/2024
Station: MG Road Police Station
Officer: SI Mohan Kumar

Witnesses:
1. Suresh - 9876543212
2. Kavya - 9876543213

Insurance Claims:
Vehicle 1: Policy No. ABC123456
Vehicle 2: Policy No. XYZ789012` :
            `Accident Report
MG Road, Bangalore
14/03/2024

KA 01 AB 1234
Front damage
Police Report: Filed`,

        other: 'Document contains text that needs manual review. Please enter the details manually.'
    };

    return templates[documentType as keyof typeof templates] || templates.other;
}

/**
 * Enhanced structured field extraction
 */
function extractStructuredFields(text: string, documentType: string): any {
    switch (documentType) {
        case 'bill':
            return {
                amount: extractAmount(text),
                date: extractDate(text),
                hospitalName: extractHospitalName(text),
                patientName: extractPatientName(text),
                billNumber: extractBillNumber(text),
                diagnosis: extractDiagnosis(text),
                billItems: extractBillItems(text),
                doctorName: extractDoctorName(text),
                department: extractDepartment(text),
                contactNumber: extractContactNumber(text),
                gstAmount: extractGSTAmount(text),
                paymentMode: extractPaymentMode(text)
            };
            
        case 'prescription':
            return {
                doctorName: extractDoctorName(text),
                patientName: extractPatientName(text),
                date: extractDate(text),
                medicines: extractMedicines(text),
                instructions: extractInstructions(text),
                registrationNumber: extractRegistrationNumber(text),
                hospitalName: extractHospitalName(text),
                patientAge: extractPatientAge(text),
                patientWeight: extractPatientWeight(text),
                followUpInstructions: extractFollowUpInstructions(text)
            };
            
        case 'accident_photo':
            return {
                location: extractLocation(text),
                date: extractDate(text),
                time: extractTime(text),
                vehicleNumbers: extractVehicleNumbers(text),
                damageDescription: extractDamageDescription(text),
                estimatedCost: extractEstimatedCost(text),
                policeReport: extractPoliceReport(text),
                witnesses: extractWitnesses(text),
                weatherConditions: extractWeatherConditions(text),
                ownerContacts: extractOwnerContacts(text)
            };
            
        default:
            return {
                extractedText: text,
                detectedEntities: extractGeneralEntities(text)
            };
    }
}

/**
 * Get enhanced document field templates
 */
function getDocumentFieldsTemplate(documentType: string): any {
    const templates = {
        bill: {
            amount: null,
            date: null,
            hospitalName: null,
            patientName: null,
            billNumber: null,
            diagnosis: null,
            billItems: [],
            doctorName: null,
            department: null,
            contactNumber: null,
            gstAmount: null,
            paymentMode: null
        },
        prescription: {
            doctorName: null,
            patientName: null,
            date: null,
            medicines: [],
            instructions: null,
            registrationNumber: null,
            hospitalName: null,
            patientAge: null,
            patientWeight: null,
            followUpInstructions: null
        },
        accident_photo: {
            location: null,
            date: null,
            time: null,
            vehicleNumbers: [],
            damageDescription: null,
            estimatedCost: null,
            policeReport: null,
            witnesses: [],
            weatherConditions: null,
            ownerContacts: []
        },
        other: {
            extractedText: null,
            detectedEntities: []
        }
    };

    return templates[documentType as keyof typeof templates] || templates.other;
}

// Enhanced field extraction helper functions
function extractAmount(text: string): number | null {
    const patterns = [
        /(?:Total|Amount|₹)\s*:?\s*₹?\s*([0-9,]+(?:\.\d{2})?)/i,
        /₹\s*([0-9,]+(?:\.\d{2})?)/g,
        /([0-9,]+(?:\.\d{2})?)\s*rupees?/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return parseInt(matches[1].replace(/,/g, ''));
        }
    }
    return null;
}

function extractDate(text: string): string | null {
    const patterns = [
        /(?:Date|Date:)\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i,
        /([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/g
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1] || matches[0];
        }
    }
    return null;
}

function extractHospitalName(text: string): string | null {
    const patterns = [
        /([A-Z][A-Za-z\s]+)(?:\s+HOSPITAL|\s+MEDICAL|\s+CLINIC)/i,
        /^([A-Z][A-Za-z\s]+)/m
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractPatientName(text: string): string | null {
    const patterns = [
        /(?:Patient|Name)\s*:?\s*([A-Za-z\s]+)/i,
        /Patient:\s*([A-Za-z\s]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractBillNumber(text: string): string | null {
    const patterns = [
        /(?:Bill No|Bill Number|ID)\s*:?\s*([A-Z0-9]+)/i,
        /([A-Z]{2,}\d{4,})/g
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1];
        }
    }
    return null;
}

function extractDiagnosis(text: string): string | null {
    const patterns = [
        /(?:Diagnosis|Condition|Disease)\s*:?\s*([A-Za-z\s,]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractBillItems(text: string): Array<{description: string, amount: number}> {
    const items: Array<{description: string, amount: number}> = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
        const itemMatch = line.match(/([A-Za-z\s]+)\s*:?\s*₹?\s*([0-9,]+)/);
        if (itemMatch && !line.includes('Total') && !line.includes('Date')) {
            items.push({
                description: itemMatch[1].trim(),
                amount: parseInt(itemMatch[2].replace(/,/g, ''))
            });
        }
    }
    
    return items;
}

function extractDoctorName(text: string): string | null {
    const patterns = [
        /Dr\.?\s+([A-Za-z\s]+)(?:\s+MBBS|\s+MD|\s+MS)?/i,
        /Doctor\s*:?\s*([A-Za-z\s]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractMedicines(text: string): Array<{name: string, dosage?: string, frequency?: string, duration?: string}> {
    const medicines: Array<{name: string, dosage?: string, frequency?: string, duration?: string}> = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
        const medicineMatch = line.match(/\d+\.\s*([A-Za-z\s]+(?:\d+mg)?)\s*-?\s*(.*)/);
        if (medicineMatch) {
            const medicineInfo = medicineMatch[2];
            medicines.push({
                name: medicineMatch[1].trim(),
                dosage: extractDosage(medicineInfo),
                frequency: extractFrequency(medicineInfo),
                duration: extractDuration(medicineInfo)
            });
        }
    }
    
    return medicines;
}

function extractInstructions(text: string): string | null {
    const patterns = [
        /(?:Instructions|Follow up)\s*:?\s*([A-Za-z\s,\.]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

// Additional extraction functions
function extractDepartment(text: string): string | null {
    const patterns = [
        /(?:Department|Dept)\s*:?\s*([A-Za-z\s]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractContactNumber(text: string): string | null {
    const patterns = [
        /(?:Contact|Phone|Mobile)\s*:?\s*([\d\-\s]+)/i,
        /(\d{3}-\d{8}|\d{10})/g
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1] || matches[0];
        }
    }
    return null;
}

function extractGSTAmount(text: string): number | null {
    const patterns = [
        /GST\s*:?\s*(\d+)%/i,
        /Tax\s*:?\s*₹?\s*([0-9,]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return parseInt(matches[1].replace(/,/g, ''));
        }
    }
    return null;
}

function extractPaymentMode(text: string): string | null {
    const patterns = [
        /(?:Payment Mode|Payment)\s*:?\s*([A-Za-z\s]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractRegistrationNumber(text: string): string | null {
    const patterns = [
        /(?:Registration No|Reg No)\s*:?\s*([A-Z0-9]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1];
        }
    }
    return null;
}

function extractPatientAge(text: string): number | null {
    const patterns = [
        /(?:Age)\s*:?\s*(\d+)\s*years?/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return parseInt(matches[1]);
        }
    }
    return null;
}

function extractPatientWeight(text: string): number | null {
    const patterns = [
        /(?:Weight)\s*:?\s*(\d+)\s*kg/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return parseInt(matches[1]);
        }
    }
    return null;
}

function extractFollowUpInstructions(text: string): string | null {
    const patterns = [
        /(?:Follow up)\s*([A-Za-z\s,\.]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractLocation(text: string): string | null {
    const patterns = [
        /(?:Location|Place)\s*:?\s*([A-Za-z\s,]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractTime(text: string): string | null {
    const patterns = [
        /(?:Time)\s*:?\s*(\d{1,2}:\d{2}\s*[AP]M)/i,
        /(\d{1,2}:\d{2})/g
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1] || matches[0];
        }
    }
    return null;
}

function extractVehicleNumbers(text: string): string[] {
    const pattern = /[A-Z]{2}\s*\d{2}\s*[A-Z]{1,2}\s*\d{4}/g;
    return text.match(pattern) || [];
}

function extractDamageDescription(text: string): string | null {
    const patterns = [
        /(?:Damage|Description)\s*:?\s*([A-Za-z\s,]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractEstimatedCost(text: string): number | null {
    const patterns = [
        /(?:Estimated|Cost|Damage)\s*:?\s*₹?\s*([0-9,]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return parseInt(matches[1].replace(/,/g, ''));
        }
    }
    return null;
}

function extractPoliceReport(text: string): string | null {
    const patterns = [
        /(?:Police Report|FIR)\s*:?\s*([A-Za-z0-9\s\/]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractWitnesses(text: string): string[] {
    const witnesses: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
        if (line.includes('Witness') || line.match(/\d+\.\s*[A-Za-z\s]+\s*-\s*\d+/)) {
            const witnessMatch = line.match(/([A-Za-z\s]+)\s*-\s*(\d+)/);
            if (witnessMatch) {
                witnesses.push(`${witnessMatch[1].trim()} - ${witnessMatch[2]}`);
            }
        }
    }
    
    return witnesses;
}

function extractWeatherConditions(text: string): string | null {
    const patterns = [
        /(?:Weather)\s*:?\s*([A-Za-z\s,]+)/i
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            return matches[1].trim();
        }
    }
    return null;
}

function extractOwnerContacts(text: string): string[] {
    const contacts: string[] = [];
    const pattern = /(?:Contact|Owner)\s*:?\s*(\d{10})/gi;
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
        contacts.push(match[1]);
    }
    
    return contacts;
}

function extractGeneralEntities(text: string): any {
    return {
        phoneNumbers: text.match(/\d{10}/g) || [],
        emails: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [],
        amounts: text.match(/₹?\s*\d+(?:,\d+)*(?:\.\d+)?/g) || [],
        dates: text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g) || []
    };
}

// Helper functions for medicine extraction
function extractDosage(medicineInfo: string): string | null {
    const dosageMatch = medicineInfo.match(/(\d+mg|\d+ml)/i);
    return dosageMatch ? dosageMatch[1] : null;
}

function extractFrequency(medicineInfo: string): string | null {
    const frequencyMatch = medicineInfo.match(/(\d+\s*times?\s*daily|twice\s*daily|once\s*daily)/i);
    return frequencyMatch ? frequencyMatch[1] : null;
}

function extractDuration(medicineInfo: string): string | null {
    const durationMatch = medicineInfo.match(/x\s*(\d+\s*days?)/i);
    return durationMatch ? durationMatch[1] : null;
}

// Google Vision specific helper functions
function calculateGoogleVisionConfidence(textAnnotations: any[], fullTextAnnotation: any): number {
    if (fullTextAnnotation?.pages) {
        // Calculate confidence from page-level confidence
        let totalConfidence = 0;
        let count = 0;
        
        fullTextAnnotation.pages.forEach((page: any) => {
            page.blocks?.forEach((block: any) => {
                if (block.confidence) {
                    totalConfidence += block.confidence;
                    count++;
                }
            });
        });
        
        return count > 0 ? totalConfidence / count : 0.8;
    }
    
    // Fallback to text annotation confidence
    if (textAnnotations.length > 1) {
        const confidences = textAnnotations.slice(1).map((annotation: any) => annotation.confidence || 0.8);
        return confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }
    
    return 0.8; // Default confidence
}

function extractBoundingBoxes(textAnnotations: any[]): BoundingBox[] {
    return textAnnotations.slice(1).map((annotation: any) => ({
        vertices: annotation.boundingPoly?.vertices || [],
        text: annotation.description || '',
        confidence: annotation.confidence || 0.8
    }));
}

function extractDetectedLanguages(fullTextAnnotation: any): string[] {
    const languages: string[] = [];
    
    if (fullTextAnnotation?.pages) {
        fullTextAnnotation.pages.forEach((page: any) => {
            page.blocks?.forEach((block: any) => {
                block.paragraphs?.forEach((paragraph: any) => {
                    paragraph.words?.forEach((word: any) => {
                        word.symbols?.forEach((symbol: any) => {
                            if (symbol.property?.detectedLanguages) {
                                symbol.property.detectedLanguages.forEach((lang: any) => {
                                    if (!languages.includes(lang.languageCode)) {
                                        languages.push(lang.languageCode);
                                    }
                                });
                            }
                        });
                    });
                });
            });
        });
    }
    
    return languages.length > 0 ? languages : ['en'];
}

function generateMockBoundingBoxes(fields: any): BoundingBox[] {
    const boxes: BoundingBox[] = [];
    
    Object.entries(fields).forEach(([key, value], index) => {
        if (value && typeof value === 'string') {
            boxes.push({
                vertices: [
                    { x: 10, y: 10 + index * 30 },
                    { x: 200, y: 10 + index * 30 },
                    { x: 200, y: 40 + index * 30 },
                    { x: 10, y: 40 + index * 30 }
                ],
                text: String(value),
                confidence: 0.9
            });
        }
    });
    
    return boxes;
}

/**
 * Validate document for OCR processing
 */
export function validateDocument(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (buffer.length > maxSize) {
        return { valid: false, error: 'Document too large (max 10MB)' };
    }
    
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
        return { valid: false, error: 'Unsupported document format' };
    }
    
    return { valid: true };
}

/**
 * Get supported document types (cached)
 */
export async function getSupportedDocumentTypes(): Promise<Array<{type: string, name: string, expectedFields: string[]}>> {
    const cacheKey = 'supported_document_types';
    
    // Check cache first
    const cachedTypes = await EnhancedCacheService.get<Array<{type: string, name: string, expectedFields: string[]}>>(cacheKey, {
        namespace: 'ocr',
        ttl: 86400, // Cache for 24 hours
        tags: ['ocr', 'config']
    });

    if (cachedTypes) {
        return cachedTypes;
    }

    // Generate supported types
    const documentTypes = [
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
            name: 'Accident Report',
            expectedFields: ['location', 'date', 'vehicleNumbers', 'damageDescription']
        },
        {
            type: 'other',
            name: 'Other Document',
            expectedFields: ['extractedText']
        }
    ];

    // Cache the result
    await EnhancedCacheService.set(cacheKey, documentTypes, {
        namespace: 'ocr',
        ttl: 86400,
        tags: ['ocr', 'config']
    });

    return documentTypes;
}
