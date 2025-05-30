import { Worker, Job, Queue } from 'bullmq';
import { NotificationService } from '../services/notificationService';
import { logger } from '../utils/logger';
import IORedis from 'ioredis';

interface NotificationJobData {
  type: 'claim_confirmation' | 'escalation_alert' | 'fraud_alert' | 'status_update' | 'payout_notification';
  recipient: string;
  claimId: string;
  data: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  retries?: number;
  result?: {
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp: Date;
  };
}

export class NotificationWorker {
  private worker: Worker;
  private queue: Queue;
  private redis: IORedis;

  constructor() {
    // Initialize Redis connection
    this.redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    // Initialize BullMQ queue
    this.queue = new Queue('notifications', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    // Initialize worker
    this.worker = new Worker('notifications', this.processJob.bind(this), {
      connection: this.redis,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000 // 10 jobs per second
      }
    });

    this.setupEventHandlers();
  }

  /**
   * Process notification job
   */
  private async processJob(job: Job<NotificationJobData>): Promise<void> {
    const { type, recipient, claimId, data, priority = 'medium' } = job.data;

    try {
      logger.info(`Processing notification job ${job.id}: ${type} for claim ${claimId}`);

      let result;

      switch (type) {
        case 'claim_confirmation':
          result = await NotificationService.sendClaimConfirmation(
            recipient,
            claimId,
            data.claimType,
            data.estimatedAmount
          );
          break;

        case 'escalation_alert':
          result = await NotificationService.sendEscalationNotification(
            recipient,
            claimId,
            data.escalationLevel,
            data.urgency,
            data.reason
          );
          break;

        case 'fraud_alert':
          result = await NotificationService.sendFraudAlert(
            recipient,
            claimId,
            data.fraudScore,
            data.riskFactors
          );
          break;

        case 'status_update':
          result = await NotificationService.sendStatusUpdate(
            recipient,
            claimId,
            data.status,
            data.additionalInfo
          );
          break;

        case 'payout_notification':
          result = await NotificationService.sendPayoutNotification(
            recipient,
            claimId,
            data.payoutAmount,
            data.paymentMethod
          );
          break;

        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      if (!result.success) {
        throw new Error(`Notification failed: ${result.error}`);
      }

      logger.info(`Notification job ${job.id} completed successfully: ${result.messageId}`);

      // Update job progress
      await job.updateProgress(100);

      // Store result for tracking
      await job.updateData({
        ...job.data,
        result: {
          success: true,
          messageId: result.messageId,
          timestamp: result.timestamp
        }
      });

    } catch (error) {
      logger.error(`Notification job ${job.id} failed:`, error);
      
      // Update job data with error info
      await job.updateData({
        ...job.data,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      });

      throw error; // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Add notification job to queue
   */
  async addNotificationJob(
    jobData: NotificationJobData,
    options?: {
      delay?: number;
      priority?: number;
      jobId?: string;
    }
  ): Promise<Job<NotificationJobData>> {
    try {
      // Set priority based on notification type and urgency
      let priority = 0;
      
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

      // Special handling for critical notification types
      if (jobData.type === 'fraud_alert') {
        priority = Math.max(priority, 90);
      } else if (jobData.type === 'escalation_alert') {
        priority = Math.max(priority, 80);
      }

      const job = await this.queue.add('notification', jobData, {
        priority,
        delay: options?.delay || 0,
        jobId: options?.jobId,
        attempts: jobData.retries || 3
      });

      logger.info(`Notification job added to queue: ${job.id} (${jobData.type})`);
      return job;

    } catch (error) {
      logger.error('Error adding notification job to queue:', error);
      throw new Error('Failed to queue notification');
    }
  }

  /**
   * Add bulk notification jobs
   */
  async addBulkNotificationJobs(jobs: NotificationJobData[]): Promise<Job<NotificationJobData>[]> {
    try {
      const jobsWithOptions = jobs.map(jobData => ({
        name: 'notification',
        data: jobData,
        opts: {
          priority: this.getPriorityScore(jobData),
          attempts: jobData.retries || 3
        }
      }));

      const bullJobs = await this.queue.addBulk(jobsWithOptions);
      logger.info(`${bullJobs.length} notification jobs added to queue`);
      
      return bullJobs;
    } catch (error) {
      logger.error('Error adding bulk notification jobs:', error);
      throw new Error('Failed to queue bulk notifications');
    }
  }

  /**
   * Schedule delayed notification
   */
  async scheduleNotification(
    jobData: NotificationJobData,
    delayMs: number
  ): Promise<Job<NotificationJobData>> {
    return await this.addNotificationJob(jobData, { delay: delayMs });
  }

  /**
   * Cancel notification job
   */
  async cancelNotification(jobId: string): Promise<boolean> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info(`Notification job ${jobId} cancelled`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error cancelling notification job ${jobId}:`, error);
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
    try {
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
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      throw new Error('Failed to get queue statistics');
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanQueue(): Promise<void> {
    try {
      // Clean completed jobs older than 24 hours
      await this.queue.clean(24 * 60 * 60 * 1000, 100, 'completed');
      
      // Clean failed jobs older than 7 days
      await this.queue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed');
      
      logger.info('Queue cleanup completed');
    } catch (error) {
      logger.error('Error cleaning queue:', error);
    }
  }

  /**
   * Setup event handlers for worker
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      logger.info(`Notification job completed: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Notification job failed: ${job?.id}`, err);
    });

    this.worker.on('progress', (job, progress) => {
      logger.debug(`Notification job progress: ${job.id} - ${progress}%`);
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn(`Notification job stalled: ${jobId}`);
    });

    this.worker.on('error', (err) => {
      logger.error('Notification worker error:', err);
    });

    // Queue events
    this.queue.on('error', (err) => {
      logger.error('Notification queue error:', err);
    });
  }

  /**
   * Get priority score for job
   */
  private getPriorityScore(jobData: NotificationJobData): number {
    let priority = 0;
    
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

    // Boost priority for critical notification types
    if (jobData.type === 'fraud_alert') {
      priority = Math.max(priority, 90);
    } else if (jobData.type === 'escalation_alert') {
      priority = Math.max(priority, 80);
    }

    return priority;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down notification worker...');
      await this.worker.close();
      await this.queue.close();
      await this.redis.disconnect();
      logger.info('Notification worker shutdown complete');
    } catch (error) {
      logger.error('Error during notification worker shutdown:', error);
    }
  }

  /**
   * Start the worker
   */
  start(): void {
    logger.info('Notification worker started');
  }

  /**
   * Pause the worker
   */
  async pause(): Promise<void> {
    await this.worker.pause();
    logger.info('Notification worker paused');
  }

  /**
   * Resume the worker
   */
  async resume(): Promise<void> {
    await this.worker.resume();
    logger.info('Notification worker resumed');
  }
}
