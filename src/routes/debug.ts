// Direct Debug API route to test claims retrieval without auth middleware
import express from 'express';
import { Claim } from '../models/Claim';
import { User } from '../models/User'; // Make sure User model is imported
import { logger } from '../utils/logger';

const router = express.Router();

// GET endpoint to dump all claims directly
router.get('/test-claims', async (req, res) => {
    try {
        logger.info('Debug claims endpoint called');
        
        // Get all claims without any filters - skip populate to avoid User model issues
        const claims = await Claim.find({})
            .sort({ createdAt: -1 })
            .lean();
            
        const total = await Claim.countDocuments({});
        
        logger.info(`Debug endpoint found ${claims.length} claims directly`);
        
        // Return raw data for inspection
        res.json({
            status: 'success',
            message: 'Debug endpoint - direct claims query',
            total,
            claimsFound: claims.length,
            claims: claims.map(c => ({
                id: c._id,
                type: c.type,
                status: c.status,
                amount: c.amount,
                user: c.user
            }))
        });
    } catch (error) {
        logger.error('Error in debug claims endpoint:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error in debug endpoint',
            error: error.message
        });
    }
});

export default router;
