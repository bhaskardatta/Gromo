const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api/v1';

const debugClaims = async () => {
  try {
    console.log('🔍 Debugging Claims API issues...\n');

    // Step 1: Connect to MongoDB directly
    console.log('1. Connecting to MongoDB...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gromo';
    mongoose.set('debug', true); // Enable query logging
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Step 2: Check claims directly in the database
    console.log('2. Checking claims in MongoDB...');
    const Claim = mongoose.model('Claim', new mongoose.Schema({}, { strict: false }));
    const claims = await Claim.find({}).lean();
    
    console.log(`Found ${claims.length} claims in database:`);
    claims.forEach((claim, i) => {
      console.log(`\nClaim #${i+1}:`);
      console.log(`  ID: ${claim._id}`);
      console.log(`  Type: ${claim.type}`);
      console.log(`  Status: ${claim.status}`);
      console.log(`  Amount: ${claim.amount}`);
      console.log(`  User: ${claim.user}`);
    });
    
    // Step 3: Authenticate and test API
    console.log('\n3. Testing authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Authentication successful');
    
    // Step 4: Make API request with detailed logging
    console.log('\n4. Making API request with token...');
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const claimsResponse = await axios.get(`${BASE_URL}/claims`, config);
    
    console.log('✅ API Response:');
    console.log('  Status:', claimsResponse.status);
    console.log('  Response data:', JSON.stringify(claimsResponse.data, null, 2));
    
    // Comparison of DB vs API results
    console.log('\n5. Comparing DB data vs API response:');
    console.log(`  Database claims: ${claims.length}`);
    console.log(`  API returned claims: ${claimsResponse.data?.data?.claims?.length || 0}`);
    
    // Step 6: Check request with query params
    console.log('\n6. Testing with explicit query parameters...');
    const filteredResponse = await axios.get(`${BASE_URL}/claims?status=PENDING&page=1&limit=50`, config);
    
    console.log('✅ Filtered API Response:');
    console.log('  Status:', filteredResponse.status);
    console.log('  Response data:', JSON.stringify(filteredResponse.data, null, 2));

    await mongoose.disconnect();
    console.log('\n✅ Debugging complete');
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
    if (error.response) {
      console.error('  Response status:', error.response.status);
      console.error('  Response data:', error.response.data);
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

debugClaims();
