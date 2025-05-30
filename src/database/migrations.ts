import { Migration } from './migrationRunner';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Migration 001: Initial schema setup
 * Creates indexes and adds initial data structure
 */
export const migration001: Migration = {
  version: '001',
  description: 'Initial schema setup with indexes',
  async up() {
    logger.info('Running migration 001: Initial schema setup');

    // Create indexes for User collection
    await mongoose.connection.db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { phone: 1 }, unique: true, sparse: true, name: 'phone_unique' },
      { key: { role: 1 }, name: 'role_index' },
      { key: { createdAt: 1 }, name: 'created_at_index' },
      { key: { isActive: 1 }, name: 'is_active_index' },
    ]);

    // Create indexes for Claim collection
    await mongoose.connection.db.collection('claims').createIndexes([
      { key: { claimNumber: 1 }, unique: true, name: 'claim_number_unique' },
      { key: { userId: 1 }, name: 'user_id_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { createdAt: 1 }, name: 'created_at_index' },
      { key: { updatedAt: 1 }, name: 'updated_at_index' },
      { key: { policyNumber: 1 }, name: 'policy_number_index' },
      { key: { vehicleNumber: 1 }, name: 'vehicle_number_index' },
      { key: { incidentDate: 1 }, name: 'incident_date_index' },
      { key: { location: '2dsphere' }, name: 'location_geo_index' },
      { key: { fraudScore: 1 }, name: 'fraud_score_index' },
    ]);

    // Create compound indexes for efficient queries
    await mongoose.connection.db.collection('claims').createIndexes([
      { key: { userId: 1, status: 1 }, name: 'user_status_compound' },
      { key: { status: 1, createdAt: -1 }, name: 'status_created_compound' },
      { key: { fraudScore: -1, status: 1 }, name: 'fraud_status_compound' },
    ]);

    logger.info('Migration 001 completed: Indexes created');
  },

  async down() {
    logger.info('Rolling back migration 001: Dropping indexes');

    // Drop custom indexes (keep default _id index)
    const userIndexes = ['email_unique', 'phone_unique', 'role_index', 'created_at_index', 'is_active_index'];
    const claimIndexes = [
      'claim_number_unique', 'user_id_index', 'status_index', 'created_at_index',
      'updated_at_index', 'policy_number_index', 'vehicle_number_index',
      'incident_date_index', 'location_geo_index', 'fraud_score_index',
      'user_status_compound', 'status_created_compound', 'fraud_status_compound'
    ];

    for (const indexName of userIndexes) {
      try {
        await mongoose.connection.db.collection('users').dropIndex(indexName);
      } catch (error) {
        logger.warn(`Failed to drop index ${indexName}:`, error);
      }
    }

    for (const indexName of claimIndexes) {
      try {
        await mongoose.connection.db.collection('claims').dropIndex(indexName);
      } catch (error) {
        logger.warn(`Failed to drop index ${indexName}:`, error);
      }
    }

    logger.info('Migration 001 rollback completed');
  },
};

/**
 * Migration 002: Add fraud detection fields
 * Adds new fields for enhanced fraud detection
 */
export const migration002: Migration = {
  version: '002',
  description: 'Add fraud detection fields and indexes',
  async up() {
    logger.info('Running migration 002: Add fraud detection fields');

    // Update existing claims to add fraud detection fields
    await mongoose.connection.db.collection('claims').updateMany(
      { fraudDetection: { $exists: false } },
      {
        $set: {
          fraudDetection: {
            riskFactors: [],
            suspiciousPatterns: [],
            blacklistChecks: {
              vehicle: false,
              phone: false,
              location: false,
            },
            verificationStatus: 'pending',
            lastChecked: new Date(),
          },
          reviewFlags: [],
          escalationHistory: [],
        },
      }
    );

    // Create indexes for fraud detection
    await mongoose.connection.db.collection('claims').createIndexes([
      { key: { 'fraudDetection.verificationStatus': 1 }, name: 'fraud_verification_status_index' },
      { key: { 'fraudDetection.lastChecked': 1 }, name: 'fraud_last_checked_index' },
      { key: { reviewFlags: 1 }, name: 'review_flags_index' },
    ]);

    logger.info('Migration 002 completed: Fraud detection fields added');
  },

  async down() {
    logger.info('Rolling back migration 002: Remove fraud detection fields');

    // Remove fraud detection fields
    await mongoose.connection.db.collection('claims').updateMany(
      {},
      {
        $unset: {
          fraudDetection: '',
          reviewFlags: '',
          escalationHistory: '',
        },
      }
    );

    // Drop fraud detection indexes
    const fraudIndexes = [
      'fraud_verification_status_index',
      'fraud_last_checked_index',
      'review_flags_index'
    ];

    for (const indexName of fraudIndexes) {
      try {
        await mongoose.connection.db.collection('claims').dropIndex(indexName);
      } catch (error) {
        logger.warn(`Failed to drop index ${indexName}:`, error);
      }
    }

    logger.info('Migration 002 rollback completed');
  },
};

/**
 * Migration 003: Add audit logging collection
 * Creates audit logging for compliance and security
 */
export const migration003: Migration = {
  version: '003',
  description: 'Add audit logging collection and indexes',
  async up() {
    logger.info('Running migration 003: Add audit logging');

    // Create audit logs collection
    await mongoose.connection.db.createCollection('auditlogs');

    // Create indexes for audit logs
    await mongoose.connection.db.collection('auditlogs').createIndexes([
      { key: { timestamp: 1 }, name: 'timestamp_index' },
      { key: { userId: 1 }, name: 'user_id_index' },
      { key: { action: 1 }, name: 'action_index' },
      { key: { resourceType: 1 }, name: 'resource_type_index' },
      { key: { resourceId: 1 }, name: 'resource_id_index' },
      { key: { ipAddress: 1 }, name: 'ip_address_index' },
      { key: { timestamp: 1 }, expireAfterSeconds: 31536000, name: 'ttl_index' }, // 1 year TTL
    ]);

    // Create compound indexes for efficient queries
    await mongoose.connection.db.collection('auditlogs').createIndexes([
      { key: { userId: 1, timestamp: -1 }, name: 'user_timestamp_compound' },
      { key: { resourceType: 1, resourceId: 1 }, name: 'resource_compound' },
      { key: { action: 1, timestamp: -1 }, name: 'action_timestamp_compound' },
    ]);

    logger.info('Migration 003 completed: Audit logging collection created');
  },

  async down() {
    logger.info('Rolling back migration 003: Remove audit logging');

    // Drop audit logs collection
    await mongoose.connection.db.collection('auditlogs').drop();

    logger.info('Migration 003 rollback completed');
  },
};

/**
 * Migration 004: Add user preferences and settings
 * Adds user preferences for notifications and UI settings
 */
export const migration004: Migration = {
  version: '004',
  description: 'Add user preferences and notification settings',
  async up() {
    logger.info('Running migration 004: Add user preferences');

    // Update existing users to add preferences
    await mongoose.connection.db.collection('users').updateMany(
      { preferences: { $exists: false } },
      {
        $set: {
          preferences: {
            language: 'en',
            timezone: 'Asia/Kolkata',
            dateFormat: 'DD/MM/YYYY',
            notifications: {
              email: true,
              sms: true,
              push: true,
              claimUpdates: true,
              fraudAlerts: true,
              systemMaintenance: false,
            },
            ui: {
              theme: 'light',
              density: 'comfortable',
              sidebarCollapsed: false,
            },
          },
          lastLoginAt: null,
          loginCount: 0,
        },
      }
    );

    // Create indexes for user preferences
    await mongoose.connection.db.collection('users').createIndexes([
      { key: { 'preferences.language': 1 }, name: 'preferences_language_index' },
      { key: { lastLoginAt: 1 }, name: 'last_login_index' },
    ]);

    logger.info('Migration 004 completed: User preferences added');
  },

  async down() {
    logger.info('Rolling back migration 004: Remove user preferences');

    // Remove user preferences
    await mongoose.connection.db.collection('users').updateMany(
      {},
      {
        $unset: {
          preferences: '',
          lastLoginAt: '',
          loginCount: '',
        },
      }
    );

    // Drop preference indexes
    const prefIndexes = ['preferences_language_index', 'last_login_index'];
    for (const indexName of prefIndexes) {
      try {
        await mongoose.connection.db.collection('users').dropIndex(indexName);
      } catch (error) {
        logger.warn(`Failed to drop index ${indexName}:`, error);
      }
    }

    logger.info('Migration 004 rollback completed');
  },
};

// Export all migrations in order
export const allMigrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
];
