"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const voiceService_1 = require("../../src/services/voiceService");
const speech_1 = require("@google-cloud/speech");
const promises_1 = __importDefault(require("fs/promises"));
// Mock the Google Speech client
jest.mock('@google-cloud/speech');
jest.mock('fs/promises');
describe('VoiceService', () => {
    let voiceService;
    let mockSpeechClient;
    beforeEach(() => {
        voiceService = new voiceService_1.VoiceService();
        mockSpeechClient = new speech_1.SpeechClient();
        voiceService.speechClient = mockSpeechClient;
    });
    describe('transcribeAudio', () => {
        it('should successfully transcribe audio file', async () => {
            // Mock file reading
            const mockAudioData = Buffer.from('mock-audio-data');
            promises_1.default.readFile.mockResolvedValue(mockAudioData);
            // Mock Google Speech API response
            const mockResponse = [{
                    results: [{
                            alternatives: [{
                                    transcript: 'Hello, I need help with my insurance claim',
                                    confidence: 0.95
                                }]
                        }]
                }];
            mockSpeechClient.recognize.mockResolvedValue(mockResponse);
            const result = await voiceService.transcribeAudio('./test-audio.wav', 'en-IN');
            expect(result).toEqual({
                transcript: 'Hello, I need help with my insurance claim',
                confidence: 0.95,
                language: 'en-IN',
                entities: {
                    claimNumber: null,
                    policyNumber: null,
                    incidentType: null,
                    location: null,
                    dateTime: null,
                    phoneNumber: null,
                    vehicleNumber: null
                }
            });
            expect(mockSpeechClient.recognize).toHaveBeenCalledWith({
                audio: { content: mockAudioData.toString('base64') },
                config: {
                    encoding: 'WEBM_OPUS',
                    sampleRateHertz: 16000,
                    languageCode: 'en-IN',
                    alternativeLanguageCodes: ['hi-IN', 'te-IN', 'ta-IN'],
                    enableAutomaticPunctuation: true,
                    enableWordTimeOffsets: true,
                    enableWordConfidence: true,
                    model: 'telephony'
                }
            });
        });
        it('should handle transcription errors gracefully', async () => {
            promises_1.default.readFile.mockRejectedValue(new Error('File not found'));
            await expect(voiceService.transcribeAudio('./non-existent.wav', 'en-IN')).rejects.toThrow('Audio transcription failed: File not found');
        });
        it('should extract entities from transcript', async () => {
            const mockAudioData = Buffer.from('mock-audio-data');
            promises_1.default.readFile.mockResolvedValue(mockAudioData);
            const mockResponse = [{
                    results: [{
                            alternatives: [{
                                    transcript: 'My claim number is CLM123456 and my policy number is POL789012. I had an accident on 2023-12-01 in Mumbai',
                                    confidence: 0.92
                                }]
                        }]
                }];
            mockSpeechClient.recognize.mockResolvedValue(mockResponse);
            const result = await voiceService.transcribeAudio('./test-audio.wav', 'en-IN');
            expect(result.entities.claimNumber).toBe('CLM123456');
            expect(result.entities.policyNumber).toBe('POL789012');
            expect(result.entities.location).toBe('Mumbai');
        });
    });
    describe('detectLanguage', () => {
        it('should detect language from transcript', () => {
            const hindiText = 'मुझे अपने बीमा दावे में मदद चाहिए';
            const result = voiceService.detectLanguage(hindiText);
            expect(result).toBe('hi-IN');
        });
        it('should default to English for unknown text', () => {
            const englishText = 'I need help with my insurance claim';
            const result = voiceService.detectLanguage(englishText);
            expect(result).toBe('en-IN');
        });
    });
    describe('extractEntities', () => {
        it('should extract claim number', () => {
            const transcript = 'My claim number is CLM123456';
            const entities = voiceService.extractEntities(transcript);
            expect(entities.claimNumber).toBe('CLM123456');
        });
        it('should extract policy number', () => {
            const transcript = 'Policy number POL789012';
            const entities = voiceService.extractEntities(transcript);
            expect(entities.policyNumber).toBe('POL789012');
        });
        it('should extract phone number', () => {
            const transcript = 'My phone number is +91-9876543210';
            const entities = voiceService.extractEntities(transcript);
            expect(entities.phoneNumber).toBe('+91-9876543210');
        });
        it('should extract vehicle number', () => {
            const transcript = 'Vehicle number MH01AB1234';
            const entities = voiceService.extractEntities(transcript);
            expect(entities.vehicleNumber).toBe('MH01AB1234');
        });
        it('should extract incident types', () => {
            const transcript = 'I had an accident yesterday';
            const entities = voiceService.extractEntities(transcript);
            expect(entities.incidentType).toBe('accident');
        });
        it('should return null for missing entities', () => {
            const transcript = 'Hello there';
            const entities = voiceService.extractEntities(transcript);
            expect(entities.claimNumber).toBeNull();
            expect(entities.policyNumber).toBeNull();
            expect(entities.phoneNumber).toBeNull();
        });
    });
    describe('getSupportedLanguages', () => {
        it('should return list of supported languages', () => {
            const languages = voiceService.getSupportedLanguages();
            expect(languages).toContain('en-IN');
            expect(languages).toContain('hi-IN');
            expect(languages).toContain('te-IN');
            expect(languages).toContain('ta-IN');
            expect(languages.length).toBeGreaterThan(5);
        });
    });
    describe('validateAudioFormat', () => {
        it('should validate supported audio formats', () => {
            expect(voiceService.validateAudioFormat('test.mp3')).toBe(true);
            expect(voiceService.validateAudioFormat('test.wav')).toBe(true);
            expect(voiceService.validateAudioFormat('test.m4a')).toBe(true);
            expect(voiceService.validateAudioFormat('test.webm')).toBe(true);
            expect(voiceService.validateAudioFormat('test.ogg')).toBe(true);
        });
        it('should reject unsupported audio formats', () => {
            expect(voiceService.validateAudioFormat('test.txt')).toBe(false);
            expect(voiceService.validateAudioFormat('test.jpg')).toBe(false);
            expect(voiceService.validateAudioFormat('test.pdf')).toBe(false);
        });
    });
});
//# sourceMappingURL=voiceService.test.js.map