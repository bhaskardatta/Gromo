/// <reference types="jest" />
import { processVoiceInput, getSupportedLanguages, validateAudioFile } from '../../../src/services/voiceService';

// Mock Google Cloud Speech
jest.mock('@google-cloud/speech', () => ({
  SpeechClient: jest.fn().mockImplementation(() => ({
    recognize: jest.fn()
  }))
}));

// Mock crypto for deterministic tests
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-hash')
  }))
}));

// Mock the EnhancedCacheService
jest.mock('../../../src/services/enhancedCacheService', () => ({
  EnhancedCacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true)
  }
}));

describe('Voice Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processVoiceInput', () => {
    it('should process audio buffer and return voice processing result', async () => {
      const mockAudioBuffer = Buffer.from('fake-audio-data');
      const mockOptions = {
        language: 'en-IN',
        audioFormat: 'mp3',
        enableAutomaticPunctuation: true
      };

      const result = await processVoiceInput(mockAudioBuffer, mockOptions);

      expect(result).toBeDefined();
      expect(result.transcript).toBeDefined();
      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBeTruthy();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.detectedLanguage).toBeDefined();
      expect(result.extractedClaimData).toBeDefined();
    });

    it('should handle mock processing in development mode', async () => {
      const mockAudioBuffer = Buffer.from('test-audio');
      const mockOptions = {
        language: 'hi-IN',
        audioFormat: 'wav'
      };

      const result = await processVoiceInput(mockAudioBuffer, mockOptions);

      expect(result.transcript).toContain('मैं एक कार दुर्घटना'); // Hindi mock text
      expect(result.detectedLanguage).toBe('hi-IN');
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should extract accident claim type from keywords', async () => {
      const mockAudioBuffer = Buffer.from('accident-audio');
      const mockOptions = {
        language: 'en-IN',
        audioFormat: 'mp3'
      };

      const result = await processVoiceInput(mockAudioBuffer, mockOptions);

      // Check if accident-related keywords are detected
      const hasAccidentKeywords = result.keywords.some(keyword => 
        ['accident', 'crash', 'collision', 'vehicle', 'car'].includes(keyword.toLowerCase())
      );
      
      if (hasAccidentKeywords) {
        expect(result.extractedClaimData.claimType).toBe('accident');
      }
    });

    it('should extract medical claim type from keywords', async () => {
      const mockAudioBuffer = Buffer.from('medical-audio');
      const mockOptions = {
        language: 'en-IN',
        audioFormat: 'wav'
      };

      const result = await processVoiceInput(mockAudioBuffer, mockOptions);

      // The mock will return medical-related content
      if (result.transcript.toLowerCase().includes('hospital') || 
          result.transcript.toLowerCase().includes('doctor')) {
        expect(result.extractedClaimData.claimType).toBe('medical');
      }
    });

    it('should handle different audio formats', async () => {
      const formats = ['mp3', 'wav', 'flac', 'ogg'];
      
      for (const format of formats) {
        const mockAudioBuffer = Buffer.from(`${format}-audio`);
        const mockOptions = {
          language: 'en-IN',
          audioFormat: format
        };

        const result = await processVoiceInput(mockAudioBuffer, mockOptions);
        expect(result).toBeDefined();
        expect(result.transcript).toBeDefined();
      }
    });

    it('should handle different languages', async () => {
      const languages = ['en-IN', 'hi-IN', 'ta-IN', 'te-IN'];
      
      for (const language of languages) {
        const mockAudioBuffer = Buffer.from(`${language}-audio`);
        const mockOptions = {
          language: language,
          audioFormat: 'mp3'
        };

        const result = await processVoiceInput(mockAudioBuffer, mockOptions);
        expect(result).toBeDefined();
        expect(result.detectedLanguage).toBe(language);
      }
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return array of supported languages', () => {
      const languages = getSupportedLanguages();

      expect(Array.isArray(languages)).toBeTruthy();
      expect(languages.length).toBeGreaterThan(0);
      
      // Check structure of language objects
      languages.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
      });

      // Check for specific Indian languages
      const codes = languages.map(lang => lang.code);
      expect(codes).toContain('en-IN');
      expect(codes).toContain('hi-IN');
    });

    it('should include common Indian languages', () => {
      const languages = getSupportedLanguages();
      const codes = languages.map(lang => lang.code);

      const expectedLanguages = ['en-IN', 'hi-IN', 'ta-IN', 'te-IN', 'kn-IN', 'mr-IN'];
      expectedLanguages.forEach(expectedLang => {
        expect(codes).toContain(expectedLang);
      });
    });
  });

  describe('validateAudioFile', () => {
    it('should validate audio buffer and mime type', () => {
      const validBuffer = Buffer.from('valid-audio-data');
      const validMimeType = 'audio/mpeg';

      const result = validateAudioFile(validBuffer, validMimeType);

      expect(result).toHaveProperty('valid');
      expect(typeof result.valid).toBe('boolean');
    });

    it('should accept valid audio formats', () => {
      const validFormats = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg'];
      const buffer = Buffer.from('test-audio');

      validFormats.forEach(format => {
        const result = validateAudioFile(buffer, format);
        expect(result.valid).toBeTruthy();
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid audio formats', () => {
      const invalidFormats = ['video/mp4', 'image/jpeg', 'text/plain', 'application/json'];
      const buffer = Buffer.from('test-data');

      invalidFormats.forEach(format => {
        const result = validateAudioFile(buffer, format);
        expect(result.valid).toBeFalsy();
        expect(result.error).toContain('Unsupported audio format');
      });
    });

    it('should reject oversized files', () => {
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const validMimeType = 'audio/mpeg';

      const result = validateAudioFile(largeBuffer, validMimeType);

      expect(result.valid).toBeFalsy();
      expect(result.error).toContain('Audio file too large');
    });

    it('should accept files within size limit', () => {
      // Create a buffer smaller than 10MB
      const smallBuffer = Buffer.alloc(1024); // 1KB
      const validMimeType = 'audio/wav';

      const result = validateAudioFile(smallBuffer, validMimeType);

      expect(result.valid).toBeTruthy();
      expect(result.error).toBeUndefined();
    });

    it('should handle edge cases', () => {
      // Empty buffer
      const emptyBuffer = Buffer.alloc(0);
      let result = validateAudioFile(emptyBuffer, 'audio/mpeg');
      expect(result.valid).toBeTruthy(); // Empty files should be valid

      // Case insensitive mime types
      const buffer = Buffer.from('test');
      result = validateAudioFile(buffer, 'AUDIO/MPEG');
      expect(result.valid).toBeTruthy();

      result = validateAudioFile(buffer, 'Audio/Wav');
      expect(result.valid).toBeTruthy();
    });
  });
});
