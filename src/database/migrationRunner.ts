import mongoose from 'mongoose';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export class MigrationRunner {
  private readonly migrationsCollection = 'migrations';

  constructor(private readonly connection: typeof mongoose) {}

  /**
   * Run all pending migrations
   */
  async runMigrations(migrations: Migration[]): Promise<void> {
    logger.info('Starting database migrations...');

    // Ensure migrations collection exists
    await this.ensureMigrationsCollection();

    // Get completed migrations
    const completedMigrations = await this.getCompletedMigrations();
    const completedVersions = new Set(completedMigrations.map(m => m.version));

    // Filter pending migrations
    const pendingMigrations = migrations.filter(m => !completedVersions.has(m.version));

    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations found');
      return;
    }

    logger.info(`Found ${pendingMigrations.length} pending migrations`);

    // Sort migrations by version
    pendingMigrations.sort((a, b) => a.version.localeCompare(b.version));

    // Run each migration
    for (const migration of pendingMigrations) {
      await this.runSingleMigration(migration);
    }

    logger.info('All migrations completed successfully');
  }

  /**
   * Rollback the last migration
   */
  async rollbackLastMigration(migrations: Migration[]): Promise<void> {
    logger.info('Rolling back last migration...');

    const completedMigrations = await this.getCompletedMigrations();
    if (completedMigrations.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    const lastMigration = completedMigrations[completedMigrations.length - 1];
    const migrationToRollback = migrations.find(m => m.version === lastMigration.version);

    if (!migrationToRollback) {
      throw new Error(`Migration ${lastMigration.version} not found in migration files`);
    }

    await this.rollbackSingleMigration(migrationToRollback);
    logger.info(`Rolled back migration ${lastMigration.version}`);
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(migrations: Migration[]): Promise<{
    completed: string[];
    pending: string[];
  }> {
    const completedMigrations = await this.getCompletedMigrations();
    const completedVersions = completedMigrations.map(m => m.version);
    const allVersions = migrations.map(m => m.version);
    const pendingVersions = allVersions.filter(v => !completedVersions.includes(v));

    return {
      completed: completedVersions,
      pending: pendingVersions,
    };
  }

  private async ensureMigrationsCollection(): Promise<void> {
    const db = this.connection.connection.db;
    const collections = await db.listCollections({ name: this.migrationsCollection }).toArray();
    
    if (collections.length === 0) {
      await db.createCollection(this.migrationsCollection);
      logger.info('Created migrations collection');
    }
  }

  private async getCompletedMigrations(): Promise<Array<{ version: string; appliedAt: Date }>> {
    const db = this.connection.connection.db;
    const collection = db.collection(this.migrationsCollection);
    
    const results = await collection
      .find({})
      .sort({ appliedAt: 1 })
      .toArray();
    
    return results.map(doc => ({
      version: doc.version,
      appliedAt: doc.appliedAt
    }));
  }

  private async runSingleMigration(migration: Migration): Promise<void> {
    logger.info(`Running migration ${migration.version}: ${migration.description}`);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Run the migration
      await migration.up();

      // Record the migration
      const db = this.connection.connection.db;
      const collection = db.collection(this.migrationsCollection);
      await collection.insertOne({
        version: migration.version,
        description: migration.description,
        appliedAt: new Date(),
      });

      await session.commitTransaction();
      logger.info(`Completed migration ${migration.version}`);
    } catch (error) {
      await session.abortTransaction();
      logger.error(`Failed to run migration ${migration.version}:`, error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async rollbackSingleMigration(migration: Migration): Promise<void> {
    logger.info(`Rolling back migration ${migration.version}: ${migration.description}`);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Run the rollback
      await migration.down();

      // Remove the migration record
      const db = this.connection.connection.db;
      const collection = db.collection(this.migrationsCollection);
      await collection.deleteOne({ version: migration.version });

      await session.commitTransaction();
      logger.info(`Rolled back migration ${migration.version}`);
    } catch (error) {
      await session.abortTransaction();
      logger.error(`Failed to rollback migration ${migration.version}:`, error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

/**
 * CLI tool for running migrations
 */
export async function runMigrationCLI(): Promise<void> {
  const command = process.argv[2];
  const migrations = await import('./migrations');

  try {
    await mongoose.connect(config.getDatabase().mongoUri);
    const runner = new MigrationRunner(mongoose);

    switch (command) {
            case 'up':
        await runner.runMigrations(migrations.allMigrations);
        break;
      case 'down':
        await runner.rollbackLastMigration(migrations.allMigrations);
        break;
      case 'status': {
        const status = await runner.getMigrationStatus(migrations.allMigrations);
        console.log('Migration Status:');
        console.log('Completed:', status.completed);
        console.log('Pending:', status.pending);
        break;
      }
      default:
        console.log('Usage: npm run migrate [up|down|status]');
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  runMigrationCLI();
}
