import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../src/config/config';
import { User } from '../src/models/User';
import { Claim } from '../src/models/Claim';
import { logger } from '../src/utils/logger';

/**
 * Database seeding script for development and testing
 * Creates initial users, claims, and test data
 */

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'agent' | 'customer-service' | 'customer';
}

interface SeedClaim {
  claimNumber: string;
  userEmail: string;
  policyNumber: string;
  vehicleNumber: string;
  incidentDate: Date;
  incidentType: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
  };
  estimatedAmount: number;
  status: 'submitted' | 'under-review' | 'approved' | 'rejected' | 'paid';
}

// Sample users for different roles
const seedUsers: SeedUser[] = [
  {
    email: 'admin@gromo.com',
    password: 'Admin@123',
    firstName: 'System',
    lastName: 'Administrator',
    phone: '+919876543210',
    role: 'admin',
  },
  {
    email: 'agent@gromo.com',
    password: 'Agent@123',
    firstName: 'Claims',
    lastName: 'Agent',
    phone: '+919876543211',
    role: 'agent',
  },
  {
    email: 'support@gromo.com',
    password: 'Support@123',
    firstName: 'Customer',
    lastName: 'Support',
    phone: '+919876543212',
    role: 'customer-service',
  },
  {
    email: 'john.doe@example.com',
    password: 'Customer@123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+919876543213',
    role: 'customer',
  },
  {
    email: 'jane.smith@example.com',
    password: 'Customer@123',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+919876543214',
    role: 'customer',
  },
  {
    email: 'rajesh.kumar@example.com',
    password: 'Customer@123',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    phone: '+919876543215',
    role: 'customer',
  },
  {
    email: 'priya.patel@example.com',
    password: 'Customer@123',
    firstName: 'Priya',
    lastName: 'Patel',
    phone: '+919876543216',
    role: 'customer',
  },
];

// Sample claims for testing
const seedClaims: SeedClaim[] = [
  {
    claimNumber: 'CLM001',
    userEmail: 'john.doe@example.com',
    policyNumber: 'POL001',
    vehicleNumber: 'MH01AB1234',
    incidentDate: new Date('2024-01-15'),
    incidentType: 'collision',
    description: 'Minor collision at traffic signal',
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760], // Mumbai coordinates
      address: 'Andheri East, Mumbai, Maharashtra 400069',
    },
    estimatedAmount: 25000,
    status: 'under-review',
  },
  {
    claimNumber: 'CLM002',
    userEmail: 'jane.smith@example.com',
    policyNumber: 'POL002',
    vehicleNumber: 'DL02CD5678',
    incidentDate: new Date('2024-01-20'),
    incidentType: 'theft',
    description: 'Vehicle stolen from parking lot',
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.6139], // Delhi coordinates
      address: 'Connaught Place, New Delhi 110001',
    },
    estimatedAmount: 450000,
    status: 'submitted',
  },
  {
    claimNumber: 'CLM003',
    userEmail: 'rajesh.kumar@example.com',
    policyNumber: 'POL003',
    vehicleNumber: 'KA03EF9012',
    incidentDate: new Date('2024-01-25'),
    incidentType: 'natural-disaster',
    description: 'Damage due to heavy rainfall and flooding',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Bangalore coordinates
      address: 'Electronic City, Bangalore, Karnataka 560100',
    },
    estimatedAmount: 75000,
    status: 'approved',
  },
  {
    claimNumber: 'CLM004',
    userEmail: 'priya.patel@example.com',
    policyNumber: 'POL004',
    vehicleNumber: 'GJ04GH3456',
    incidentDate: new Date('2024-02-01'),
    incidentType: 'fire',
    description: 'Engine fire while driving on highway',
    location: {
      type: 'Point',
      coordinates: [72.5714, 23.0225], // Ahmedabad coordinates
      address: 'SG Highway, Ahmedabad, Gujarat 380054',
    },
    estimatedAmount: 180000,
    status: 'rejected',
  },
  {
    claimNumber: 'CLM005',
    userEmail: 'john.doe@example.com',
    policyNumber: 'POL005',
    vehicleNumber: 'TN05IJ7890',
    incidentDate: new Date('2024-02-05'),
    incidentType: 'vandalism',
    description: 'Car windows broken and scratches on body',
    location: {
      type: 'Point',
      coordinates: [80.2707, 13.0827], // Chennai coordinates
      address: 'T. Nagar, Chennai, Tamil Nadu 600017',
    },
    estimatedAmount: 35000,
    status: 'paid',
  },
];

class DatabaseSeeder {
  async seedUsers(): Promise<Map<string, string>> {
    logger.info('Seeding users...');
    const userIdMap = new Map<string, string>();

    for (const userData of seedUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          logger.info(`User ${userData.email} already exists, skipping...`);
          userIdMap.set(userData.email, (existingUser._id as mongoose.Types.ObjectId).toString());
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Create user
        const user = new User({
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          isVerified: true,
          isActive: true,
          preferences: {
            language: 'en',
            timezone: 'Asia/Kolkata',
            dateFormat: 'DD/MM/YYYY',
            notifications: {
              email: true,
              sms: true,
              push: true,
              claimUpdates: true,
              fraudAlerts: userData.role === 'admin' || userData.role === 'agent',
              systemMaintenance: userData.role === 'admin',
            },
            ui: {
              theme: 'light',
              density: 'comfortable',
              sidebarCollapsed: false,
            },
          },
        });

        const savedUser = await user.save() as InstanceType<typeof User>;
        userIdMap.set(userData.email, (savedUser._id as mongoose.Types.ObjectId).toString());
        logger.info(`Created user: ${userData.email} (${userData.role})`);
      } catch (error) {
        logger.error(`Failed to create user ${userData.email}:`, error);
      }
    }

    return userIdMap;
  }

  async seedClaims(userIdMap: Map<string, string>): Promise<void> {
    logger.info('Seeding claims...');

    for (const claimData of seedClaims) {
      try {
        // Check if claim already exists
        const existingClaim = await Claim.findOne({ claimNumber: claimData.claimNumber });
        if (existingClaim) {
          logger.info(`Claim ${claimData.claimNumber} already exists, skipping...`);
          continue;
        }

        // Get user ID
        const userId = userIdMap.get(claimData.userEmail);
        if (!userId) {
          logger.warn(`User ${claimData.userEmail} not found, skipping claim ${claimData.claimNumber}`);
          continue;
        }

        // Generate fraud score (random for demo)
        const fraudScore = Math.floor(Math.random() * 100);

        // Create claim
        const claim = new Claim({
          claimNumber: claimData.claimNumber,
          userId,
          policyNumber: claimData.policyNumber,
          vehicleNumber: claimData.vehicleNumber,
          incidentDate: claimData.incidentDate,
          incidentType: claimData.incidentType,
          description: claimData.description,
          location: claimData.location,
          estimatedAmount: claimData.estimatedAmount,
          status: claimData.status,
          fraudScore,
          fraudDetection: {
            riskFactors: fraudScore > 70 ? ['high_amount', 'unusual_location'] : [],
            suspiciousPatterns: fraudScore > 80 ? ['multiple_claims'] : [],
            blacklistChecks: {
              vehicle: false,
              phone: false,
              location: false,
            },
            verificationStatus: fraudScore > 70 ? 'flagged' : 'verified',
            lastChecked: new Date(),
          },
          reviewFlags: fraudScore > 80 ? ['requires_manual_review'] : [],
          escalationHistory: [],
        });

        await claim.save();
        logger.info(`Created claim: ${claimData.claimNumber} for ${claimData.userEmail}`);
      } catch (error) {
        logger.error(`Failed to create claim ${claimData.claimNumber}:`, error);
      }
    }
  }

  async seedDatabase(): Promise<void> {
    try {
      logger.info('Starting database seeding...');

      // Connect to database
      await mongoose.connect(config.get().mongoUri);
      logger.info('Connected to database');

      // Seed users first
      const userIdMap = await this.seedUsers();

      // Then seed claims
      await this.seedClaims(userIdMap);

      logger.info('Database seeding completed successfully!');
      
      // Print summary
      const userCount = await User.countDocuments();
      const claimCount = await Claim.countDocuments();
      
      logger.info(`Summary: ${userCount} users, ${claimCount} claims`);
      
      // Print login credentials for testing
      logger.info('\n=== Test Login Credentials ===');
      logger.info('Admin: admin@gromo.com / Admin@123');
      logger.info('Agent: agent@gromo.com / Agent@123');
      logger.info('Support: support@gromo.com / Support@123');
      logger.info('Customer: john.doe@example.com / Customer@123');
      logger.info('==============================\n');

    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    } finally {
      await mongoose.disconnect();
      logger.info('Disconnected from database');
    }
  }

  async clearDatabase(): Promise<void> {
    try {
      logger.info('Clearing database...');
      
      await mongoose.connect(config.get().mongoUri);
      
      // Clear collections
      await User.deleteMany({});
      await Claim.deleteMany({});
      
      // Clear audit logs if collection exists
      const db = mongoose.connection.db;
      if (db) {
        const collections = await db.listCollections({ name: 'auditlogs' }).toArray();
        if (collections.length > 0) {
          await db.collection('auditlogs').deleteMany({});
        }
      }
      
      logger.info('Database cleared successfully');
    } catch (error) {
      logger.error('Failed to clear database:', error);
      throw error;
    } finally {
      await mongoose.disconnect();
    }
  }
}

// CLI interface
async function runSeeder(): Promise<void> {
  const command = process.argv[2] || 'seed';
  const seeder = new DatabaseSeeder();

  try {
    switch (command) {
      case 'seed':
        await seeder.seedDatabase();
        break;
      case 'clear':
        await seeder.clearDatabase();
        break;
      case 'reset':
        await seeder.clearDatabase();
        await seeder.seedDatabase();
        break;
      default:
        console.log('Usage: npm run db:seed [seed|clear|reset]');
        console.log('  seed  - Add sample data to database');
        console.log('  clear - Remove all data from database');
        console.log('  reset - Clear database and add sample data');
        process.exit(1);
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  runSeeder();
}

export { DatabaseSeeder };
