// Script to seed mock data for Gromo application
const mongoose = require('mongoose');
const { User } = require('../dist/models/User');
const { Claim } = require('../dist/models/Claim');
const logger = require('../dist/utils/logger').logger;

// Connect to MongoDB using connection from env var or default to localhost
async function connectToMongoDB() {
  try {
    // Use the same environment variable logic as in the main app
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/gromo';
    console.log(`Connecting to MongoDB: ${mongoURI}`);
    await mongoose.connect(mongoURI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Create mock users
async function createMockUsers() {
  try {
    // Remove existing users
    await User.deleteMany({});
    
    // Create new users
    const users = [
      {
        name: 'John Doe',
        phone: '+91-9876543210',
        email: 'john.doe@example.com',
        claimsThisMonth: 2,
        totalClaims: 5
      },
      {
        name: 'Jane Smith',
        phone: '+91-9876543211',
        email: 'jane.smith@example.com',
        claimsThisMonth: 1,
        totalClaims: 3
      },
      {
        name: 'Raj Kumar',
        phone: '+91-9876543212',
        email: 'raj.kumar@example.com',
        claimsThisMonth: 0,
        totalClaims: 2
      }
    ];
    
    const createdUsers = await User.create(users);
    logger.info(`Created ${createdUsers.length} mock users`);
    return createdUsers;
  } catch (error) {
    logger.error('Failed to create mock users:', error);
    throw error;
  }
}

// Create mock claims
async function createMockClaims(users) {
  try {
    // Remove existing claims
    await Claim.deleteMany({});
    
    const claimTypes = ['medical', 'accident', 'pharmacy'];
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'FRAUD_REVIEW', 'MANUAL_REVIEW'];
    
    const claims = [];
    
    for (const user of users) {
      // Create 1-3 claims per user
      const numClaims = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numClaims; i++) {
        const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const amount = Math.floor(Math.random() * 50000) + 5000; // Random amount between 5000 and 55000
        
        const claim = {
          user: user._id,
          type: claimType,
          status,
          amount,
          description: `Sample ${claimType} claim for ${user.name}`,
          claimDetails: {
            incidentDate: new Date(),
            description: `This is a sample ${claimType} claim created for testing purposes.`,
            severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
          },
          documents: [
            {
              url: `/uploads/documents/sample-${claimType}.pdf`,
              type: 'bill',
              extractedData: new Map([
                ['amount', amount],
                ['date', new Date().toISOString()],
                ['provider', 'Test Hospital']
              ]),
              confidence: 0.85,
              ocrMethod: 'google_vision'
            }
          ],
          processingSteps: [
            {
              step: 'claim_initiated',
              completedAt: new Date(),
              success: true,
              details: { source: 'api' }
            },
            {
              step: 'ocr_processing',
              completedAt: new Date(),
              success: true,
              details: { method: 'google_vision' }
            }
          ],
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours from now
        };
        
        claims.push(claim);
      }
    }
    
    const createdClaims = await Claim.create(claims);
    logger.info(`Created ${createdClaims.length} mock claims`);
    return createdClaims;
  } catch (error) {
    logger.error('Failed to create mock claims:', error);
    throw error;
  }
}

// Main function
async function seedData() {
  try {
    await connectToMongoDB();
    
    const users = await createMockUsers();
    const claims = await createMockClaims(users);
    
    logger.info('Mock data seeded successfully');
    logger.info(`Created ${users.length} users and ${claims.length} claims`);
    
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    
    return { users, claims };
  } catch (error) {
    logger.error('Failed to seed mock data:', error);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    }
    
    process.exit(1);
  }
}

// Run the script
seedData();
