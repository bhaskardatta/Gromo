// Direct debug script for claims API route testing
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Create a minimal Express app for testing
const app = express();
app.use(express.json());

// Configure logging
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn
};

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gromo';
    await mongoose.connect(mongoURI);
    console.log('📊 Connected to MongoDB');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
}

// Import the compiled model from dist
async function setupModels() {
  // Define User schema first since Claims references it
  const UserSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true,
      unique: true
    },
    email: String,
    claimsThisMonth: {
      type: Number,
      default: 0
    },
    totalClaims: {
      type: Number,
      default: 0
    }
  }, { strict: false, timestamps: true });
  
  // Register User model
  const User = mongoose.model('User', UserSchema);
  
  // Now define Claim schema that references User
  const ClaimSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['medical', 'accident', 'pharmacy'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'FRAUD_REVIEW', 'MANUAL_REVIEW'],
        default: 'PENDING',
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    }
  }, { strict: false, timestamps: true });
  
  // Create and return Claim model
  return mongoose.model('Claim', ClaimSchema);
}

// Simulate the actual API handler but without middleware
async function testClaimsRoute() {
  try {
    console.log('\n🔍 TESTING CLAIMS API HANDLER\n');
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB');
      return;
    }
    
    // Setup models
    const Claim = await setupModels();
    
    // Mock request and response
    const req = {
      query: {},
      headers: { authorization: 'Bearer test_token' }
    };
    
    const res = {
      json: (data) => {
        console.log('\n📤 API RESPONSE:');
        console.log(JSON.stringify(data, null, 2));
      },
      status: (code) => {
        console.log(`Response status: ${code}`);
        return res;
      }
    };
    
    // Execute handler code directly from claims.ts
    console.log('Executing claims route handler...');
    
    // Log incoming request for debugging
    logger.info('GET /claims request received', { 
        query: req.query,
        auth: req.headers.authorization ? 'Present' : 'Missing'
    });
    
    // Parse query parameters with default values
    const status = req.query.status ? String(req.query.status) : null;
    const type = req.query.type ? String(req.query.type) : null;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search ? String(req.query.search) : null;
    const skip = (page - 1) * limit;
    
    // Build query filters
    const filter = {};
    
    // Status mapping
    if (status) {
        filter.status = status.toUpperCase();
        logger.info(`Filtering by status: ${filter.status}`);
    }
    
    if (type) {
        filter.type = type;
        logger.info(`Filtering by type: ${type}`);
    }
    
    // Text search
    if (search) {
        const searchRegex = new RegExp(String(search), 'i');
        filter.$or = [
            { description: searchRegex },
            { 'claimDetails.description': searchRegex }
        ];
        logger.info(`Searching for: ${search}`);
    }

    console.log('Query filter:', filter);
    
    // Test direct database access first
    console.log('\n📥 DIRECT DATABASE QUERY:');
    const directClaims = await Claim.find({}).lean();
    console.log(`Found ${directClaims.length} claims directly from DB`);
    
    if (directClaims.length > 0) {
      console.log('First claim:', {
        id: directClaims[0]._id,
        type: directClaims[0].type,
        status: directClaims[0].status,
        amount: directClaims[0].amount
      });
    }
    
    // Now simulate the API query with filters
    console.log('\n📥 API HANDLER QUERY:');
    
    // Query MongoDB using the same approach as the API
    const claims = await Claim.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name phone')
        .lean();
    
    // Count total for pagination
    const total = await Claim.countDocuments(filter);
    
    console.log(`Found ${claims.length} claims with API filter, Total: ${total}`);
    
    // Format claims for response (simplified)
    const formattedClaims = claims.map(claim => {
        const user = claim.user || {};
        return {
            id: claim._id,
            claimNumber: claim._id.toString().slice(-8).toUpperCase(),
            type: claim.type,
            status: claim.status,
            amount: claim.amount,
            dateFiled: claim.createdAt
        };
    });
    
    // Return response
    res.json({
        status: 'success',
        data: {
            claims: formattedClaims,
            total,
            page,
            pages: Math.ceil(total / limit)
        }
    });
    
    // Compare collections
    console.log('\n🔄 COMPARING WITH NATIVE DRIVER:');
    const claimCollection = mongoose.connection.collection('claims');
    const nativeClaims = await claimCollection.find({}).toArray();
    console.log(`Native driver found ${nativeClaims.length} claims`);
    
    console.log('\n✅ TEST COMPLETE');

  } catch (err) {
    console.error('Error in test:', err);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testClaimsRoute();
