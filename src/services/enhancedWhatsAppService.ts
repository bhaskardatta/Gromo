import twilio from 'twilio';
import { logger } from '../utils/logger';
import { config } from '../config/config';

interface WhatsAppTemplate {
  name: string;
  language: string;
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    parameters?: Array<{
      type: 'text' | 'currency' | 'date_time';
      text?: string;
    }>;
  }>;
}

interface WhatsAppBusinessMessage {
  to: string;
  type: 'text' | 'template' | 'interactive';
  text?: {
    body: string;
  };
  template?: WhatsAppTemplate;
  interactive?: {
    type: 'button' | 'list';
    body: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      sections?: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
          context?: {
            from: string;
            id: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
  deliveryStatus?: 'sent' | 'delivered' | 'read' | 'failed';
}

export class EnhancedWhatsAppService {
  private static twilioClient: twilio.Twilio | null = null;
  private static messageStatusCallbacks = new Map<string, (status: string) => void>();
  
  /**
   * Initialize Twilio client for WhatsApp Business API
   */
  private static initializeTwilio(): twilio.Twilio {
    if (!this.twilioClient) {
      const twilioConfig = config.getTwilio();
      
      if (!twilioConfig.accountSid || !twilioConfig.authToken) {
        throw new Error('Twilio WhatsApp credentials not configured');
      }

      this.twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);
      logger.info('Enhanced WhatsApp service initialized with Twilio');
    }

    return this.twilioClient;
  }

  /**
   * Send WhatsApp Business message with templates
   */
  static async sendBusinessMessage(message: WhatsAppBusinessMessage): Promise<WhatsAppMessageResult> {
    try {
      const client = this.initializeTwilio();
      const twilioConfig = config.getTwilio();
      
      const messageBody: any = {
        from: `whatsapp:${twilioConfig.whatsAppNumber}`,
        to: `whatsapp:${message.to}`
      };

      switch (message.type) {
        case 'text':
          if (message.text) {
            messageBody.body = message.text.body;
          }
          break;
          
        case 'template':
          if (message.template) {
            // Twilio's Content API for WhatsApp templates
            messageBody.contentSid = message.template.name;
            messageBody.contentVariables = JSON.stringify(
              message.template.components.reduce((vars, comp) => {
                if (comp.parameters) {
                  comp.parameters.forEach((param, index) => {
                    vars[`${comp.type}_${index}`] = param.text || '';
                  });
                }
                return vars;
              }, {} as Record<string, string>)
            );
          }
          break;
          
        case 'interactive':
          // For interactive messages, we'll fall back to regular text with buttons simulation
          if (message.interactive) {
            let interactiveBody = message.interactive.body.text;
            
            if (message.interactive.action.buttons) {
              interactiveBody += '\\n\\nOptions:';
              message.interactive.action.buttons.forEach((button, index) => {
                interactiveBody += `\\n${index + 1}. ${button.reply.title}`;
              });
            }
            
            if (message.interactive.action.sections) {
              interactiveBody += '\\n\\nMenu:';
              message.interactive.action.sections.forEach(section => {
                interactiveBody += `\\n\\n*${section.title}*`;
                section.rows.forEach((row, index) => {
                  interactiveBody += `\\n${index + 1}. ${row.title}`;
                  if (row.description) {
                    interactiveBody += ` - ${row.description}`;
                  }
                });
              });
            }
            
            messageBody.body = interactiveBody;
          }
          break;
      }

      logger.info(`Sending WhatsApp Business message to ${message.to}`, {
        type: message.type,
        hasTemplate: !!message.template,
        hasInteractive: !!message.interactive
      });

      const twilioMessage = await client.messages.create(messageBody);
      
      logger.info(`WhatsApp Business message sent successfully: ${twilioMessage.sid}`);

      return {
        success: true,
        messageId: twilioMessage.sid,
        timestamp: new Date(),
        deliveryStatus: 'sent'
      };
    } catch (error) {
      logger.error('Error sending WhatsApp Business message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Send templated claim notification
   */
  static async sendClaimNotificationTemplate(
    phoneNumber: string,
    claimId: string,
    claimType: string,
    status: string,
    amount?: number
  ): Promise<WhatsAppMessageResult> {
    const message: WhatsAppBusinessMessage = {
      to: phoneNumber,
      type: 'template',
      template: {
        name: 'claim_notification',
        language: 'en',
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'text',
                text: 'Gromo Insurance'
              }
            ]
          },
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: claimId
              },
              {
                type: 'text',
                text: claimType
              },
              {
                type: 'text',
                text: status
              },
              {
                type: 'currency',
                text: amount ? `$${amount.toFixed(2)}` : 'TBD'
              }
            ]
          }
        ]
      }
    };

    return await this.sendBusinessMessage(message);
  }

  /**
   * Send interactive claim status menu
   */
  static async sendClaimStatusMenu(phoneNumber: string, claims: Array<{id: string, type: string, status: string}>): Promise<WhatsAppMessageResult> {
    const message: WhatsAppBusinessMessage = {
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: 'Select a claim to view details:'
        },
        action: {
          sections: [
            {
              title: 'Your Claims',
              rows: claims.map(claim => ({
                id: claim.id,
                title: `${claim.type} - ${claim.id.substring(0, 8)}`,
                description: `Status: ${claim.status}`
              }))
            }
          ]
        }
      }
    };

    return await this.sendBusinessMessage(message);
  }

  /**
   * Send claim action buttons
   */
  static async sendClaimActionButtons(
    phoneNumber: string,
    claimId: string,
    actions: string[]
  ): Promise<WhatsAppMessageResult> {
    const message: WhatsAppBusinessMessage = {
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: `What would you like to do with claim ${claimId}?`
        },
        action: {
          buttons: actions.slice(0, 3).map((action, index) => ({
            type: 'reply',
            reply: {
              id: `action_${index}`,
              title: action
            }
          }))
        }
      }
    };

    return await this.sendBusinessMessage(message);
  }

  /**
   * Handle WhatsApp webhook for delivery status and incoming messages
   */
  static handleWebhook(payload: WhatsAppWebhookPayload): {
    processedMessages: number;
    processedStatuses: number;
  } {
    let processedMessages = 0;
    let processedStatuses = 0;

    try {
      payload.entry.forEach(entry => {
        entry.changes.forEach(change => {
          // Handle incoming messages
          if (change.value.messages) {
            change.value.messages.forEach(message => {
              this.processIncomingMessage(message, change.value.metadata);
              processedMessages++;
            });
          }

          // Handle message status updates
          if (change.value.statuses) {
            change.value.statuses.forEach(status => {
              this.processMessageStatus(status);
              processedStatuses++;
            });
          }
        });
      });

      logger.info('WhatsApp webhook processed', {
        processedMessages,
        processedStatuses
      });

    } catch (error) {
      logger.error('Error processing WhatsApp webhook:', error);
    }

    return { processedMessages, processedStatuses };
  }

  /**
   * Process incoming WhatsApp message
   */
  private static processIncomingMessage(
    message: any,
    metadata: any
  ): void {
    logger.info('Processing incoming WhatsApp message', {
      from: message.from,
      messageId: message.id,
      type: message.type,
      timestamp: message.timestamp
    });

    // Here you would implement business logic for handling customer responses
    // For example:
    // - Claim status inquiries
    // - Document submissions
    // - Customer support requests
    
    if (message.text?.body) {
      const messageBody = message.text.body.toLowerCase();
      
      // Auto-respond to common queries
      if (messageBody.includes('status') || messageBody.includes('claim')) {
        this.sendAutoResponse(message.from, 'claim_status_inquiry');
      } else if (messageBody.includes('help') || messageBody.includes('support')) {
        this.sendAutoResponse(message.from, 'support_request');
      }
    }
  }

  /**
   * Process message delivery status
   */
  private static processMessageStatus(status: any): void {
    logger.info('Message status update', {
      messageId: status.id,
      status: status.status,
      timestamp: status.timestamp,
      recipientId: status.recipient_id
    });

    // Execute callback if registered
    const callback = this.messageStatusCallbacks.get(status.id);
    if (callback) {
      callback(status.status);
      this.messageStatusCallbacks.delete(status.id);
    }
  }

  /**
   * Send automated response based on inquiry type
   */
  private static async sendAutoResponse(
    phoneNumber: string,
    inquiryType: 'claim_status_inquiry' | 'support_request'
  ): Promise<void> {
    let responseMessage: WhatsAppBusinessMessage;

    switch (inquiryType) {
      case 'claim_status_inquiry':
        responseMessage = {
          to: phoneNumber,
          type: 'text',
          text: {
            body: '🔍 I can help you check your claim status! Please reply with your claim ID, or type "MENU" to see all your claims.'
          }
        };
        break;
        
      case 'support_request':
        responseMessage = {
          to: phoneNumber,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: '🆘 How can I help you today?'
            },
            action: {
              buttons: [
                {
                  type: 'reply',
                  reply: {
                    id: 'claim_inquiry',
                    title: 'Claim Status'
                  }
                },
                {
                  type: 'reply',
                  reply: {
                    id: 'new_claim',
                    title: 'File New Claim'
                  }
                },
                {
                  type: 'reply',
                  reply: {
                    id: 'agent_help',
                    title: 'Talk to Agent'
                  }
                }
              ]
            }
          }
        };
        break;
    }

    await this.sendBusinessMessage(responseMessage);
  }

  /**
   * Register callback for message delivery status
   */
  static registerStatusCallback(messageId: string, callback: (status: string) => void): void {
    this.messageStatusCallbacks.set(messageId, callback);
    
    // Auto-cleanup after 24 hours
    setTimeout(() => {
      this.messageStatusCallbacks.delete(messageId);
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Get delivery statistics
   */
  static getDeliveryStats(): {
    pendingCallbacks: number;
    totalSent: number;
  } {
    return {
      pendingCallbacks: this.messageStatusCallbacks.size,
      totalSent: 0 // This would be tracked in a persistent store in production
    };
  }

  /**
   * Validate phone number format for WhatsApp
   */
  static validatePhoneNumber(phoneNumber: string): {
    isValid: boolean;
    formatted?: string;
    error?: string;
  } {
    try {
      // Remove all non-digit characters except +
      let cleaned = phoneNumber.replace(/[^+\d]/g, '');
      
      // Add + if missing
      if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
      }
      
      // Basic validation - should be 10-15 digits
      const digits = cleaned.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        return {
          isValid: false,
          error: 'Phone number must be 10-15 digits'
        };
      }
      
      return {
        isValid: true,
        formatted: cleaned
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid phone number format'
      };
    }
  }
}

export {
  WhatsAppTemplate,
  WhatsAppBusinessMessage,
  WhatsAppWebhookPayload,
  WhatsAppMessageResult
};
