import express from 'express';
import multer from 'multer';
import { processDocument, getSupportedDocumentTypes } from '../services/ocrService';
import { logger } from '../utils/logger';

const router = express.Router();

// Configure multer for document uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, and PDF files are allowed'));
        }
    }
});

/**
 * POST /api/v1/ocr/process-document
 * Process document using OCR with fallback mechanism
 */
router.post('/process-document', upload.single('document'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_DOCUMENT',
                    message: 'Document file is required'
                }
            });
        }

        const { documentType = 'bill', fallbackMethod = 'auto' } = req.body;
        
        logger.info(`Processing document - Type: ${documentType}, Size: ${req.file.size} bytes`);

        const result = await processDocument(req.file.buffer, {
            documentType,
            fallbackMethod,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype
        });

        // Determine response based on confidence level
        let status = 'success';
        let needsManualReview = false;

        if (result.confidence < 0.5) {
            status = 'low_confidence';
            needsManualReview = true;
        } else if (result.confidence < 0.7) {
            status = 'medium_confidence';
        }

        res.json({
            status,
            data: {
                extractedData: result.extractedData,
                confidence: result.confidence,
                ocrMethod: result.method,
                needsManualReview,
                fallbackSuggestion: needsManualReview ? 'manual_entry' : null,
                structuredFields: result.structuredFields
            }
        });

    } catch (error) {
        logger.error('OCR processing error:', error);
        next(error);
    }
});

/**
 * POST /api/v1/ocr/manual-fallback
 * Handle manual data entry when OCR fails
 */
router.post('/manual-fallback', async (req, res, next) => {
    try {
        const { documentId, manualData, originalExtractedData } = req.body;

        if (!manualData) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_MANUAL_DATA',
                    message: 'Manual data is required'
                }
            });
        }

        // Merge manual data with any successfully extracted data
        const mergedData = {
            ...originalExtractedData,
            ...manualData,
            _meta: {
                method: 'manual_override',
                confidence: 1.0,
                processedAt: new Date().toISOString(),
                fallbackReason: 'ocr_low_confidence'
            }
        };

        logger.info(`Manual fallback processed for document: ${documentId}`);

        res.json({
            status: 'success',
            data: {
                extractedData: mergedData,
                confidence: 1.0,
                method: 'manual_override'
            }
        });

    } catch (error) {
        logger.error('Manual fallback error:', error);
        next(error);
    }
});

/**
 * GET /api/v1/ocr/supported-document-types
 * Get list of supported document types
 */
router.get('/supported-document-types', async (req, res) => {
    try {
        const documentTypes = await getSupportedDocumentTypes();

        res.json({
            status: 'success',
            data: {
                documentTypes
            }
        });
    } catch (error) {
        logger.error('Error getting supported document types:', error);
        res.status(500).json({
            status: 'error',
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get supported document types'
            }
        });
    }
});

export default router;
