import { IClaim } from '../models/Claim';
import { IUser } from '../models/User';
import { logger } from '../utils/logger';

interface EscalationRequest {
  claimId: string;
  userId: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  additionalInfo?: string;
}

interface EscalationLevel {
  level: number;
  name: string;
  description: string;
  maxResponseTime: number; // in hours
  confirmationRequired: boolean;
}

interface EscalationStatus {
  currentLevel: number;
  status: 'pending' | 'confirmed' | 'escalated' | 'resolved';
  assignedAgent?: string;
  estimatedResponseTime: number;
  confirmationDeadline?: Date;
  escalationHistory: Array<{
    level: number;
    timestamp: Date;
    reason: string;
    agent?: string;
  }>;
}

export class EscalationService {
  private static readonly ESCALATION_LEVELS: EscalationLevel[] = [
    {
      level: 1,
      name: 'Automated Processing',
      description: 'Standard automated claim processing',
      maxResponseTime: 24,
      confirmationRequired: false
    },
    {
      level: 2,
      name: 'Tier 1 Agent Review',
      description: 'Basic agent review and verification',
      maxResponseTime: 4,
      confirmationRequired: true
    },
    {
      level: 3,
      name: 'Senior Agent Investigation',
      description: 'Detailed investigation by senior agent',
      maxResponseTime: 2,
      confirmationRequired: true
    },
    {
      level: 4,
      name: 'Specialist Review',
      description: 'Expert specialist review for complex cases',
      maxResponseTime: 1,
      confirmationRequired: true
    }
  ];

  /**
   * Determines if a claim should be escalated based on various factors
   */
  static shouldEscalate(claim: IClaim, fraudScore?: number): { shouldEscalate: boolean; reason: string; level: number } {
    try {
      // High-value claims
      if (claim.estimatedAmount && claim.estimatedAmount > 25000) {
        return {
          shouldEscalate: true,
          reason: 'High-value claim requires agent review',
          level: 2
        };
      }

      // High fraud risk
      if (fraudScore && fraudScore >= 50) {
        return {
          shouldEscalate: true,
          reason: 'High fraud risk detected',
          level: 3
        };
      }

      // Medium fraud risk with additional factors
      if (fraudScore && fraudScore >= 25) {
        const docCount = claim.documents?.length || 0;
        if (docCount < 2) {
          return {
            shouldEscalate: true,
            reason: 'Medium fraud risk with insufficient documentation',
            level: 2
          };
        }
      }

      // Complex claim types
      if (claim.type === 'accident' && claim.estimatedAmount && claim.estimatedAmount > 10000) {
        return {
          shouldEscalate: true,
          reason: 'Complex accident claim requires investigation',
          level: 2
        };
      }

      // Multiple previous escalations
      if (claim.escalationHistory && claim.escalationHistory.length > 1) {
        return {
          shouldEscalate: true,
          reason: 'Repeated escalations indicate complex case',
          level: 3
        };
      }

      // Low voice confidence with high claim amount
      if (claim.voiceData?.confidence && claim.voiceData.confidence < 0.6 && 
          claim.estimatedAmount && claim.estimatedAmount > 5000) {
        return {
          shouldEscalate: true,
          reason: 'Low voice confidence on significant claim',
          level: 2
        };
      }

      return {
        shouldEscalate: false,
        reason: 'Claim meets automated processing criteria',
        level: 1
      };
    } catch (error) {
      logger.error('Error determining escalation need:', error);
      return {
        shouldEscalate: true,
        reason: 'Error in automated processing',
        level: 2
      };
    }
  }

  /**
   * Creates an escalation request
   */
  static async createEscalation(request: EscalationRequest): Promise<EscalationStatus> {
    try {
      logger.info(`Creating escalation for claim ${request.claimId}`);

      // Determine escalation level based on urgency and reason
      let targetLevel = 2; // Default to Tier 1 Agent
      
      if (request.urgency === 'critical') {
        targetLevel = 4;
      } else if (request.urgency === 'high') {
        targetLevel = 3;
      } else if (request.urgency === 'medium') {
        targetLevel = 2;
      }

      // Get escalation level details
      const escalationLevel = this.ESCALATION_LEVELS.find(level => level.level === targetLevel);
      if (!escalationLevel) {
        throw new Error(`Invalid escalation level: ${targetLevel}`);
      }

      // Calculate confirmation deadline if required
      let confirmationDeadline: Date | undefined;
      if (escalationLevel.confirmationRequired) {
        confirmationDeadline = new Date();
        confirmationDeadline.setHours(confirmationDeadline.getHours() + escalationLevel.maxResponseTime);
      }

      // Create escalation status
      const escalationStatus: EscalationStatus = {
        currentLevel: targetLevel,
        status: 'pending',
        estimatedResponseTime: escalationLevel.maxResponseTime,
        confirmationDeadline,
        escalationHistory: [
          {
            level: targetLevel,
            timestamp: new Date(),
            reason: request.reason
          }
        ]
      };

      // Assign agent based on level (mock implementation)
      if (targetLevel >= 2) {
        escalationStatus.assignedAgent = this.assignAgent(targetLevel, request.urgency);
      }

      logger.info(`Escalation created for claim ${request.claimId} at level ${targetLevel}`);

      return escalationStatus;
    } catch (error) {
      logger.error('Error creating escalation:', error);
      throw new Error('Failed to create escalation request');
    }
  }

  /**
   * Processes agent confirmation for escalated claims
   */
  static async processConfirmation(
    claimId: string, 
    agentId: string, 
    action: 'confirm' | 'escalate' | 'resolve',
    notes?: string
  ): Promise<EscalationStatus> {
    try {
      logger.info(`Processing confirmation for claim ${claimId} by agent ${agentId}: ${action}`);

      // This would typically fetch the current escalation status from database
      // For now, we'll simulate the response
      
      const currentTime = new Date();
      
      if (action === 'confirm') {
        return {
          currentLevel: 2,
          status: 'confirmed',
          assignedAgent: agentId,
          estimatedResponseTime: 2,
          escalationHistory: [
            {
              level: 2,
              timestamp: currentTime,
              reason: 'Agent confirmed claim for processing',
              agent: agentId
            }
          ]
        };
      } else if (action === 'escalate') {
        const nextLevel = 3; // Escalate to senior agent
        return {
          currentLevel: nextLevel,
          status: 'escalated',
          assignedAgent: this.assignAgent(nextLevel, 'high'),
          estimatedResponseTime: 1,
          confirmationDeadline: new Date(currentTime.getTime() + 60 * 60 * 1000), // 1 hour
          escalationHistory: [
            {
              level: 2,
              timestamp: new Date(currentTime.getTime() - 60 * 60 * 1000),
              reason: 'Initial escalation',
              agent: agentId
            },
            {
              level: nextLevel,
              timestamp: currentTime,
              reason: notes || 'Escalated for further investigation',
              agent: agentId
            }
          ]
        };
      } else if (action === 'resolve') {
        return {
          currentLevel: 2,
          status: 'resolved',
          assignedAgent: agentId,
          estimatedResponseTime: 0,
          escalationHistory: [
            {
              level: 2,
              timestamp: currentTime,
              reason: notes || 'Claim resolved by agent',
              agent: agentId
            }
          ]
        };
      }

      throw new Error(`Invalid action: ${action}`);
    } catch (error) {
      logger.error('Error processing confirmation:', error);
      throw new Error('Failed to process agent confirmation');
    }
  }

  /**
   * Gets escalation requirements for a specific level
   */
  static getEscalationRequirements(level: number): EscalationLevel | null {
    return this.ESCALATION_LEVELS.find(l => l.level === level) || null;
  }

  /**
   * Checks if escalation confirmation has expired
   */
  static isConfirmationExpired(escalationStatus: EscalationStatus): boolean {
    if (!escalationStatus.confirmationDeadline) {
      return false;
    }
    
    return new Date() > escalationStatus.confirmationDeadline;
  }

  /**
   * Gets next escalation level
   */
  static getNextEscalationLevel(currentLevel: number): EscalationLevel | null {
    const nextLevel = currentLevel + 1;
    return this.ESCALATION_LEVELS.find(level => level.level === nextLevel) || null;
  }

  /**
   * Calculates priority score for agent assignment
   */
  static calculatePriorityScore(
    urgency: 'low' | 'medium' | 'high' | 'critical',
    claimAmount?: number,
    waitTime?: number
  ): number {
    let score = 0;

    // Base urgency score
    switch (urgency) {
      case 'critical':
        score += 100;
        break;
      case 'high':
        score += 75;
        break;
      case 'medium':
        score += 50;
        break;
      case 'low':
        score += 25;
        break;
    }

    // Claim amount factor
    if (claimAmount) {
      if (claimAmount > 50000) score += 30;
      else if (claimAmount > 25000) score += 20;
      else if (claimAmount > 10000) score += 10;
    }

    // Wait time factor (increase priority for longer waits)
    if (waitTime) {
      score += Math.min(25, waitTime * 5); // Max 25 points for wait time
    }

    return score;
  }

  /**
   * Mock agent assignment based on level and urgency
   */
  private static assignAgent(level: number, urgency: 'low' | 'medium' | 'high' | 'critical'): string {
    const agents = {
      2: ['agent_t1_001', 'agent_t1_002', 'agent_t1_003'],
      3: ['agent_senior_001', 'agent_senior_002'],
      4: ['specialist_001', 'specialist_002']
    };

    const availableAgents = agents[level as keyof typeof agents] || ['agent_default'];
    
    // Simple round-robin assignment (in real implementation, this would check availability)
    const agentIndex = Math.floor(Math.random() * availableAgents.length);
    return availableAgents[agentIndex];
  }

  /**
   * Formats escalation status for client response
   */
  static formatEscalationResponse(status: EscalationStatus): any {
    const currentLevel = this.ESCALATION_LEVELS.find(level => level.level === status.currentLevel);
    
    return {
      level: status.currentLevel,
      levelName: currentLevel?.name || 'Unknown',
      status: status.status,
      estimatedResponseTime: status.estimatedResponseTime,
      assignedAgent: status.assignedAgent,
      confirmationDeadline: status.confirmationDeadline,
      requiresConfirmation: currentLevel?.confirmationRequired || false,
      history: status.escalationHistory.map(entry => ({
        level: entry.level,
        levelName: this.ESCALATION_LEVELS.find(l => l.level === entry.level)?.name || 'Unknown',
        timestamp: entry.timestamp,
        reason: entry.reason,
        agent: entry.agent
      }))
    };
  }

  /**
   * Trigger agent escalation for urgent cases
   */
  static async triggerAgentEscalation(claimId: string, reason: string, urgency: 'high' | 'critical' = 'high'): Promise<EscalationStatus> {
    logger.info(`Triggering agent escalation for claim ${claimId}`);
    
    try {
      const escalationRequest: EscalationRequest = {
        claimId,
        userId: 'system',
        reason,
        urgency
      };

      // Automatically escalate to level 3 for urgent cases
      const targetLevel = urgency === 'critical' ? 4 : 3;
      
      return await this.processEscalation(escalationRequest, targetLevel);
    } catch (error) {
      logger.error('Error triggering agent escalation:', error);
      throw new Error('Failed to trigger agent escalation');
    }
  }

  /**
   * Process escalation to a specific level
   */
  private static async processEscalation(request: EscalationRequest, targetLevel: number): Promise<EscalationStatus> {
    try {
      logger.info(`Processing escalation for claim ${request.claimId} to level ${targetLevel}`);

      // Get escalation level details
      const escalationLevel = this.ESCALATION_LEVELS.find(level => level.level === targetLevel);
      if (!escalationLevel) {
        throw new Error(`Invalid escalation level: ${targetLevel}`);
      }

      // Calculate confirmation deadline if required
      let confirmationDeadline: Date | undefined;
      if (escalationLevel.confirmationRequired) {
        confirmationDeadline = new Date();
        confirmationDeadline.setHours(confirmationDeadline.getHours() + escalationLevel.maxResponseTime);
      }

      // Create escalation status
      const escalationStatus: EscalationStatus = {
        currentLevel: targetLevel,
        status: 'pending',
        estimatedResponseTime: escalationLevel.maxResponseTime,
        confirmationDeadline,
        escalationHistory: [
          {
            level: targetLevel,
            timestamp: new Date(),
            reason: request.reason
          }
        ]
      };

      // Assign agent based on level
      if (targetLevel >= 2) {
        escalationStatus.assignedAgent = this.assignAgent(targetLevel, request.urgency);
      }

      logger.info(`Escalation processed for claim ${request.claimId} at level ${targetLevel}`);

      return escalationStatus;
    } catch (error) {
      logger.error('Error processing escalation:', error);
      throw new Error('Failed to process escalation request');
    }
  }
}

// Export the main function for external use
export const triggerAgentEscalation = EscalationService.triggerAgentEscalation;
