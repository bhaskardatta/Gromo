import express from 'express';
import { logger } from '../utils/logger';
import { EnhancedWhatsAppService, WhatsAppWebhookPayload } from '../services/enhancedWhatsAppService';

const router = express.Router();

/**
 * WhatsApp Webhook Verification (GET)
 * Required by WhatsApp to verify webhook endpoint
 */
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify the webhook
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'gromo-whatsapp-webhook-token';
    
    if (mode === 'subscribe' && token === expectedToken) {
        logger.info('WhatsApp webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        logger.warn('WhatsApp webhook verification failed', {
            mode,
            tokenMatch: token === expectedToken
        });
        res.status(403).send('Verification failed');
    }
});

/**
 * WhatsApp Webhook Handler (POST)
 * Receives message delivery status and incoming messages
 */
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    try {
        const payload: WhatsAppWebhookPayload = JSON.parse(req.body.toString());
        
        logger.info('WhatsApp webhook received', {
            object: payload.object,
            entryCount: payload.entry?.length || 0
        });

        // Verify it's a WhatsApp webhook
        if (payload.object !== 'whatsapp_business_account') {
            return res.status(400).json({
                success: false,
                error: 'Invalid webhook object type'
            });
        }

        // Process the webhook
        const result = EnhancedWhatsAppService.handleWebhook(payload);

        res.status(200).json({
            success: true,
            processed: result
        });

    } catch (error) {
        logger.error('Error processing WhatsApp webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Send WhatsApp Business Message
 * POST /api/v1/whatsapp/send
 */
router.post('/send', async (req, res) => {
    try {
        const { to, type, text, template, interactive } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Recipient phone number is required'
            });
        }

        // Validate phone number
        const phoneValidation = EnhancedWhatsAppService.validatePhoneNumber(to);
        if (!phoneValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: phoneValidation.error
            });
        }

        const message = {
            to: phoneValidation.formatted!,
            type: type || 'text',
            text,
            template,
            interactive
        };

        const result = await EnhancedWhatsAppService.sendBusinessMessage(message);

        if (result.success) {
            res.json({
                success: true,
                messageId: result.messageId,
                timestamp: result.timestamp
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        logger.error('Error sending WhatsApp message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send WhatsApp message'
        });
    }
});

/**
 * Send Claim Notification Template
 * POST /api/v1/whatsapp/claim-notification
 */
router.post('/claim-notification', async (req, res) => {
    try {
        const { phoneNumber, claimId, claimType, status, amount } = req.body;

        if (!phoneNumber || !claimId || !claimType || !status) {
            return res.status(400).json({
                success: false,
                error: 'phoneNumber, claimId, claimType, and status are required'
            });
        }

        const phoneValidation = EnhancedWhatsAppService.validatePhoneNumber(phoneNumber);
        if (!phoneValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: phoneValidation.error
            });
        }

        const result = await EnhancedWhatsAppService.sendClaimNotificationTemplate(
            phoneValidation.formatted!,
            claimId,
            claimType,
            status,
            amount
        );

        if (result.success) {
            res.json({
                success: true,
                messageId: result.messageId,
                timestamp: result.timestamp
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        logger.error('Error sending claim notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send claim notification'
        });
    }
});

/**
 * Send Interactive Claim Menu
 * POST /api/v1/whatsapp/claim-menu
 */
router.post('/claim-menu', async (req, res) => {
    try {
        const { phoneNumber, claims } = req.body;

        if (!phoneNumber || !claims || !Array.isArray(claims)) {
            return res.status(400).json({
                success: false,
                error: 'phoneNumber and claims array are required'
            });
        }

        const phoneValidation = EnhancedWhatsAppService.validatePhoneNumber(phoneNumber);
        if (!phoneValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: phoneValidation.error
            });
        }

        const result = await EnhancedWhatsAppService.sendClaimStatusMenu(
            phoneValidation.formatted!,
            claims
        );

        if (result.success) {
            res.json({
                success: true,
                messageId: result.messageId,
                timestamp: result.timestamp
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        logger.error('Error sending claim menu:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send claim menu'
        });
    }
});

/**
 * Send Claim Action Buttons
 * POST /api/v1/whatsapp/claim-actions
 */
router.post('/claim-actions', async (req, res) => {
    try {
        const { phoneNumber, claimId, actions } = req.body;

        if (!phoneNumber || !claimId || !actions || !Array.isArray(actions)) {
            return res.status(400).json({
                success: false,
                error: 'phoneNumber, claimId, and actions array are required'
            });
        }

        const phoneValidation = EnhancedWhatsAppService.validatePhoneNumber(phoneNumber);
        if (!phoneValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: phoneValidation.error
            });
        }

        const result = await EnhancedWhatsAppService.sendClaimActionButtons(
            phoneValidation.formatted!,
            claimId,
            actions
        );

        if (result.success) {
            res.json({
                success: true,
                messageId: result.messageId,
                timestamp: result.timestamp
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        logger.error('Error sending claim actions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send claim actions'
        });
    }
});

/**
 * Get WhatsApp Delivery Statistics
 * GET /api/v1/whatsapp/stats
 */
router.get('/stats', (req, res) => {
    try {
        const stats = EnhancedWhatsAppService.getDeliveryStats();
        
        res.json({
            success: true,
            data: {
                ...stats,
                timestamp: new Date()
            }
        });
    } catch (error) {
        logger.error('Error getting WhatsApp stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get WhatsApp statistics'
        });
    }
});

/**
 * Validate Phone Number
 * POST /api/v1/whatsapp/validate-phone
 */
router.post('/validate-phone', (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'phoneNumber is required'
            });
        }

        const validation = EnhancedWhatsAppService.validatePhoneNumber(phoneNumber);

        res.json({
            success: true,
            data: validation
        });
    } catch (error) {
        logger.error('Error validating phone number:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate phone number'
        });
    }
});

export default router;
