import express from 'express';
import multer from 'multer';
import { processVoiceInput } from '../services/voiceService';
import { logger } from '../utils/logger';

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});

/**
 * @swagger
 * /api/v1/voice/process:
 *   post:
 *     summary: Process voice input for claim initiation
 *     description: Transcribes audio files and extracts keywords for claim processing
 *     tags: [Voice Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (WAV, MP3, etc.)
 *               language:
 *                 type: string
 *                 description: Language code for transcription
 *                 default: "en-IN"
 *                 example: "en-IN"
 *                 enum: ["en-IN", "hi-IN", "ta-IN", "te-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", "mr-IN", "pa-IN"]
 *     responses:
 *       200:
 *         description: Voice processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/VoiceTranscription'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/process', upload.single('audio'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_AUDIO',
                    message: 'Audio file is required'
                }
            });
        }

        const { language = 'en-IN' } = req.body;
        
        logger.info(`Processing voice input - Language: ${language}, Size: ${req.file.size} bytes`);

        const result = await processVoiceInput(req.file.buffer, {
            language,
            audioFormat: req.file.mimetype
        });

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

    } catch (error) {
        logger.error('Voice processing error:', error);
        next(error);
    }
});

/**
 * GET /api/v1/voice/supported-languages
 * Get list of supported languages for voice input
 */
router.get('/supported-languages', (req, res) => {
    const supportedLanguages = [
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
        data: supportedLanguages.map(lang => lang.code) // Return just the language codes as an array
    });
});

export default router;
