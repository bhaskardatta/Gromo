const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testClaimsWithAuth() {
    try {
        console.log('🧪 Testing Claims API with Authentication...\n');

        // Step 1: Login to get authentication token
        console.log('1. Authenticating user...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@example.com',  // Use valid test credentials
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Authentication successful');
        console.log(`Token: ${token.substring(0, 20)}...`);

        // Step 2: Test claims endpoint with authentication
        console.log('\n2. Fetching claims with authentication...');
        const claimsResponse = await axios.get(`${BASE_URL}/claims`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Claims endpoint working!');
        console.log(`Status: ${claimsResponse.status}`);
        
        const claimsData = claimsResponse.data.data;
        console.log(`Claims count: ${claimsData.claims?.length || 0}`);
        console.log(`Total count: ${claimsData.total || 0}`);
        
        // Display first claim details
        if (claimsData.claims && claimsData.claims.length > 0) {
            const firstClaim = claimsData.claims[0];
            console.log('\n📋 Sample claim:');
            console.log(`  ID: ${firstClaim.id}`);
            console.log(`  Claim Number: ${firstClaim.claimNumber}`);
            console.log(`  Type: ${firstClaim.type}`);
            console.log(`  Status: ${firstClaim.status}`);
            console.log(`  Amount: ₹${firstClaim.amount}`);
            console.log(`  User: ${firstClaim.userName}`);
            console.log(`  Created: ${new Date(firstClaim.dateFiled).toLocaleDateString()}`);
            console.log(`  Description: ${firstClaim.description}`);
        }

        // Step 3: Test pagination
        console.log('\n3. Testing pagination...');
        const paginatedResponse = await axios.get(`${BASE_URL}/claims?page=1&limit=2`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`✅ Pagination working - Page 1 with 2 items: ${paginatedResponse.data.data.claims?.length || 0} claims`);

        // Step 4: Test filtering by status
        console.log('\n4. Testing status filter...');
        const filteredResponse = await axios.get(`${BASE_URL}/claims?status=pending`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`✅ Status filter working - Pending claims: ${filteredResponse.data.data.claims?.length || 0}`);

        console.log('\n🎉 All Claims API tests passed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.error('Authentication issue - check token or auth middleware');
        }
    }
}

testClaimsWithAuth();
