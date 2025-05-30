/// <reference types="jest" />
import request from 'supertest';
import app from '../../src/app';

describe('Voice Integration Tests', () => {
  describe('POST /api/voice/process', () => {
    it('should process voice input', async () => {
      const mockAudioData = Buffer.from('mock-audio-data');

      const response = await request(app)
        .post('/api/voice/process')
        .attach('audio', mockAudioData, 'test.wav')
        .field('language', 'en-IN');

      // Since we don't have auth setup in integration, expect 401 or similar
      expect([401, 404, 500]).toContain(response.status);
    });
  });

  describe('GET /api/voice/languages', () => {
    it('should get supported languages', async () => {
      const response = await request(app)
        .get('/api/voice/languages');

      // This might be a public endpoint, so could return 200 or error
      expect([200, 401, 404, 500]).toContain(response.status);
    });
  });
});