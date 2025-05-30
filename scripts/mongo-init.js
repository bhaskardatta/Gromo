// MongoDB initialization script for Docker setup
// This script runs when MongoDB container starts for the first time

// Create application database
db = db.getSiblingDB('gromo');

// Create application user with appropriate permissions
db.createUser({
  user: 'gromo-app',
  pwd: 'gromo-app-password',
  roles: [
    {
      role: 'readWrite',
      db: 'gromo'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true, sparse: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: 1 });

db.claims.createIndex({ claimNumber: 1 }, { unique: true });
db.claims.createIndex({ userId: 1 });
db.claims.createIndex({ status: 1 });
db.claims.createIndex({ policyNumber: 1 });
db.claims.createIndex({ vehicleNumber: 1 });
db.claims.createIndex({ incidentDate: 1 });
db.claims.createIndex({ fraudScore: 1 });
db.claims.createIndex({ location: '2dsphere' });

// Compound indexes for efficient queries
db.claims.createIndex({ userId: 1, status: 1 });
db.claims.createIndex({ status: 1, createdAt: -1 });
db.claims.createIndex({ fraudScore: -1, status: 1 });

print('MongoDB initialization completed for Gromo application');
