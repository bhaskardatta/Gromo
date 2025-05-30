const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api/v1';

/**
 * Comprehensive test script for Gromo backend APIs
 * Tests authentication, claims, OCR and voice endpoints
 */
async function testAllFeatures() {
  try {
    console.log('🧪 TESTING GROMO BACKEND FEATURES\n');
    
    // STEP 1: Authentication
    console.log('1️⃣ Testing Authentication...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Authentication successful');
    
    // Setup headers for authenticated requests
    const authHeaders = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    // STEP 2: Claims API
    console.log('\n2️⃣ Testing Claims API...');
    const claimsResponse = await axios.get(`${BASE_URL}/claims`, authHeaders);
    
    if (claimsResponse.data.data.claims && claimsResponse.data.data.claims.length > 0) {
      console.log(`✅ Claims API working - Found ${claimsResponse.data.data.claims.length} claims`);
    } else {
      console.log('❌ Claims API returned no claims');
    }
    
    // STEP 3: OCR Document Types
    console.log('\n3️⃣ Testing OCR Document Types...');
    const ocrTypesResponse = await axios.get(`${BASE_URL}/ocr/supported-document-types`);
    
    if (ocrTypesResponse.data.data && ocrTypesResponse.data.data.length > 0) {
      console.log(`✅ OCR API working - Found ${ocrTypesResponse.data.data.length} document types:`);
      console.log(`   ${ocrTypesResponse.data.data.join(', ')}`);
    } else {
      console.log('❌ OCR API returned no document types');
    }
    
    // STEP 4: Voice Languages
    console.log('\n4️⃣ Testing Voice Languages...');
    const voiceLanguagesResponse = await axios.get(`${BASE_URL}/voice/supported-languages`);
    
    if (voiceLanguagesResponse.data.data && voiceLanguagesResponse.data.data.length > 0) {
      console.log(`✅ Voice API working - Found ${voiceLanguagesResponse.data.data.length} supported languages`);
      console.log(`   Sample languages: ${voiceLanguagesResponse.data.data.slice(0, 3).join(', ')}...`);
    } else {
      console.log('❌ Voice API returned no supported languages');
    }
    
    // STEP 5: Health Check
    console.log('\n5️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL.replace('/api/v1', '')}/health`);
    
    if (healthResponse.data.success) {
      console.log(`✅ Health check passed - API version: ${healthResponse.data.version}`);
    } else {
      console.log('❌ Health check failed');
    }
    
    console.log('\n🎉 All API tests completed!');
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAllFeatures();
