import twilio from 'twilio';
import { logger } from '../utils/logger';

interface NotificationPayload {
  type: 'whatsapp' | 'sms' | 'email';
  recipient: string;
  message: string;
  templateData?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface WhatsAppMessage {
  to: string;
  from: string;
  body: string;
  mediaUrl?: string[];
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export class NotificationService {
  private static twilioClient: twilio.Twilio | null = null;

  /**
   * Initialize Twilio client
   */
  private static initializeTwilio(): twilio.Twilio {
    if (!this.twilioClient) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured');
      }

      this.twilioClient = twilio(accountSid, authToken);
      logger.info('Twilio client initialized');
    }

    return this.twilioClient;
  }

  /**
   * Send WhatsApp message using Twilio
   */
  static async sendWhatsAppMessage(message: WhatsAppMessage): Promise<NotificationResult> {
    try {
      logger.info(`Sending WhatsApp message to ${message.to}`);

      const client = this.initializeTwilio();
      const twilioMessage = await client.messages.create({
        body: message.body,
        from: `whatsapp:${message.from}`,
        to: `whatsapp:${message.to}`,
        mediaUrl: message.mediaUrl
      });

      logger.info(`WhatsApp message sent successfully: ${twilioMessage.sid}`);

      return {
        success: true,
        messageId: twilioMessage.sid,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Send SMS message using Twilio
   */
  static async sendSMSMessage(to: string, body: string, from?: string): Promise<NotificationResult> {
    try {
      logger.info(`Sending SMS to ${to}`);

      const client = this.initializeTwilio();
      const twilioMessage = await client.messages.create({
        body,
        from: from || process.env.TWILIO_PHONE_NUMBER,
        to
      });

      logger.info(`SMS sent successfully: ${twilioMessage.sid}`);

      return {
        success: true,
        messageId: twilioMessage.sid,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Send notification based on type
   */
  static async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      switch (payload.type) {
        case 'whatsapp':
          return await this.sendWhatsAppMessage({
            to: payload.recipient,
            from: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
            body: payload.message
          });

        case 'sms':
          return await this.sendSMSMessage(payload.recipient, payload.message);

        case 'email':
          // Email implementation would go here
          logger.info('Email notifications not yet implemented');
          return {
            success: false,
            error: 'Email notifications not implemented',
            timestamp: new Date()
          };

        default:
          throw new Error(`Unsupported notification type: ${payload.type}`);
      }
    } catch (error) {
      logger.error('Error sending notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Send claim submission confirmation
   */
  static async sendClaimConfirmation(
    phoneNumber: string,
    claimId: string,
    claimType: string,
    estimatedAmount?: number
  ): Promise<NotificationResult> {
    const message = this.formatClaimConfirmationMessage(claimId, claimType, estimatedAmount);
    
    return await this.sendNotification({
      type: 'whatsapp',
      recipient: phoneNumber,
      message,
      priority: 'medium'
    });
  }

  /**
   * Send escalation notification to agent
   */
  static async sendEscalationNotification(
    agentContact: string,
    claimId: string,
    escalationLevel: number,
    urgency: string,
    reason: string
  ): Promise<NotificationResult> {
    const message = this.formatEscalationMessage(claimId, escalationLevel, urgency, reason);
    
    return await this.sendNotification({
      type: 'whatsapp',
      recipient: agentContact,
      message,
      priority: urgency as 'low' | 'medium' | 'high' | 'urgent'
    });
  }

  /**
   * Send fraud alert notification
   */
  static async sendFraudAlert(
    agentContact: string,
    claimId: string,
    fraudScore: number,
    riskFactors: string[]
  ): Promise<NotificationResult> {
    const message = this.formatFraudAlertMessage(claimId, fraudScore, riskFactors);
    
    return await this.sendNotification({
      type: 'whatsapp',
      recipient: agentContact,
      message,
      priority: 'urgent'
    });
  }

  /**
   * Send status update to customer
   */
  static async sendStatusUpdate(
    phoneNumber: string,
    claimId: string,
    status: string,
    additionalInfo?: string
  ): Promise<NotificationResult> {
    const message = this.formatStatusUpdateMessage(claimId, status, additionalInfo);
    
    return await this.sendNotification({
      type: 'whatsapp',
      recipient: phoneNumber,
      message,
      priority: 'medium'
    });
  }

  /**
   * Send payout notification
   */
  static async sendPayoutNotification(
    phoneNumber: string,
    claimId: string,
    payoutAmount: number,
    paymentMethod: string
  ): Promise<NotificationResult> {
    const message = this.formatPayoutMessage(claimId, payoutAmount, paymentMethod);
    
    return await this.sendNotification({
      type: 'whatsapp',
      recipient: phoneNumber,
      message,
      priority: 'high'
    });
  }

  /**
   * Format claim confirmation message
   */
  private static formatClaimConfirmationMessage(
    claimId: string,
    claimType: string,
    estimatedAmount?: number
  ): string {
    let message = `🔔 *ClaimAssist Pro - Claim Submitted*\n\n`;
    message += `✅ Your ${claimType} claim has been successfully submitted.\n\n`;
    message += `📋 *Claim ID:* ${claimId}\n`;
    message += `📅 *Submitted:* ${new Date().toLocaleDateString()}\n`;
    
    if (estimatedAmount) {
      message += `💰 *Estimated Amount:* $${estimatedAmount.toLocaleString()}\n`;
    }
    
    message += `\n⏱️ *Next Steps:*\n`;
    message += `• We'll review your claim within 24 hours\n`;
    message += `• You'll receive updates via WhatsApp\n`;
    message += `• Additional documents may be requested\n\n`;
    message += `📞 Need help? Reply to this message or call our support line.\n\n`;
    message += `Thank you for choosing ClaimAssist Pro! 🤝`;

    return message;
  }

  /**
   * Format escalation message for agents
   */
  private static formatEscalationMessage(
    claimId: string,
    escalationLevel: number,
    urgency: string,
    reason: string
  ): string {
    let message = `🚨 *ClaimAssist Pro - Escalation Alert*\n\n`;
    message += `⚠️ Claim requires Level ${escalationLevel} attention\n\n`;
    message += `📋 *Claim ID:* ${claimId}\n`;
    message += `🔥 *Urgency:* ${urgency.toUpperCase()}\n`;
    message += `📝 *Reason:* ${reason}\n`;
    message += `⏰ *Escalated:* ${new Date().toLocaleString()}\n\n`;
    message += `👆 Please review and take appropriate action.\n`;
    message += `⏱️ Response required within designated timeframe.`;

    return message;
  }

  /**
   * Format fraud alert message
   */
  private static formatFraudAlertMessage(
    claimId: string,
    fraudScore: number,
    riskFactors: string[]
  ): string {
    let message = `🚩 *ClaimAssist Pro - Fraud Alert*\n\n`;
    message += `⚠️ HIGH PRIORITY - Potential fraud detected\n\n`;
    message += `📋 *Claim ID:* ${claimId}\n`;
    message += `📊 *Fraud Score:* ${fraudScore}/100\n`;
    message += `🔍 *Risk Factors:*\n`;
    
    riskFactors.forEach(factor => {
      message += `• ${factor}\n`;
    });
    
    message += `\n🔒 *Action Required:*\n`;
    message += `• Immediate investigation needed\n`;
    message += `• Verify all claim details\n`;
    message += `• Contact customer if necessary\n\n`;
    message += `⏰ Time-sensitive - please respond ASAP`;

    return message;
  }

  /**
   * Format status update message
   */
  private static formatStatusUpdateMessage(
    claimId: string,
    status: string,
    additionalInfo?: string
  ): string {
    let message = `📱 *ClaimAssist Pro - Claim Update*\n\n`;
    message += `📋 *Claim ID:* ${claimId}\n`;
    message += `📊 *Status:* ${status}\n`;
    message += `⏰ *Updated:* ${new Date().toLocaleString()}\n`;
    
    if (additionalInfo) {
      message += `\n📝 *Details:*\n${additionalInfo}\n`;
    }
    
    message += `\n💬 Questions? Reply to this message for assistance.`;

    return message;
  }

  /**
   * Format payout notification message
   */
  private static formatPayoutMessage(
    claimId: string,
    payoutAmount: number,
    paymentMethod: string
  ): string {
    let message = `🎉 *ClaimAssist Pro - Payout Approved*\n\n`;
    message += `✅ Great news! Your claim has been approved.\n\n`;
    message += `📋 *Claim ID:* ${claimId}\n`;
    message += `💰 *Payout Amount:* $${payoutAmount.toLocaleString()}\n`;
    message += `💳 *Payment Method:* ${paymentMethod}\n`;
    message += `📅 *Processing Date:* ${new Date().toLocaleDateString()}\n\n`;
    message += `⏱️ *Expected Timeline:*\n`;
    message += `• Bank transfer: 1-3 business days\n`;
    message += `• Check: 5-7 business days\n\n`;
    message += `📧 You'll receive payment confirmation via email.\n\n`;
    message += `Thank you for your patience! 🙏`;

    return message;
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 standard
   */
  static formatPhoneNumber(phoneNumber: string, countryCode: string = '+1'): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (!digits.startsWith(countryCode.replace('+', ''))) {
      return `${countryCode}${digits}`;
    }
    
    return `+${digits}`;
  }
}
