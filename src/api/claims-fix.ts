// Fixed version of claims.ts with improved GET / endpoint
import express from 'express';
import { Claim } from '../models/Claim';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const router = express.Router();

// Keep all existing routes...

/**
 * @swagger
 * /api/v1/claims:
 *   get:
 *     summary: Get all insurance claims
 *     description: Retrieves a list of all insurance claims with optional filtering and pagination
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, approved, rejected, escalated]
 *         description: Filter claims by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [motor, health, property, travel]
 *         description: Filter claims by type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of claims per page
 */
// Fixed implementation with better query handling and robust error handling
router.get('/', async (req, res, next) => {
    try {
        // Log incoming request for debugging
        logger.info('GET /claims request received', { 
            query: req.query,
            auth: req.headers.authorization ? 'Present' : 'Missing'
        });
        
        // Parse query parameters with default values
        const status = req.query.status ? String(req.query.status) : null;
        const type = req.query.type ? String(req.query.type) : null;
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);
        const search = req.query.search ? String(req.query.search) : null;
        const skip = (page - 1) * limit;
        
        // Build query filters as an object with explicit typing
        const filter: Record<string, any> = {};
        
        // Status mapping - convert API lowercase values to DB uppercase values
        if (status) {
            filter.status = status.toUpperCase();
            logger.info(`Filtering by status: ${filter.status}`);
        }
        
        if (type) {
            filter.type = type;
            logger.info(`Filtering by type: ${type}`);
        }
        
        // Text search
        if (search) {
            const searchRegex = new RegExp(String(search), 'i');
            filter.$or = [
                { description: searchRegex },
                { 'claimDetails.description': searchRegex }
            ];
            logger.info(`Searching for: ${search}`);
        }

        // Debug the filter being used
        logger.info('Claims query filter:', { filter });

        // Query MongoDB
        const claims = await Claim.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name phone')
            .lean();
        
        // Count total for pagination
        const total = await Claim.countDocuments(filter);
        
        logger.info(`Raw claims found: ${claims.length}, Total: ${total}`);

        // Format claims for response
        const formattedClaims = claims.map(claim => {
            // Handle potentially undefined user data
            const user = claim.user as any;
            return {
                id: claim._id,
                claimNumber: claim._id.toString().slice(-8).toUpperCase(),
                type: claim.type,
                status: claim.status,
                amount: claim.amount,
                dateFiled: claim.createdAt,
                description: claim.description || 
                          (claim.claimDetails && claim.claimDetails.description ? 
                          claim.claimDetails.description : 'No description'),
                userName: user && user.name ? user.name : 'Unknown',
                userPhone: user && user.phone ? user.phone : 'Unknown'
            };
        });
        
        logger.info(`Response prepared: ${formattedClaims.length} claims formatted`);
        
        // Return response
        res.json({
            status: 'success',
            data: {
                claims: formattedClaims,
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching claims list:', error);
        next(error);
    }
});

export default router;
