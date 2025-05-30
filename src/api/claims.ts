import express from 'express';
import { Claim } from '../models/Claim';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /api/v1/claims:
 *   post:
 *     summary: Create a new insurance claim
 *     description: Initiates a new insurance claim with optional voice data and documents
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userPhone
 *               - type
 *               - amount
 *             properties:
 *               userPhone:
 *                 type: string
 *                 description: User's phone number
 *                 example: "+91-9876543210"
 *               userName:
 *                 type: string
 *                 description: User's name (optional)
 *                 example: "John Doe"
 *               type:
 *                 type: string
 *                 enum: [motor, health, property, travel]
 *                 description: Type of insurance claim
 *                 example: "motor"
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 description: Claim amount in INR
 *                 example: 50000
 *               claimDetails:
 *                 type: object
 *                 description: Additional claim details
 *                 properties:
 *                   incidentDate:
 *                     type: string
 *                     format: date-time
 *                     description: Date and time of incident
 *                   location:
 *                     type: string
 *                     description: Incident location
 *                     example: "Mumbai, Maharashtra"
 *                   description:
 *                     type: string
 *                     description: Incident description
 *                     example: "Vehicle collision at traffic light"
 *               voiceData:
 *                 type: object
 *                 description: Voice transcription data
 *                 properties:
 *                   transcript:
 *                     type: string
 *                     description: Transcribed voice data
 *                   keywords:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Extracted keywords
 *               documents:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Document'
 *                 description: Supporting documents
 *     responses:
 *       201:
 *         description: Claim created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Claim'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', async (req, res, next) => {
    try {
        const {
            userPhone,
            type,
            amount,
            claimDetails,
            voiceData,
            documents
        } = req.body;

        // Find or create user
        let user = await User.findOne({ phone: userPhone });
        if (!user) {
            user = new User({
                phone: userPhone,
                name: req.body.userName || 'Unknown User',
                claimsThisMonth: 0,
                totalClaims: 0
            });
            await user.save();
        }

        // Create new claim
        const claim = new Claim({
            user: user._id,
            type,
            amount,
            claimDetails,
            voiceData,
            documents: documents || [],
            processingSteps: [{
                step: 'claim_initiated',
                completedAt: new Date(),
                success: true,
                details: { source: 'api' }
            }]
        });

        await claim.save();

        // Update user statistics
        user.claimsThisMonth += 1;
        user.totalClaims += 1;
        await user.save();

        logger.info(`New claim created: ${claim._id} for user: ${user.phone}`);

        res.status(201).json({
            status: 'success',
            data: {
                claimId: claim._id,
                status: claim.status,
                amount: claim.amount,
                type: claim.type,
                expiresAt: claim.expiresAt
            }
        });

    } catch (error) {
        logger.error('Claim creation error:', error);
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/claims/{claimId}:
 *   get:
 *     summary: Get claim details by ID
 *     description: Retrieves comprehensive details of a specific claim
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique claim identifier
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Claim details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Claim'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:claimId', async (req, res, next) => {
    try {
        const claim = await Claim.findById(req.params.claimId)
            .populate('user', 'name phone')
            .lean();

        if (!claim) {
            return res.status(404).json({
                error: {
                    code: 'CLAIM_NOT_FOUND',
                    message: 'Claim not found'
                }
            });
        }

        res.json({
            status: 'success',
            data: claim
        });

    } catch (error) {
        logger.error('Claim retrieval error:', error);
        next(error);
    }
});

/**
 * @swagger
 * /api/v1/claims/{claimId}:
 *   put:
 *     summary: Update claim details
 *     description: Updates claim information with additional details or documents
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique claim identifier
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               claimDetails:
 *                 type: object
 *                 description: Updated claim details
 *               documents:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Document'
 *                 description: Additional documents
 *               additionalData:
 *                 type: object
 *                 description: Any additional data
 *     responses:
 *       200:
 *         description: Claim updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Claim'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:claimId', async (req, res, next) => {
    try {
        const { claimDetails, documents, additionalData } = req.body;

        const claim = await Claim.findById(req.params.claimId);
        if (!claim) {
            return res.status(404).json({
                error: {
                    code: 'CLAIM_NOT_FOUND',
                    message: 'Claim not found'
                }
            });
        }

        // Update claim fields
        if (claimDetails) {
            claim.claimDetails = { ...claim.claimDetails, ...claimDetails };
        }

        if (documents) {
            claim.documents.push(...documents);
        }

        // Add processing step
        claim.processingSteps.push({
            step: 'claim_updated',
            completedAt: new Date(),
            success: true,
            details: additionalData || {}
        });

        await claim.save();

        logger.info(`Claim updated: ${claim._id}`);

        res.json({
            status: 'success',
            data: {
                claimId: claim._id,
                status: claim.status,
                lastUpdated: claim.updatedAt
            }
        });

    } catch (error) {
        logger.error('Claim update error:', error);
        next(error);
    }
});

/**
 * GET /api/v1/claims/user/:userPhone
 * Get all claims for a user
 */
router.get('/user/:userPhone', async (req, res, next) => {
    try {
        const user = await User.findOne({ phone: req.params.userPhone });
        if (!user) {
            return res.status(404).json({
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        const claims = await Claim.find({ user: user._id })
            .sort({ createdAt: -1 })
            .select('_id type status amount claimDetails.incidentDate createdAt')
            .lean();

        res.json({
            status: 'success',
            data: {
                user: {
                    phone: user.phone,
                    name: user.name,
                    totalClaims: user.totalClaims,
                    claimsThisMonth: user.claimsThisMonth
                },
                claims
            }
        });

    } catch (error) {
        logger.error('User claims retrieval error:', error);
        next(error);
    }
});

export default router;
