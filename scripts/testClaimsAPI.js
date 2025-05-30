// Test script to directly test claims API functionality
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();

// Import models after connecting to database
async function testClaimsAPI() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/gromo');
        console.log('✅ Connected to MongoDB');

        // Import models after connection
        const { Claim } = require('../dist/models/Claim');
        const { User } = require('../dist/models/User');

        console.log('\n📊 Testing Claims API Functionality');
        console.log('=' * 50);

        // Test 1: Count total claims
        const totalClaims = await Claim.countDocuments();
        console.log(`\n1. Total claims in database: ${totalClaims}`);

        // Test 2: Get all claims with populate
        const claims = await Claim.find({})
            .populate('user', 'name phone')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        console.log(`\n2. Retrieved ${claims.length} claims with user data:`);
        claims.forEach((claim, index) => {
            const user = claim.user;
            console.log(`   Claim ${index + 1}:`);
            console.log(`     ID: ${claim._id}`);
            console.log(`     Type: ${claim.type}`);
            console.log(`     Status: ${claim.status}`);
            console.log(`     Amount: $${claim.amount}`);
            console.log(`     User: ${user?.name || 'Unknown'} (${user?.phone || 'No phone'})`);
            console.log(`     Created: ${claim.createdAt}`);
            console.log('   ---');
        });

        // Test 3: Test the exact query used in the API
        const filter = {};
        const skip = 0;
        const limit = 10;
        
        const apiClaims = await Claim.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name phone')
            .lean();
            
        const total = await Claim.countDocuments(filter);
        
        console.log(`\n3. API-style query results:`);
        console.log(`   Total matching: ${total}`);
        console.log(`   Retrieved: ${apiClaims.length}`);

        // Test format for response (simulate the API formatting)
        const formattedClaims = apiClaims.map(claim => {
            const userData = claim.user;
            return {
                id: claim._id,
                claimNumber: claim._id.toString().slice(-8).toUpperCase(),
                type: claim.type,
                status: claim.status,
                amount: claim.amount,
                dateFiled: claim.createdAt,
                description: claim.description || (claim.claimDetails ? claim.claimDetails.description : 'No description'),
                userName: userData && userData.name ? userData.name : 'Unknown',
                userPhone: userData && userData.phone ? userData.phone : 'Unknown'
            };
        });

        console.log(`\n4. Formatted claims (API response format):`);
        formattedClaims.forEach((claim, index) => {
            console.log(`   ${index + 1}. ${claim.claimNumber} - ${claim.type} - $${claim.amount}`);
            console.log(`      Status: ${claim.status}, User: ${claim.userName}`);
        });

        // Test 5: Test specific claim retrieval
        if (claims.length > 0) {
            const firstClaimId = claims[0]._id;
            console.log(`\n5. Testing specific claim retrieval:`);
            console.log(`   Looking for claim ID: ${firstClaimId}`);
            
            const specificClaim = await Claim.findById(firstClaimId)
                .populate('user', 'name phone')
                .lean();
            
            if (specificClaim) {
                console.log(`   ✅ Found claim: ${specificClaim.type} - $${specificClaim.amount}`);
                console.log(`   User: ${specificClaim.user?.name || 'Unknown'}`);
            } else {
                console.log(`   ❌ Claim not found`);
            }
        }

        // Test 6: Create a JWT token for testing
        const testUser = {
            id: 'test-user-123',
            email: 'test@example.com',
            role: 'admin'
        };

        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const token = jwt.sign(testUser, jwtSecret, { expiresIn: '1h' });
        
        console.log(`\n6. Generated test JWT token:`);
        console.log(`   Token: ${token.substring(0, 50)}...`);
        console.log(`   Use this for API testing with: Authorization: Bearer <token>`);

        console.log(`\n✅ All tests completed successfully!`);
        console.log(`\n📋 Summary:`);
        console.log(`   - Database connection: Working`);
        console.log(`   - Claims model: Working`);
        console.log(`   - User population: Working`);
        console.log(`   - Data formatting: Working`);
        console.log(`   - JWT generation: Working`);

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testClaimsAPI();
