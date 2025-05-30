// Simple script to validate the claims in the database directly using the compiled model
const mongoose = require('mongoose');
require('dotenv').config();

const connectToMongo = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gromo';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const checkModels = async () => {
  try {
    await connectToMongo();

    // Import compiled models (from dist folder)
    const { Claim } = require('../dist/models/Claim');
    const { User } = require('../dist/models/User');
    
    console.log('\n1. Verifying User model...');
    const users = await User.find().lean();
    console.log(`Found ${users.length} users`);
    for (const user of users) {
      console.log(`- User: ${user.name}, Phone: ${user.phone}`);
    }
    
    console.log('\n2. Verifying Claim model...');
    console.log('Schema definition:', Object.keys(Claim.schema.paths));
    console.log('Claim model status types:', Claim.schema.paths.status.enumValues);
    console.log('Claim model type values:', Claim.schema.paths.type.enumValues);

    console.log('\n3. Querying claims with empty filter...');
    const claims = await Claim.find({}).lean();
    console.log(`Found ${claims.length} claims with empty filter`);
    
    console.log('\n4. Querying claims with specific status...');
    const pendingClaims = await Claim.find({ status: 'PENDING' }).lean();
    console.log(`Found ${pendingClaims.length} pending claims`);
    
    console.log('\n5. Direct query with MongoDB native driver...');
    const claimCollection = mongoose.connection.collection('claims');
    const allClaimsFromCollection = await claimCollection.find({}).toArray();
    console.log(`Found ${allClaimsFromCollection.length} claims in collection directly`);
    
    if (allClaimsFromCollection.length > 0) {
      console.log('First claim raw data:', JSON.stringify(allClaimsFromCollection[0], null, 2));
    }
  } catch (err) {
    console.error('Error checking models:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

checkModels();
