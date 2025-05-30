// Artillery load test processor
const fs = require('fs');
const path = require('path');

module.exports = {
  // Set up phase
  setupPhase: (context, events, done) => {
    console.log('🚀 Starting load test setup...');
    
    // Create test fixtures if they don't exist
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create mock audio file
    const audioPath = path.join(fixturesDir, 'test-audio.mp3');
    if (!fs.existsSync(audioPath)) {
      fs.writeFileSync(audioPath, Buffer.from('mock-audio-data'));
    }

    // Create mock image file
    const imagePath = path.join(fixturesDir, 'test-document.jpg');
    if (!fs.existsSync(imagePath)) {
      fs.writeFileSync(imagePath, Buffer.from('mock-image-data'));
    }

    console.log('✅ Load test setup complete');
    done();
  },

  // Custom functions for scenarios
  logResponse: (context, events, done) => {
    events.on('response', (data) => {
      const { statusCode, url } = data;
      
      if (statusCode >= 400) {
        console.log(`❌ Error: ${statusCode} - ${url}`);
      } else if (statusCode >= 200 && statusCode < 300) {
        console.log(`✅ Success: ${statusCode} - ${url}`);
      }
    });
    
    done();
  },

  // Generate random data
  setRandomData: (context, events, done) => {
    context.vars.randomPolicyNumber = `POL${Math.floor(Math.random() * 1000000)}`;
    context.vars.randomClaimNumber = `CLM${Math.floor(Math.random() * 1000000)}`;
    context.vars.randomVehicleNumber = `MH${Math.floor(Math.random() * 100).toString().padStart(2, '0')}AB${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    done();
  },

  // Performance metrics tracking
  trackPerformance: (context, events, done) => {
    const startTime = Date.now();
    
    events.on('request', () => {
      context.vars.requestStartTime = Date.now();
    });

    events.on('response', (data) => {
      const responseTime = Date.now() - context.vars.requestStartTime;
      
      // Log slow responses
      if (responseTime > 5000) {
        console.log(`🐌 Slow response: ${responseTime}ms - ${data.url}`);
      }
      
      // Track authentication responses
      if (data.url.includes('/auth/login')) {
        console.log(`🔐 Auth response time: ${responseTime}ms`);
      }
      
      // Track file upload responses
      if (data.url.includes('/voice/transcribe') || data.url.includes('/ocr/extract')) {
        console.log(`📁 Upload processing time: ${responseTime}ms`);
      }
    });

    done();
  },

  // Error handling
  handleErrors: (context, events, done) => {
    events.on('error', (error) => {
      console.log(`💥 Error occurred: ${error.message}`);
      
      // Log specific error types
      if (error.code === 'ECONNREFUSED') {
        console.log('🔌 Connection refused - check if server is running');
      } else if (error.code === 'TIMEOUT') {
        console.log('⏰ Request timeout - server may be overloaded');
      }
    });

    done();
  }
};
