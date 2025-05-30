/**
 * Database seeding script for development and testing
 * Creates initial users, claims, and test data
 */
import mongoose from 'mongoose';
import { config } from '../src/config/config';
import { logger } from '../src/utils/logger';

class DatabaseSeeder {
  /**
   * Connects to the database
   */
  async connect(): Promise<void> {
    try {
      await mongoose.connect(config.getDatabase().mongoUri);
      logger.info('Connected to database for seeding');
    } catch (error) {
      logger.error('Failed to connect to database for seeding', { error });
      throw error;
    }
  }

  /**
   * Seeds users for testing
   */
  async seedUsers(): Promise<void> {
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      name: String,
      role: String,
      createdAt: Date,
      updatedAt: Date
    }));

    // Clear existing users
    await User.deleteMany({});

    // Create test users
    await User.create([
      {
        email: 'admin@gromo.com',
        // In a real app, this would be hashed
        password: '$2b$10$X7KAlt0QQ9LO1QGXlzrCT.yf01p5t9V9w/5xB0s.ABdtUeU8JG7nW', // password123
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'agent@gromo.com',
        password: '$2b$10$X7KAlt0QQ9LO1QGXlzrCT.yf01p5t9V9w/5xB0s.ABdtUeU8JG7nW', // password123
        name: 'Agent User',
        role: 'agent',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'customer@gromo.com',
        password: '$2b$10$X7KAlt0QQ9LO1QGXlzrCT.yf01p5t9V9w/5xB0s.ABdtUeU8JG7nW', // password123
        name: 'Customer User',
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    logger.info('Users seeded successfully');
  }

  /**
   * Seeds sample claims for testing
   */
  async seedClaims(): Promise<void> {
    const Claim = mongoose.model('Claim', new mongoose.Schema({
      claimNumber: String,
      policyNumber: String,
      claimType: String,
      description: String,
      amount: Number,
      status: String,
      documents: Array,
      userId: String,
      createdAt: Date,
      updatedAt: Date
    }));

    // Clear existing claims
    await Claim.deleteMany({});

    // Create test claims
    await Claim.create([
      {
        claimNumber: 'CLM-2025-001',
        policyNumber: 'POL-1234-5678',
        claimType: 'medical',
        description: 'Hospital treatment for fever and infection',
        amount: 25000,
        status: 'pending',
        documents: [],
        userId: '60d21b4667d0d8992e610c85', // This should match a user ID
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        claimNumber: 'CLM-2025-002',
        policyNumber: 'POL-8765-4321',
        claimType: 'vehicle',
        description: 'Car damage due to accident on highway',
        amount: 75000,
        status: 'approved',
        documents: [],
        userId: '60d21b4667d0d8992e610c86', // This should match a user ID
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        claimNumber: 'CLM-2025-003',
        policyNumber: 'POL-9876-5432',
        claimType: 'property',
        description: 'Water damage due to pipe burst',
        amount: 120000,
        status: 'rejected',
        documents: [],
        userId: '60d21b4667d0d8992e610c87', // This should match a user ID
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    logger.info('Claims seeded successfully');
  }

  /**
   * Seeds the database with test data
   */
  async seed(): Promise<void> {
    try {
      await this.connect();
      await this.seedUsers();
      await this.seedClaims();
      logger.info('Database seeded successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error seeding database', { error });
      process.exit(1);
    }
  }

  /**
   * Disconnects from the database
   */
  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      logger.info('Disconnected from database after seeding');
    } catch (error) {
      logger.error('Error disconnecting from database', { error });
    }
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.seed();
}

export { DatabaseSeeder };
