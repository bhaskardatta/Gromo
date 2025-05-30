// Quick debug script to test fraud analysis
const mockClaim = {
  _id: 'test',
  user: 'test_user',
  estimatedAmount: 100000,
  documents: [],
  voiceData: {
    transcript: 'total loss stolen vandalism',
    confidence: 0.3
  },
  createdAt: new Date()
};

console.log('Mock claim:', JSON.stringify(mockClaim, null, 2));

// Test keyword matching logic
const fraudKeywords = ['total loss', 'stolen', 'vandalism', 'hit and run'];
const transcript = mockClaim.voiceData?.transcript?.toLowerCase() || '';
console.log('Transcript:', transcript);

const keywordMatches = fraudKeywords.filter(keyword => transcript.includes(keyword));
console.log('Keyword matches:', keywordMatches);
console.log('Keyword score:', keywordMatches.length * 10);

// Test amount check
console.log('Amount check (>50000):', mockClaim.estimatedAmount > 50000);

// Test document check
console.log('Document count:', mockClaim.documents?.length);
console.log('Document check (<2):', (mockClaim.documents?.length || 0) < 2);

// Test voice confidence
console.log('Voice confidence:', mockClaim.voiceData?.confidence);
console.log('Voice confidence check (<0.7):', mockClaim.voiceData?.confidence < 0.7);
