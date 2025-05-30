"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ocrService_1 = require("../../src/services/ocrService");
const vision_1 = require("@google-cloud/vision");
const promises_1 = __importDefault(require("fs/promises"));
// Mock the Google Vision client
jest.mock('@google-cloud/vision');
jest.mock('fs/promises');
describe('OCRService', () => {
    let ocrService;
    let mockVisionClient;
    beforeEach(() => {
        ocrService = new ocrService_1.OCRService();
        mockVisionClient = new vision_1.ImageAnnotatorClient();
        ocrService.visionClient = mockVisionClient;
    });
    describe('extractText', () => {
        it('should successfully extract text from image', async () => {
            // Mock file reading
            const mockImageData = Buffer.from('mock-image-data');
            promises_1.default.readFile.mockResolvedValue(mockImageData);
            // Mock Google Vision API response
            const mockResponse = [{
                    textAnnotations: [
                        { description: 'CLAIM FORM\nPolicy Number: POL123456\nClaim Number: CLM789012\nDate: 2023-12-01' }
                    ]
                }];
            mockVisionClient.textDetection.mockResolvedValue(mockResponse);
            const result = await ocrService.extractText('./test-image.jpg');
            expect(result).toEqual({
                extractedText: 'CLAIM FORM\nPolicy Number: POL123456\nClaim Number: CLM789012\nDate: 2023-12-01',
                confidence: 1,
                entities: {
                    claimNumber: 'CLM789012',
                    policyNumber: 'POL123456',
                    incidentDate: '2023-12-01',
                    incidentType: null,
                    damageAmount: null,
                    vehicleNumber: null,
                    location: null,
                    phoneNumber: null
                },
                documentType: 'claim_form'
            });
            expect(mockVisionClient.textDetection).toHaveBeenCalledWith({
                image: { content: mockImageData }
            });
        });
        it('should handle OCR errors gracefully', async () => {
            promises_1.default.readFile.mockRejectedValue(new Error('File not found'));
            await expect(ocrService.extractText('./non-existent.jpg')).rejects.toThrow('OCR processing failed: File not found');
        });
        it('should fallback to document text detection on text detection failure', async () => {
            const mockImageData = Buffer.from('mock-image-data');
            promises_1.default.readFile.mockResolvedValue(mockImageData);
            // Mock text detection failure
            mockVisionClient.textDetection.mockRejectedValue(new Error('Text detection failed'));
            // Mock document text detection success
            const mockDocumentResponse = [{
                    fullTextAnnotation: {
                        text: 'INSURANCE CLAIM DOCUMENT\nPolicy: POL456789'
                    }
                }];
            mockVisionClient.documentTextDetection.mockResolvedValue(mockDocumentResponse);
            const result = await ocrService.extractText('./test-image.jpg');
            expect(result.extractedText).toBe('INSURANCE CLAIM DOCUMENT\nPolicy: POL456789');
            expect(mockVisionClient.documentTextDetection).toHaveBeenCalled();
        });
        it('should use fallback OCR when both Google methods fail', async () => {
            const mockImageData = Buffer.from('mock-image-data');
            promises_1.default.readFile.mockResolvedValue(mockImageData);
            // Mock both Google methods failing
            mockVisionClient.textDetection.mockRejectedValue(new Error('Text detection failed'));
            mockVisionClient.documentTextDetection.mockRejectedValue(new Error('Document detection failed'));
            const result = await ocrService.extractText('./test-image.jpg');
            expect(result.extractedText).toBe('Fallback OCR: Unable to process image with enhanced methods');
            expect(result.confidence).toBe(0.3);
        });
    });
    describe('detectDocumentType', () => {
        it('should detect claim form', () => {
            const text = 'MOTOR INSURANCE CLAIM FORM\nPolicy Number: POL123456';
            const type = ocrService.detectDocumentType(text);
            expect(type).toBe('claim_form');
        });
        it('should detect medical bill', () => {
            const text = 'HOSPITAL INVOICE\nBill Amount: ₹25000\nPatient Name: John Doe';
            const type = ocrService.detectDocumentType(text);
            expect(type).toBe('medical_bill');
        });
        it('should detect police report', () => {
            const text = 'POLICE STATION REPORT\nFIR Number: 123/2023\nAccident Details';
            const type = ocrService.detectDocumentType(text);
            expect(type).toBe('police_report');
        });
        it('should detect repair estimate', () => {
            const text = 'VEHICLE REPAIR ESTIMATE\nGarage: ABC Motors\nTotal Cost: ₹45000';
            const type = ocrService.detectDocumentType(text);
            expect(type).toBe('repair_estimate');
        });
        it('should default to other for unknown documents', () => {
            const text = 'Random document content without specific keywords';
            const type = ocrService.detectDocumentType(text);
            expect(type).toBe('other');
        });
    });
    describe('extractEntities', () => {
        it('should extract claim number', () => {
            const text = 'Claim Number: CLM123456789';
            const entities = ocrService.extractEntities(text);
            expect(entities.claimNumber).toBe('CLM123456789');
        });
        it('should extract policy number', () => {
            const text = 'Policy No: POL987654321';
            const entities = ocrService.extractEntities(text);
            expect(entities.policyNumber).toBe('POL987654321');
        });
        it('should extract damage amount in various formats', () => {
            const text1 = 'Total Damage: ₹50,000';
            const entities1 = ocrService.extractEntities(text1);
            expect(entities1.damageAmount).toBe('₹50,000');
            const text2 = 'Amount: Rs. 75000';
            const entities2 = ocrService.extractEntities(text2);
            expect(entities2.damageAmount).toBe('Rs. 75000');
            const text3 = 'Cost: INR 1,25,000';
            const entities3 = ocrService.extractEntities(text3);
            expect(entities3.damageAmount).toBe('INR 1,25,000');
        });
        it('should extract vehicle number', () => {
            const text = 'Vehicle Registration: MH12AB3456';
            const entities = ocrService.extractEntities(text);
            expect(entities.vehicleNumber).toBe('MH12AB3456');
        });
        it('should extract phone number', () => {
            const text = 'Contact: +91-9876543210';
            const entities = ocrService.extractEntities(text);
            expect(entities.phoneNumber).toBe('+91-9876543210');
        });
        it('should extract date in various formats', () => {
            const text1 = 'Incident Date: 01/12/2023';
            const entities1 = ocrService.extractEntities(text1);
            expect(entities1.incidentDate).toBe('01/12/2023');
            const text2 = 'Date: 2023-12-01';
            const entities2 = ocrService.extractEntities(text2);
            expect(entities2.incidentDate).toBe('2023-12-01');
        });
        it('should return null for missing entities', () => {
            const text = 'Simple document without specific entities';
            const entities = ocrService.extractEntities(text);
            expect(entities.claimNumber).toBeNull();
            expect(entities.policyNumber).toBeNull();
            expect(entities.damageAmount).toBeNull();
        });
    });
    describe('validateImageFormat', () => {
        it('should validate supported image formats', () => {
            expect(ocrService.validateImageFormat('test.jpg')).toBe(true);
            expect(ocrService.validateImageFormat('test.jpeg')).toBe(true);
            expect(ocrService.validateImageFormat('test.png')).toBe(true);
            expect(ocrService.validateImageFormat('test.gif')).toBe(true);
            expect(ocrService.validateImageFormat('test.bmp')).toBe(true);
            expect(ocrService.validateImageFormat('test.tiff')).toBe(true);
            expect(ocrService.validateImageFormat('test.webp')).toBe(true);
        });
        it('should reject unsupported image formats', () => {
            expect(ocrService.validateImageFormat('test.txt')).toBe(false);
            expect(ocrService.validateImageFormat('test.mp3')).toBe(false);
            expect(ocrService.validateImageFormat('test.pdf')).toBe(false);
        });
    });
    describe('getSupportedFormats', () => {
        it('should return list of supported formats', () => {
            const formats = ocrService.getSupportedFormats();
            expect(formats).toContain('jpg');
            expect(formats).toContain('jpeg');
            expect(formats).toContain('png');
            expect(formats).toContain('gif');
            expect(formats.length).toBeGreaterThan(3);
        });
    });
});
//# sourceMappingURL=ocrService.test.js.map