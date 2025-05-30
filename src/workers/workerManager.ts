import { NotificationWorker } from './notificationWorker';
import { EscalationWorker } from './escalationWorker';
import { logger } from '../utils/logger';
import * as cron from 'node-cron';

export class WorkerManager {
  private notificationWorker: NotificationWorker;
  private escalationWorker: EscalationWorker;
  private isRunning: boolean = false;
  private cronJobs: cron.ScheduledTask[] = [];

  constructor() {
    this.notificationWorker = new NotificationWorker();
    this.escalationWorker = new EscalationWorker(this.notificationWorker);
  }

  /**
   * Start all workers and scheduled tasks
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting worker manager...');

      // Start individual workers
      this.notificationWorker.start();
      this.escalationWorker.start();

      // Set up scheduled maintenance tasks
      this.setupScheduledTasks();

      this.isRunning = true;
      logger.info('Worker manager started successfully');

    } catch (error) {
      logger.error('Error starting worker manager:', error);
      throw new Error('Failed to start worker manager');
    }
  }

  /**
   * Stop all workers and scheduled tasks
   */
  async stop(): Promise<void> {
    try {
      logger.info('Stopping worker manager...');

      this.isRunning = false;

      // Stop scheduled tasks
      this.cronJobs.forEach(job => job.stop());
      this.cronJobs = [];

      // Shutdown workers
      await Promise.all([
        this.notificationWorker.shutdown(),
        this.escalationWorker.shutdown()
      ]);

      logger.info('Worker manager stopped successfully');

    } catch (error) {
      logger.error('Error stopping worker manager:', error);
      throw new Error('Failed to stop worker manager');
    }
  }

  /**
   * Get worker manager status
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    notificationQueue: any;
    escalationQueue: any;
    uptime: number;
    scheduledTasks: number;
  }> {
    try {
      const [notificationStats, escalationStats] = await Promise.all([
        this.notificationWorker.getQueueStats(),
        this.escalationWorker.getQueueStats()
      ]);

      return {
        isRunning: this.isRunning,
        notificationQueue: notificationStats,
        escalationQueue: escalationStats,
        uptime: process.uptime(),
        scheduledTasks: this.cronJobs.length
      };

    } catch (error) {
      logger.error('Error getting worker status:', error);
      throw new Error('Failed to get worker status');
    }
  }

  /**
   * Get notification worker instance
   */
  getNotificationWorker(): NotificationWorker {
    return this.notificationWorker;
  }

  /**
   * Get escalation worker instance
   */
  getEscalationWorker(): EscalationWorker {
    return this.escalationWorker;
  }

  /**
   * Setup scheduled maintenance tasks
   */
  private setupScheduledTasks(): void {
    // Clean up old notification jobs every hour
    const notificationCleanupJob = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running notification queue cleanup...');
        await this.notificationWorker.cleanQueue();
      } catch (error) {
        logger.error('Error in notification cleanup job:', error);
      }
    });

    // Monitor queue health every 5 minutes
    const healthCheckJob = cron.schedule('*/5 * * * *', async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Error in health check job:', error);
      }
    });

    // Generate worker metrics every 15 minutes
    const metricsJob = cron.schedule('*/15 * * * *', async () => {
      try {
        await this.generateMetrics();
      } catch (error) {
        logger.error('Error in metrics job:', error);
      }
    });

    // Start all scheduled jobs
    notificationCleanupJob.start();
    healthCheckJob.start();
    metricsJob.start();

    this.cronJobs = [notificationCleanupJob, healthCheckJob, metricsJob];
    logger.info(`${this.cronJobs.length} scheduled tasks configured`);
  }

  /**
   * Perform health check on all workers
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const status = await this.getStatus();
      
      // Check for stalled jobs or high failure rates
      const notificationQueue = status.notificationQueue;
      const escalationQueue = status.escalationQueue;

      // Alert if too many failed jobs
      if (notificationQueue.failed > 10) {
        logger.warn(`High number of failed notification jobs: ${notificationQueue.failed}`);
      }

      if (escalationQueue.failed > 5) {
        logger.warn(`High number of failed escalation jobs: ${escalationQueue.failed}`);
      }

      // Alert if queues are getting too large
      if (notificationQueue.waiting > 100) {
        logger.warn(`High number of waiting notification jobs: ${notificationQueue.waiting}`);
      }

      if (escalationQueue.waiting > 50) {
        logger.warn(`High number of waiting escalation jobs: ${escalationQueue.waiting}`);
      }

      logger.debug('Worker health check completed', status);

    } catch (error) {
      logger.error('Error in worker health check:', error);
    }
  }

  /**
   * Generate worker metrics
   */
  private async generateMetrics(): Promise<void> {
    try {
      const status = await this.getStatus();
      
      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: status.uptime,
        queues: {
          notifications: status.notificationQueue,
          escalations: status.escalationQueue
        },
        system: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        }
      };

      // Log metrics (in production, you might send these to a monitoring service)
      logger.info('Worker metrics generated', metrics);

      // Could also save to database or send to monitoring service here
      // await this.saveMetricsToDatabase(metrics);
      // await this.sendToMonitoringService(metrics);

    } catch (error) {
      logger.error('Error generating worker metrics:', error);
    }
  }

  /**
   * Pause all workers
   */
  async pauseWorkers(): Promise<void> {
    try {
      logger.info('Pausing all workers...');
      await Promise.all([
        this.notificationWorker.pause(),
        // escalationWorker doesn't have pause method, so we skip it
      ]);
      logger.info('All workers paused');
    } catch (error) {
      logger.error('Error pausing workers:', error);
      throw new Error('Failed to pause workers');
    }
  }

  /**
   * Resume all workers
   */
  async resumeWorkers(): Promise<void> {
    try {
      logger.info('Resuming all workers...');
      await Promise.all([
        this.notificationWorker.resume(),
        // escalationWorker doesn't have resume method, so we skip it
      ]);
      logger.info('All workers resumed');
    } catch (error) {
      logger.error('Error resuming workers:', error);
      throw new Error('Failed to resume workers');
    }
  }

  /**
   * Add a notification job (convenience method)
   */
  async addNotificationJob(jobData: any, options?: any): Promise<any> {
    return await this.notificationWorker.addNotificationJob(jobData, options);
  }

  /**
   * Add an escalation job (convenience method)
   */
  async addEscalationJob(jobData: any, options?: any): Promise<any> {
    return await this.escalationWorker.addEscalationJob(jobData, options);
  }

  /**
   * Process graceful shutdown with timeout
   */
  async gracefulShutdown(timeoutMs: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker shutdown timeout'));
      }, timeoutMs);

      this.stop()
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Handle process signals for graceful shutdown
   */
  setupSignalHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        await this.gracefulShutdown();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  }
}

// Export singleton instance
export const workerManager = new WorkerManager();
