/// <reference types="jest" />

describe('Debug Import Test', () => {
  it('should import voice service functions individually', async () => {
    try {
      const voiceService = require('../src/services/voiceService');
      console.log('Required functions:', Object.keys(voiceService));
      
      expect(voiceService.processVoiceInput).toBeDefined();
      expect(voiceService.getSupportedLanguages).toBeDefined();
      expect(voiceService.validateAudioFile).toBeDefined();
    } catch (error) {
      console.error('Error importing:', error);
      throw error;
    }
  });
});
