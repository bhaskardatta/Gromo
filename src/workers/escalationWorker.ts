import { Worker, Job, Queue } from 'bullmq';
import { EscalationService } from '../services/escalationService';
import { NotificationWorker } from './notificationWorker';
import { logger } from '../utils/logger';
import IORedis from 'ioredis';

interface EscalationJobData {
  type: 'create_escalation' | 'check_timeout' | 'process_confirmation' | 'auto_escalate';
  claimId: string;
  data: Record<string, any>;
  scheduleTime?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export class EscalationWorker {
  private worker: Worker;
  private queue: Queue;
  private redis: IORedis;
  private notificationWorker: NotificationWorker;

  constructor(notificationWorker: NotificationWorker) {
    this.notificationWorker = notificationWorker;

    // Initialize Redis connection
    this.redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    // Initialize BullMQ queue
    this.queue = new Queue('escalations', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 100,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    // Initialize worker
    this.worker = new Worker('escalations', this.processJob.bind(this), {
      connection: this.redis,
      concurrency: 3,
      limiter: {
        max: 5,
        duration: 1000 // 5 jobs per second
      }
    });

    this.setupEventHandlers();
  }

  /**
   * Process escalation job
   */
  private async processJob(job: Job<EscalationJobData>): Promise<void> {
    const { type, claimId, data } = job.data;

    try {
      logger.info(`Processing escalation job ${job.id}: ${type} for claim ${claimId}`);

      switch (type) {
        case 'create_escalation':
          await this.handleCreateEscalation(claimId, data);
          break;

        case 'check_timeout':
          await this.handleTimeoutCheck(claimId, data);
          break;

        case 'process_confirmation':
          await this.handleConfirmationProcessing(claimId, data);
          break;

        case 'auto_escalate':
          await this.handleAutoEscalation(claimId, data);
          break;

        default:
          throw new Error(`Unknown escalation job type: ${type}`);
      }

      logger.info(`Escalation job ${job.id} completed successfully`);
      await job.updateProgress(100);

    } catch (error) {
      logger.error(`Escalation job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Handle escalation creation
   */
  private async handleCreateEscalation(claimId: string, data: any): Promise<void> {
    try {
      const escalationRequest = {
        claimId,
        userId: data.userId,
        reason: data.reason,
        urgency: data.urgency,
        additionalInfo: data.additionalInfo
      };

      // Create escalation
      const escalationStatus = await EscalationService.createEscalation(escalationRequest);

      // Send notification to assigned agent
      if (escalationStatus.assignedAgent) {
        await this.notificationWorker.addNotificationJob({
          type: 'escalation_alert',
          recipient: this.getAgentContact(escalationStatus.assignedAgent),
          claimId,
          data: {
            escalationLevel: escalationStatus.currentLevel,
            urgency: data.urgency,
            reason: data.reason,
            assignedAgent: escalationStatus.assignedAgent
          },
          priority: data.urgency
        });
      }

      // Schedule timeout check if confirmation is required
      if (escalationStatus.confirmationDeadline) {
        const timeoutDelay = escalationStatus.confirmationDeadline.getTime() - Date.now();
        
        await this.addEscalationJob({
          type: 'check_timeout',
          claimId,
          data: {
            escalationLevel: escalationStatus.currentLevel,
            confirmationDeadline: escalationStatus.confirmationDeadline
          }
        }, { delay: timeoutDelay });
      }

      logger.info(`Escalation created for claim ${claimId} at level ${escalationStatus.currentLevel}`);

    } catch (error) {
      logger.error(`Error creating escalation for claim ${claimId}:`, error);
      throw error;
    }
  }

  /**
   * Handle timeout checking
   */
  private async handleTimeoutCheck(claimId: string, data: any): Promise<void> {
    try {
      const { escalationLevel, confirmationDeadline } = data;
      const deadline = new Date(confirmationDeadline);

      // Check if deadline has passed
      if (new Date() > deadline) {
        logger.warn(`Escalation timeout for claim ${claimId} at level ${escalationLevel}`);

        // Auto-escalate to next level
        const nextLevel = EscalationService.getNextEscalationLevel(escalationLevel);
        
        if (nextLevel) {
          await this.addEscalationJob({
            type: 'auto_escalate',
            claimId,
            data: {
              fromLevel: escalationLevel,
              toLevel: nextLevel.level,
              reason: 'Escalation timeout - no confirmation received'
            },
            priority: 'high'
          });
        } else {
          // No more escalation levels - send alert to management
          await this.notificationWorker.addNotificationJob({
            type: 'escalation_alert',
            recipient: process.env.MANAGEMENT_CONTACT || '+1234567890',
            claimId,
            data: {
              escalationLevel: escalationLevel,
              urgency: 'urgent',
              reason: 'Maximum escalation level reached without resolution',
              requiresImmediateAttention: true
            },
            priority: 'urgent'
          });
        }
      }

    } catch (error) {
      logger.error(`Error checking timeout for claim ${claimId}:`, error);
      throw error;
    }
  }

  /**
   * Handle confirmation processing
   */
  private async handleConfirmationProcessing(claimId: string, data: any): Promise<void> {
    try {
      const { agentId, action, notes } = data;

      // Process the confirmation
      const escalationStatus = await EscalationService.processConfirmation(
        claimId,
        agentId,
        action,
        notes
      );

      // Send appropriate notifications based on action
      if (action === 'confirm') {
        // Notify customer of confirmation
        await this.notificationWorker.addNotificationJob({
          type: 'status_update',
          recipient: data.customerContact,
          claimId,
          data: {
            status: 'Confirmed for Processing',
            additionalInfo: 'Your claim has been reviewed and confirmed by our agent.'
          },
          priority: 'medium'
        });

      } else if (action === 'escalate' && escalationStatus.assignedAgent) {
        // Notify new agent of escalation
        await this.notificationWorker.addNotificationJob({
          type: 'escalation_alert',
          recipient: this.getAgentContact(escalationStatus.assignedAgent),
          claimId,
          data: {
            escalationLevel: escalationStatus.currentLevel,
            urgency: 'high',
            reason: notes || 'Escalated for further investigation',
            previousAgent: agentId
          },
          priority: 'high'
        });

        // Schedule new timeout check if needed
        if (escalationStatus.confirmationDeadline) {
          const timeoutDelay = escalationStatus.confirmationDeadline.getTime() - Date.now();
          
          await this.addEscalationJob({
            type: 'check_timeout',
            claimId,
            data: {
              escalationLevel: escalationStatus.currentLevel,
              confirmationDeadline: escalationStatus.confirmationDeadline
            }
          }, { delay: timeoutDelay });
        }

      } else if (action === 'resolve') {
        // Notify customer of resolution
        await this.notificationWorker.addNotificationJob({
          type: 'status_update',
          recipient: data.customerContact,
          claimId,
          data: {
            status: 'Resolved',
            additionalInfo: notes || 'Your claim has been resolved by our team.'
          },
          priority: 'high'
        });
      }

      logger.info(`Confirmation processed for claim ${claimId}: ${action} by agent ${agentId}`);

    } catch (error) {
      logger.error(`Error processing confirmation for claim ${claimId}:`, error);
      throw error;
    }
  }

  /**
   * Handle auto-escalation
   */
  private async handleAutoEscalation(claimId: string, data: any): Promise<void> {
    try {
      const { fromLevel, toLevel, reason } = data;

      // Create new escalation at higher level
      const newEscalation = await EscalationService.createEscalation({
        claimId,
        userId: 'system',
        reason,
        urgency: 'high'
      });

      // Notify new agent
      if (newEscalation.assignedAgent) {
        await this.notificationWorker.addNotificationJob({
          type: 'escalation_alert',
          recipient: this.getAgentContact(newEscalation.assignedAgent),
          claimId,
          data: {
            escalationLevel: toLevel,
            urgency: 'urgent',
            reason: `Auto-escalated from Level ${fromLevel}: ${reason}`,
            isAutoEscalation: true
          },
          priority: 'urgent'
        });
      }

      // Schedule new timeout check
      if (newEscalation.confirmationDeadline) {
        const timeoutDelay = newEscalation.confirmationDeadline.getTime() - Date.now();
        
        await this.addEscalationJob({
          type: 'check_timeout',
          claimId,
          data: {
            escalationLevel: toLevel,
            confirmationDeadline: newEscalation.confirmationDeadline
          }
        }, { delay: timeoutDelay });
      }

      logger.info(`Auto-escalated claim ${claimId} from level ${fromLevel} to level ${toLevel}`);

    } catch (error) {
      logger.error(`Error auto-escalating claim ${claimId}:`, error);
      throw error;
    }
  }

  /**
   * Add escalation job to queue
   */
  async addEscalationJob(
    jobData: EscalationJobData,
    options?: {
      delay?: number;
      priority?: number;
      jobId?: string;
    }
  ): Promise<Job<EscalationJobData>> {
    try {
      const job = await this.queue.add('escalation', jobData, {
        priority: options?.priority || this.getPriorityScore(jobData),
        delay: options?.delay || 0,
        jobId: options?.jobId
      });

      logger.info(`Escalation job added to queue: ${job.id} (${jobData.type})`);
      return job;

    } catch (error) {
      logger.error('Error adding escalation job to queue:', error);
      throw new Error('Failed to queue escalation job');
    }
  }

  /**
   * Schedule escalation timeout check
   */
  async scheduleTimeoutCheck(
    claimId: string,
    escalationLevel: number,
    confirmationDeadline: Date
  ): Promise<Job<EscalationJobData>> {
    const delay = confirmationDeadline.getTime() - Date.now();
    
    return await this.addEscalationJob({
      type: 'check_timeout',
      claimId,
      data: {
        escalationLevel,
        confirmationDeadline
      }
    }, { delay });
  }

  /**
   * Cancel escalation job
   */
  async cancelEscalationJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info(`Escalation job ${jobId} cancelled`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error cancelling escalation job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getCompleted(),
      this.queue.getFailed(),
      this.queue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length
    };
  }

  /**
   * Get agent contact information (mock implementation)
   */
  private getAgentContact(agentId: string): string {
    // In real implementation, this would fetch from database
    const agentContacts: Record<string, string> = {
      'agent_t1_001': '+1234567001',
      'agent_t1_002': '+1234567002',
      'agent_t1_003': '+1234567003',
      'agent_senior_001': '+1234568001',
      'agent_senior_002': '+1234568002',
      'specialist_001': '+1234569001',
      'specialist_002': '+1234569002'
    };

    return agentContacts[agentId] || '+1234567000'; // Default contact
  }

  /**
   * Get priority score for job
   */
  private getPriorityScore(jobData: EscalationJobData): number {
    let priority = 50; // Default medium priority

    switch (jobData.priority) {
      case 'urgent':
        priority = 100;
        break;
      case 'high':
        priority = 75;
        break;
      case 'medium':
        priority = 50;
        break;
      case 'low':
        priority = 25;
        break;
    }

    // Boost priority for time-sensitive jobs
    if (jobData.type === 'check_timeout') {
      priority = Math.max(priority, 80);
    } else if (jobData.type === 'auto_escalate') {
      priority = Math.max(priority, 90);
    }

    return priority;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      logger.info(`Escalation job completed: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Escalation job failed: ${job?.id}`, err);
    });

    this.worker.on('progress', (job, progress) => {
      logger.debug(`Escalation job progress: ${job.id} - ${progress}%`);
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn(`Escalation job stalled: ${jobId}`);
    });

    this.worker.on('error', (err) => {
      logger.error('Escalation worker error:', err);
    });
  }

  /**
   * Start the worker
   */
  start(): void {
    logger.info('Escalation worker started');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down escalation worker...');
      await this.worker.close();
      await this.queue.close();
      await this.redis.disconnect();
      logger.info('Escalation worker shutdown complete');
    } catch (error) {
      logger.error('Error during escalation worker shutdown:', error);
    }
  }
}
