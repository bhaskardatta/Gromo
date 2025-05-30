// Debug script to test voice service exports
const voiceService = require('./dist/services/voiceService');

console.log('voiceService object:', voiceService);
console.log('Available exports:', Object.keys(voiceService));
console.log('getSupportedLanguages type:', typeof voiceService.getSupportedLanguages);
console.log('validateAudioFile type:', typeof voiceService.validateAudioFile);

if (voiceService.getSupportedLanguages) {
    try {
        const languages = voiceService.getSupportedLanguages();
        console.log('Languages result:', languages);
    } catch (error) {
        console.error('Error calling getSupportedLanguages:', error);
    }
}
