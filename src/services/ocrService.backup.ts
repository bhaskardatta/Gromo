import { logger } from '../utils/logger';

interface OCRProcessingOptions {
    documentType: string;
    fallbackMethod: string;
    fileName: string;
    mimeType: string;
}

interface OCRProcessingResult {
    extractedData: any;
    confidence: number;
    method: 'tesseract' | 'google_vision' | 'manual';
    structuredFields: any;
}

/**
 * Process document using OCR with 3-step fallback mechanism
 */
export async function processDocument(
    documentBuffer: Buffer,
    options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
    try {
        logger.info(`Processing document - Type: ${options.documentType}, Size: ${documentBuffer.length} bytes`);

        let result: OCRProcessingResult;

        // Step 1: Try Tesseract.js (free tier)
        try {
            result = await processTesseract(documentBuffer, options);
            if (result.confidence >= 0.7) {
                logger.info('Tesseract OCR successful with high confidence');
                return result;
            }
        } catch (error) {
            logger.warn('Tesseract OCR failed, falling back to Google Vision');
        }

        // Step 2: Fall back to Google Vision API if confidence < 70%
        try {
            result = await processGoogleVision(documentBuffer, options);
            if (result.confidence >= 0.5) {
                logger.info('Google Vision OCR successful');
                return result;
            }
        } catch (error) {
            logger.warn('Google Vision OCR failed, triggering manual fallback');
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
 * Process using Tesseract.js
 */
async function processTesseract(
    documentBuffer: Buffer, 
    options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
    
    // Mock Tesseract processing
    // In production: const tesseract = require('tesseract.js');
    // const { data } = await tesseract.recognize(documentBuffer, 'eng+hin');
    
    const mockExtractedText = generateMockExtractedText(options.documentType);
    const confidence = 0.6 + Math.random() * 0.3; // 60-90% confidence
    
    const structuredFields = extractStructuredFields(mockExtractedText, options.documentType);
    
    return {
        extractedData: {
            rawText: mockExtractedText,
            ...structuredFields
        },
        confidence,
        method: 'tesseract',
        structuredFields
    };
}

/**
 * Process using Google Vision API
 */
async function processGoogleVision(
    documentBuffer: Buffer, 
    options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
    
    // Mock Google Vision processing
    // In production: const vision = require('@google-cloud/vision');
    // const [result] = await vision.textDetection(documentBuffer);
    
    const mockExtractedText = generateMockExtractedText(options.documentType, true);
    const confidence = 0.8 + Math.random() * 0.15; // 80-95% confidence
    
    const structuredFields = extractStructuredFields(mockExtractedText, options.documentType);
    
    return {
        extractedData: {
            rawText: mockExtractedText,
            ...structuredFields,
            boundingBoxes: generateMockBoundingBoxes(structuredFields)
        },
        confidence,
        method: 'google_vision',
        structuredFields
    };
}

/**
 * Generate manual fallback data
 */
async function generateManualFallback(
    documentBuffer: Buffer, 
    options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
    
    // Provide basic document structure for manual entry
    const emptyFields = getDocumentFieldsTemplate(options.documentType);
    
    return {
        extractedData: {
            rawText: '',
            ...emptyFields,
            _needsManualEntry: true
        },
        confidence: 0.0,
        method: 'manual',
        structuredFields: emptyFields
    };
}

/**
 * Generate mock extracted text based on document type
 */
function generateMockExtractedText(documentType: string, highQuality: boolean = false): string {
    const templates = {
        bill: highQuality ? 
            `APOLLO HOSPITALS
            Medical Bill
            Date: 15/03/2024
            Patient: John Doe
            Bill No: AH2024001
            
            Consultation Fee: ₹800
            Lab Tests: ₹2,400
            Medicines: ₹1,200
            
            Total Amount: ₹4,400
            
            Diagnosis: Fever, Viral Infection
            Doctor: Dr. Smith Kumar` :
            `APOLLO HOSPITALS
            Medical Bill
            Date: 15/03/2024
            Patient: J0hn D0e
            
            Consultation: 800
            Tests: 2400
            Total: 4400`,
            
        prescription: highQuality ?
            `Dr. Rajesh Sharma MBBS, MD
            City Medical Center
            
            Date: 16/03/2024
            Patient: Jane Smith
            Age: 35
            
            Rx:
            1. Paracetamol 500mg - 2 times daily x 5 days
            2. Azithromycin 250mg - 1 daily x 3 days
            3. Cough Syrup - 10ml twice daily
            
            Follow up after 1 week` :
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
            
            Vehicle 1: KA 01 AB 1234 (Bike)
            Vehicle 2: KA 05 CD 5678 (Car)
            
            Damage: Front bumper dent, headlight broken
            Weather: Clear
            
            Police Report: Filed` :
            `Accident
            MG Road
            14/03/2024
            
            KA 01 AB 1234
            Front damage`,
            
        other: 'Document contains text that needs manual review'
    };
    
    return templates[documentType as keyof typeof templates] || templates.other;
}

/**
 * Extract structured fields from text based on document type
 */
function extractStructuredFields(text: string, documentType: string): any {
    const fields: any = {};
    
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
function getDocumentFieldsTemplate(documentType: string): any {
    const templates = {
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
    
    return templates[documentType as keyof typeof templates] || templates.other;
}

// Field extraction helper functions
function extractAmount(text: string): number | null {
    const amountMatches = text.match(/(?:Total|Amount|₹)\s*:?\s*₹?\s*([0-9,]+)/i);
    if (amountMatches) {
        return parseInt(amountMatches[1].replace(/,/g, ''));
    }
    return null;
}

function extractDate(text: string): string | null {
    const dateMatches = text.match(/(?:Date|Date:)\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/);
    return dateMatches ? dateMatches[1] : null;
}

function extractHospitalName(text: string): string | null {
    const lines = text.split('\n');
    // Usually hospital name is in the first few lines
    for (const line of lines.slice(0, 3)) {
        if (line.trim() && !line.includes('Bill') && !line.includes('Date')) {
            return line.trim();
        }
    }
    return null;
}

function extractPatientName(text: string): string | null {
    const nameMatches = text.match(/(?:Patient|Name)\s*:?\s*([A-Za-z\s]+)/i);
    return nameMatches ? nameMatches[1].trim() : null;
}

function extractBillNumber(text: string): string | null {
    const billMatches = text.match(/(?:Bill|Receipt|Invoice)\s*(?:No|Number)?\s*:?\s*([A-Z0-9]+)/i);
    return billMatches ? billMatches[1] : null;
}

function extractDiagnosis(text: string): string | null {
    const diagnosisMatches = text.match(/(?:Diagnosis|Condition)\s*:?\s*([A-Za-z\s,]+)/i);
    return diagnosisMatches ? diagnosisMatches[1].trim() : null;
}

function extractBillItems(text: string): any[] {
    const items: any[] = [];
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
    const doctorMatches = text.match(/Dr\.\s*([A-Za-z\s]+)/i);
    return doctorMatches ? doctorMatches[1].trim() : null;
}

function extractMedicines(text: string): any[] {
    const medicines: any[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
        const medicineMatch = line.match(/\d+\.\s*([A-Za-z\s]+(?:\d+mg)?)\s*-?\s*(.*)/);
        if (medicineMatch) {
            medicines.push({
                name: medicineMatch[1].trim(),
                instructions: medicineMatch[2].trim()
            });
        }
    }
    
    return medicines;
}

function extractInstructions(text: string): string | null {
    const instructionMatches = text.match(/(?:Follow up|Instructions)\s*:?\s*([A-Za-z\s]+)/i);
    return instructionMatches ? instructionMatches[1].trim() : null;
}

function extractLocation(text: string): string | null {
    const locationMatches = text.match(/(?:Location|Place)\s*:?\s*([A-Za-z\s,]+)/i);
    return locationMatches ? locationMatches[1].trim() : null;
}

function extractVehicleNumbers(text: string): string[] {
    const vehicleMatches = text.match(/[A-Z]{2}\s*\d{2}\s*[A-Z]{2}\s*\d{4}/g);
    return vehicleMatches || [];
}

function extractDamageDescription(text: string): string | null {
    const damageMatches = text.match(/(?:Damage|Description)\s*:?\s*([A-Za-z\s,]+)/i);
    return damageMatches ? damageMatches[1].trim() : null;
}

function generateMockBoundingBoxes(fields: any): any {
    // Mock bounding box coordinates for Google Vision API response
    const boxes: any = {};
    
    Object.keys(fields).forEach((field, index) => {
        boxes[field] = {
            x: 100 + (index * 50),
            y: 100 + (index * 30),
            width: 200,
            height: 25
        };
    });
    
    return boxes;
}
