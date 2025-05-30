import { logger } from '../utils/logger';
import { config } from '../config/config';

// Google Dialogflow integration
const dialogflow = require('@google-cloud/dialogflow');

interface DialogflowConfig {
    projectId: string;
    sessionId: string;
    languageCode: string;
    credentialsPath?: string;
}

interface DialogflowResponse {
    queryText: string;
    intentName: string;
    fulfillmentText: string;
    confidence: number;
    parameters: Record<string, any>;
    contexts: any[];
    followupIntents: string[];
    webhookPayload?: any;
}

interface ConversationContext {
    userId: string;
    claimId?: string;
    sessionId: string;
    conversationHistory: Array<{
        timestamp: Date;
        userInput: string;
        botResponse: string;
        intent: string;
        confidence: number;
    }>;
    userPreferences: {
        language: string;
        communicationStyle: 'formal' | 'casual' | 'technical';
        preferredChannel: 'text' | 'voice' | 'whatsapp';
    };
    claimContext?: {
        claimId: string;
        claimType: string;
        status: string;
        documents: string[];
        lastUpdate: Date;
    };
}

export class DialogflowCopilotService {
    private static sessionsClient: any = null;
    private static isProduction = process.env.NODE_ENV === 'production';
    private static conversationStore = new Map<string, ConversationContext>();

    /**
     * Initialize Dialogflow client
     */
    private static initializeDialogflow() {
        if (!this.sessionsClient && this.isProduction && config.google?.projectId) {
            try {
                this.sessionsClient = new dialogflow.SessionsClient({
                    projectId: config.google.projectId,
                    keyFilename: config.google.credentialsPath
                });
                logger.info('Dialogflow client initialized successfully');
            } catch (error) {
                logger.warn('Failed to initialize Dialogflow client:', error);
                this.sessionsClient = null;
            }
        }
    }

    /**
     * Process user query through Dialogflow
     */
    static async processQuery(
        query: string,
        dialogflowConfig: DialogflowConfig,
        context?: Partial<ConversationContext>
    ): Promise<DialogflowResponse> {
        try {
            this.initializeDialogflow();

            if (this.sessionsClient && this.isProduction) {
                return await this.processRealDialogflow(query, dialogflowConfig, context);
            } else {
                return await this.processMockDialogflow(query, dialogflowConfig, context);
            }
        } catch (error) {
            logger.error('Error processing Dialogflow query:', error);
            throw new Error('Failed to process query');
        }
    }

    /**
     * Process query with real Dialogflow
     */
    private static async processRealDialogflow(
        query: string,
        dialogflowConfig: DialogflowConfig,
        context?: Partial<ConversationContext>
    ): Promise<DialogflowResponse> {
        const sessionPath = this.sessionsClient.projectAgentSessionPath(
            dialogflowConfig.projectId,
            dialogflowConfig.sessionId
        );

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: query,
                    languageCode: dialogflowConfig.languageCode,
                },
            },
            queryParams: {
                contexts: this.buildContexts(context),
                payload: this.buildPayload(context)
            }
        };

        const [response] = await this.sessionsClient.detectIntent(request);
        const result = response.queryResult;

        return {
            queryText: result.queryText,
            intentName: result.intent?.displayName || 'unknown',
            fulfillmentText: result.fulfillmentText,
            confidence: result.intentDetectionConfidence || 0,
            parameters: result.parameters?.fields || {},
            contexts: result.outputContexts || [],
            followupIntents: result.followupEventInput ? [result.followupEventInput.name] : [],
            webhookPayload: result.webhookPayload
        };
    }

    /**
     * Process query with mock Dialogflow for development
     */
    private static async processMockDialogflow(
        query: string,
        dialogflowConfig: DialogflowConfig,
        context?: Partial<ConversationContext>
    ): Promise<DialogflowResponse> {
        logger.info('Using mock Dialogflow service for development');

        // Simulate intelligent intent detection
        const intent = this.detectMockIntent(query);
        const response = this.generateMockResponse(query, intent, context);

        return {
            queryText: query,
            intentName: intent.name,
            fulfillmentText: response,
            confidence: intent.confidence,
            parameters: intent.parameters,
            contexts: [],
            followupIntents: intent.followupIntents || []
        };
    }

    /**
     * Detect intent from query (mock implementation)
     */
    private static detectMockIntent(query: string) {
        const lowercaseQuery = query.toLowerCase();

        // Claim submission intents
        if (lowercaseQuery.includes('submit') || lowercaseQuery.includes('file') || lowercaseQuery.includes('new claim')) {
            return {
                name: 'claim.submit',
                confidence: 0.95,
                parameters: { claimType: this.extractClaimType(query) },
                followupIntents: ['claim.documents.upload']
            };
        }

        // Claim status intents
        if (lowercaseQuery.includes('status') || lowercaseQuery.includes('track') || lowercaseQuery.includes('progress')) {
            return {
                name: 'claim.status',
                confidence: 0.90,
                parameters: { claimId: this.extractClaimId(query) }
            };
        }

        // Document upload intents
        if (lowercaseQuery.includes('upload') || lowercaseQuery.includes('document') || lowercaseQuery.includes('attach')) {
            return {
                name: 'claim.documents.upload',
                confidence: 0.88,
                parameters: { documentType: this.extractDocumentType(query) }
            };
        }

        // Help and support intents
        if (lowercaseQuery.includes('help') || lowercaseQuery.includes('support') || lowercaseQuery.includes('how')) {
            return {
                name: 'support.help',
                confidence: 0.85,
                parameters: { topic: this.extractHelpTopic(query) }
            };
        }

        // Escalation intents
        if (lowercaseQuery.includes('escalate') || lowercaseQuery.includes('manager') || lowercaseQuery.includes('complaint')) {
            return {
                name: 'support.escalate',
                confidence: 0.92,
                parameters: { reason: this.extractEscalationReason(query) }
            };
        }

        // Default fallback
        return {
            name: 'default.fallback',
            confidence: 0.30,
            parameters: {}
        };
    }

    /**
     * Generate contextual response based on intent
     */
    private static generateMockResponse(query: string, intent: any, context?: Partial<ConversationContext>): string {
        const userName = context?.userId ? `user ${context.userId}` : 'there';

        switch (intent.name) {
            case 'claim.submit':
                return `Hi ${userName}! I'd be happy to help you submit a new ${intent.parameters.claimType || 'insurance'} claim. Let me guide you through the process. First, I'll need some basic information about the incident. Could you please tell me when the incident occurred?`;

            case 'claim.status':
                const claimId = intent.parameters.claimId || context?.claimContext?.claimId || 'your claim';
                return `Let me check the status of ${claimId} for you. Based on our records, your claim is currently being processed. I can provide you with detailed updates. Would you like me to explain the current stage and next steps?`;

            case 'claim.documents.upload':
                return `Perfect! I can help you upload your documents. For ${intent.parameters.documentType || 'claim'} documents, please ensure they are in PDF, JPG, or PNG format and under 50MB. You can upload them through our secure portal or send them via WhatsApp. Which method would you prefer?`;

            case 'support.help':
                return `I'm here to help you with ${intent.parameters.topic || 'your insurance needs'}! I can assist you with claim submissions, status updates, document uploads, and general questions. What specific information are you looking for?`;

            case 'support.escalate':
                return `I understand your concern about ${intent.parameters.reason || 'this matter'}. I'm escalating your case to our specialized team who will contact you within 2 hours. Meanwhile, I'll do my best to assist you. Could you please provide more details about the issue?`;

            default:
                return `I understand you're asking about "${query}". While I process your request, let me help you with what I can do: I can help you submit claims, check claim status, upload documents, or connect you with support. What would you like to do today?`;
        }
    }

    /**
     * Manage conversation context
     */
    static async updateConversationContext(
        userId: string,
        userInput: string,
        botResponse: string,
        intent: string,
        confidence: number,
        claimContext?: any
    ): Promise<void> {
        try {
            let context = this.conversationStore.get(userId);

            if (!context) {
                context = {
                    userId,
                    sessionId: `session_${userId}_${Date.now()}`,
                    conversationHistory: [],
                    userPreferences: {
                        language: 'en',
                        communicationStyle: 'casual',
                        preferredChannel: 'text'
                    }
                };
            }

            // Add to conversation history
            context.conversationHistory.push({
                timestamp: new Date(),
                userInput,
                botResponse,
                intent,
                confidence
            });

            // Update claim context if provided
            if (claimContext) {
                context.claimContext = claimContext;
                context.claimId = claimContext.claimId;
            }

            // Keep only last 20 conversations for memory efficiency
            if (context.conversationHistory.length > 20) {
                context.conversationHistory = context.conversationHistory.slice(-20);
            }

            this.conversationStore.set(userId, context);
            
            logger.info(`Updated conversation context for user ${userId}, intent: ${intent}`);
        } catch (error) {
            logger.error('Error updating conversation context:', error);
        }
    }

    /**
     * Get conversation context
     */
    static getConversationContext(userId: string): ConversationContext | undefined {
        return this.conversationStore.get(userId);
    }

    /**
     * Generate smart suggestions based on context
     */
    static generateSmartSuggestions(context: ConversationContext): string[] {
        const suggestions: string[] = [];

        // Based on claim context
        if (context.claimContext) {
            switch (context.claimContext.status) {
                case 'pending_documents':
                    suggestions.push('Upload missing documents', 'Check required documents list');
                    break;
                case 'under_review':
                    suggestions.push('Check review status', 'Provide additional information');
                    break;
                case 'approved':
                    suggestions.push('Check settlement details', 'Download approval letter');
                    break;
            }
        }

        // Based on conversation history
        const lastIntent = context.conversationHistory[context.conversationHistory.length - 1]?.intent;
        switch (lastIntent) {
            case 'claim.submit':
                suggestions.push('Upload supporting documents', 'Check submission status');
                break;
            case 'support.help':
                suggestions.push('Submit a new claim', 'Track existing claim', 'Contact support');
                break;
        }

        // Default suggestions
        if (suggestions.length === 0) {
            suggestions.push('Submit new claim', 'Check claim status', 'Upload documents', 'Get help');
        }

        return suggestions.slice(0, 4); // Limit to 4 suggestions
    }

    // Helper methods for intent detection
    private static extractClaimType(query: string): string {
        if (query.toLowerCase().includes('accident') || query.toLowerCase().includes('vehicle')) return 'accident';
        if (query.toLowerCase().includes('medical') || query.toLowerCase().includes('health')) return 'medical';
        if (query.toLowerCase().includes('pharmacy') || query.toLowerCase().includes('medicine')) return 'pharmacy';
        return 'general';
    }

    private static extractClaimId(query: string): string | null {
        const claimIdMatch = query.match(/claim\s*(?:id|number)?\s*[:#]?\s*([a-zA-Z0-9]+)/i);
        return claimIdMatch ? claimIdMatch[1] : null;
    }

    private static extractDocumentType(query: string): string {
        if (query.toLowerCase().includes('receipt')) return 'receipt';
        if (query.toLowerCase().includes('bill')) return 'bill';
        if (query.toLowerCase().includes('report')) return 'report';
        if (query.toLowerCase().includes('certificate')) return 'certificate';
        return 'general';
    }

    private static extractHelpTopic(query: string): string {
        if (query.toLowerCase().includes('claim')) return 'claims';
        if (query.toLowerCase().includes('document')) return 'documents';
        if (query.toLowerCase().includes('payment')) return 'payments';
        return 'general';
    }

    private static extractEscalationReason(query: string): string {
        if (query.toLowerCase().includes('delay')) return 'processing_delay';
        if (query.toLowerCase().includes('reject')) return 'claim_rejection';
        if (query.toLowerCase().includes('payment')) return 'payment_issue';
        return 'general_complaint';
    }

    private static buildContexts(context?: Partial<ConversationContext>): any[] {
        const contexts: any[] = [];

        if (context?.claimContext) {
            contexts.push({
                name: 'claim-context',
                lifespanCount: 5,
                parameters: {
                    claimId: context.claimContext.claimId,
                    claimType: context.claimContext.claimType,
                    status: context.claimContext.status
                }
            });
        }

        if (context?.userPreferences) {
            contexts.push({
                name: 'user-preferences',
                lifespanCount: 10,
                parameters: {
                    language: context.userPreferences.language,
                    communicationStyle: context.userPreferences.communicationStyle
                }
            });
        }

        return contexts;
    }

    private static buildPayload(context?: Partial<ConversationContext>): any {
        return {
            userId: context?.userId,
            sessionId: context?.sessionId,
            conversationHistory: context?.conversationHistory?.slice(-3) // Last 3 exchanges
        };
    }

    /**
     * Clean up old conversation contexts
     */
    static cleanupOldContexts(): void {
        const now = new Date();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const [userId, context] of this.conversationStore.entries()) {
            const lastActivity = context.conversationHistory[context.conversationHistory.length - 1]?.timestamp;
            if (lastActivity && (now.getTime() - lastActivity.getTime()) > maxAge) {
                this.conversationStore.delete(userId);
                logger.info(`Cleaned up old conversation context for user ${userId}`);
            }
        }
    }
}
