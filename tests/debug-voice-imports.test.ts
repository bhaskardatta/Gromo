/// <reference types="jest" />
import * as voiceService from '../src/services/voiceService';

describe('Debug Voice Service Imports', () => {
  it('should debug voice service exports', () => {
    console.log('voiceService:', voiceService);
    console.log('Object.keys(voiceService):', Object.keys(voiceService));
    console.log('getSupportedLanguages type:', typeof voiceService.getSupportedLanguages);
    console.log('validateAudioFile type:', typeof voiceService.validateAudioFile);
    console.log('processVoiceInput type:', typeof voiceService.processVoiceInput);
    
    if (voiceService.getSupportedLanguages) {
      try {
        const result = voiceService.getSupportedLanguages();
        console.log('getSupportedLanguages result:', result);
      } catch (error) {
        console.error('Error calling getSupportedLanguages:', error);
      }
    }
  });
});
