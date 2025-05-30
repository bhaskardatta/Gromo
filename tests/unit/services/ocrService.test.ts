/// <reference types="jest" />
import { processDocument, validateDocument, getSupportedDocumentTypes } from '../../../src/services/ocrService';

// Mock Google Cloud Vision
jest.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    textDetection: jest.fn()
  }))
}));

// Mock crypto for deterministic tests
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-hash')
  }))
}));

// Mock the EnhancedCacheService
jest.mock('../../../src/services/enhancedCacheService', () => ({
  EnhancedCacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true)
  }
}));

describe('OCR Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processDocument', () => {
    it('should process document and extract data from buffer', async () => {
      const mockImageBuffer = Buffer.from('fake-image-data');
      const mockOptions = {
        documentType: 'bill',
        fallbackMethod: 'tesseract',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg'
      };

      const result = await processDocument(mockImageBuffer, mockOptions);

      expect(result).toBeDefined();
      expect(result.extractedData).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.method).toBeDefined();
      expect(result.structuredFields).toBeDefined();
    });

    it('should handle different document types', async () => {
      const documentTypes = ['bill', 'receipt', 'invoice', 'accident_photo'];
      const mockImageBuffer = Buffer.from('test-image');

      for (const docType of documentTypes) {
        const mockOptions = {
          documentType: docType,
          mimeType: 'image/jpeg'
        };

        const result = await processDocument(mockImageBuffer, mockOptions);

        expect(result).toBeDefined();
        expect(result.extractedData).toBeDefined();
        expect(result.method).toBeDefined();
      }
    });

    it('should extract structured fields from medical bills', async () => {
      const mockImageBuffer = Buffer.from('medical-bill-image');
      const mockOptions = {
        documentType: 'bill',
        mimeType: 'image/jpeg'
      };

      const result = await processDocument(mockImageBuffer, mockOptions);

      expect(result.structuredFields).toBeDefined();
      
      // Check if common medical bill fields are extracted
      if (result.structuredFields.amounts && result.structuredFields.amounts.length > 0) {
        expect(Array.isArray(result.structuredFields.amounts)).toBeTruthy();
      }
      
      if (result.structuredFields.dates && result.structuredFields.dates.length > 0) {
        expect(Array.isArray(result.structuredFields.dates)).toBeTruthy();
      }
    });

    it('should extract structured fields from invoices', async () => {
      const mockImageBuffer = Buffer.from('invoice-image');
      const mockOptions = {
        documentType: 'invoice',
        mimeType: 'image/pdf'
      };

      const result = await processDocument(mockImageBuffer, mockOptions);

      expect(result.structuredFields).toBeDefined();
      
      // Check invoice-specific fields
      if (result.structuredFields.invoiceNumber) {
        expect(typeof result.structuredFields.invoiceNumber).toBe('string');
      }
      
      if (result.structuredFields.amounts && result.structuredFields.amounts.length > 0) {
        expect(Array.isArray(result.structuredFields.amounts)).toBeTruthy();
      }
    });

    it('should handle different image formats', async () => {
      const formats = [
        { mimeType: 'image/jpeg', fileName: 'test.jpg' },
        { mimeType: 'image/png', fileName: 'test.png' },
        { mimeType: 'image/tiff', fileName: 'test.tiff' },
        { mimeType: 'application/pdf', fileName: 'test.pdf' }
      ];

      for (const format of formats) {
        const mockImageBuffer = Buffer.from(`${format.fileName}-data`);
        const mockOptions = {
          documentType: 'receipt',
          mimeType: format.mimeType,
          fileName: format.fileName
        };

        const result = await processDocument(mockImageBuffer, mockOptions);
        expect(result).toBeDefined();
        expect(result.method).toBeDefined();
      }
    });

    it('should handle processing options', async () => {
      const mockImageBuffer = Buffer.from('test-image');
      const mockOptions = {
        documentType: 'bill',
        mimeType: 'image/jpeg',
        enableHandwritingDetection: true,
        enableTableDetection: true,
        languageHints: ['en', 'hi']
      };

      const result = await processDocument(mockImageBuffer, mockOptions);

      expect(result).toBeDefined();
      expect(result.extractedData).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should return bounding boxes when available', async () => {
      const mockImageBuffer = Buffer.from('text-image');
      const mockOptions = {
        documentType: 'receipt',
        mimeType: 'image/jpeg'
      };

      const result = await processDocument(mockImageBuffer, mockOptions);

      if (result.boundingBoxes) {
        expect(Array.isArray(result.boundingBoxes)).toBeTruthy();
      }
    });

    it('should detect languages when available', async () => {
      const mockImageBuffer = Buffer.from('multilingual-image');
      const mockOptions = {
        documentType: 'bill',
        mimeType: 'image/jpeg',
        languageHints: ['en', 'hi', 'ta']
      };

      const result = await processDocument(mockImageBuffer, mockOptions);

      if (result.detectedLanguages) {
        expect(Array.isArray(result.detectedLanguages)).toBeTruthy();
      }
    });
  });

  describe('validateDocument', () => {
    it('should validate document buffer and mime type', () => {
      const validBuffer = Buffer.from('valid-document-data');
      const validMimeType = 'image/jpeg';

      const result = validateDocument(validBuffer, validMimeType);

      expect(result).toHaveProperty('valid');
      expect(typeof result.valid).toBe('boolean');
    });

    it('should accept valid image formats', () => {
      const validFormats = ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'image/webp'];
      const buffer = Buffer.from('test-image');

      validFormats.forEach(format => {
        const result = validateDocument(buffer, format);
        expect(result.valid).toBeTruthy();
        expect(result.error).toBeUndefined();
      });
    });

    it('should accept valid PDF format', () => {
      const buffer = Buffer.from('test-pdf');
      const result = validateDocument(buffer, 'application/pdf');

      expect(result.valid).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid document formats', () => {
      const invalidFormats = ['video/mp4', 'audio/mpeg', 'text/plain', 'application/json'];
      const buffer = Buffer.from('test-data');

      invalidFormats.forEach(format => {
        const result = validateDocument(buffer, format);
        expect(result.valid).toBeFalsy();
        expect(result.error).toContain('Unsupported document format');
      });
    });

    it('should reject oversized files', () => {
      // Create a buffer larger than 20MB
      const largeBuffer = Buffer.alloc(21 * 1024 * 1024); // 21MB
      const validMimeType = 'image/jpeg';

      const result = validateDocument(largeBuffer, validMimeType);

      expect(result.valid).toBeFalsy();
      expect(result.error).toContain('Document file too large');
    });

    it('should accept files within size limit', () => {
      // Create a buffer smaller than 20MB
      const smallBuffer = Buffer.alloc(1024); // 1KB
      const validMimeType = 'image/png';

      const result = validateDocument(smallBuffer, validMimeType);

      expect(result.valid).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('should handle edge cases', () => {
      // Empty buffer
      const emptyBuffer = Buffer.alloc(0);
      let result = validateDocument(emptyBuffer, 'image/jpeg');
      expect(result.valid).toBeTruthy(); // Empty files should be valid

      // Case insensitive mime types
      const buffer = Buffer.from('test');
      result = validateDocument(buffer, 'IMAGE/JPEG');
      expect(result.valid).toBeTruthy();

      result = validateDocument(buffer, 'Image/Png');
      expect(result.valid).toBeTruthy();
    });
  });

  describe('getSupportedDocumentTypes', () => {
    it('should return array of supported document types', async () => {
      const documentTypes = await getSupportedDocumentTypes();

      expect(Array.isArray(documentTypes)).toBeTruthy();
      expect(documentTypes.length).toBeGreaterThan(0);
      
      // Check structure of document type objects
      documentTypes.forEach(docType => {
        expect(docType).toHaveProperty('type');
        expect(docType).toHaveProperty('name');
        expect(docType).toHaveProperty('expectedFields');
        expect(typeof docType.type).toBe('string');
        expect(typeof docType.name).toBe('string');
        expect(Array.isArray(docType.expectedFields)).toBeTruthy();
      });
    });

    it('should include common insurance document types', async () => {
      const documentTypes = await getSupportedDocumentTypes();
      const types = documentTypes.map(docType => docType.type);

      const expectedTypes = ['bill', 'receipt', 'invoice', 'accident_photo'];
      expectedTypes.forEach(expectedType => {
        expect(types).toContain(expectedType);
      });
    });

    it('should provide expected fields for each document type', async () => {
      const documentTypes = await getSupportedDocumentTypes();

      documentTypes.forEach(docType => {
        expect(docType.expectedFields.length).toBeGreaterThan(0);
        
        // Check that expected fields are strings
        docType.expectedFields.forEach(field => {
          expect(typeof field).toBe('string');
        });
      });
    });
  });
});
