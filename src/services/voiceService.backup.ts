import { logger } from '../utils/logger';

interface VoiceProcessingOptions {
    language: string;
    audioFormat: string;
}

interface VoiceProcessingResult {
    transcript: string;
    keywords: string[];
    confidence: number;
    detectedLanguage: string;
    extractedClaimData: any;
}

// Keywords that trigger claim type detection
const CLAIM_KEYWORDS = {
    accident: ['accident', 'crash', 'collision', 'hit', 'vehicle', 'bike', 'car', 'truck'],
    medical: ['hospital', 'doctor', 'treatment', 'surgery', 'illness', 'disease', 'fever', 'pain'],
    pharmacy: ['medicine', 'pharmacy', 'drug', 'prescription', 'tablet', 'injection', 'syrup']
};

/**
 * Process voice input using Google Speech-to-Text API
 * This is a mock implementation - in production, integrate with @google-cloud/speech
 */
export async function processVoiceInput(
    audioBuffer: Buffer,
    options: VoiceProcessingOptions
): Promise<VoiceProcessingResult> {
    try {
        logger.info(`Processing voice input - Language: ${options.language}, Format: ${options.audioFormat}`);

        // Mock Google Speech-to-Text processing
        // In production, this would be:
        // const speech = new SpeechClient();
        // const request = { audio: { content: audioBuffer.toString('base64') }, config: { ... } };
        // const [response] = await speech.recognize(request);
        
        const mockTranscripts = [
            "I had an accident near the hospital yesterday and need to file a claim for vehicle damage",
            "I went to the doctor for fever and have medical bills to claim",
            "I bought medicines from pharmacy and want to submit the bills for reimbursement",
            "There was a collision at the traffic signal and my bike got damaged",
            "I was hospitalized for surgery and have all the medical documents"
        ];

        // Simulate voice processing
        const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
        const confidence = 0.85 + Math.random() * 0.1; // 85-95% confidence

        // Extract keywords
        const detectedKeywords = extractKeywords(transcript);
        
        // Determine claim type based on keywords
        const claimType = determineClaimType(detectedKeywords);
        
        // Extract structured data from transcript
        const extractedClaimData = extractClaimData(transcript, detectedKeywords, claimType);

        logger.info(`Voice processing completed - Transcript: "${transcript.substring(0, 50)}..."`);

        return {
            transcript,
            keywords: detectedKeywords,
            confidence,
            detectedLanguage: options.language,
            extractedClaimData
        };

    } catch (error) {
        logger.error('Voice processing failed:', error);
        throw new Error('Voice processing failed');
    }
}

/**
 * Extract relevant keywords from transcript
 */
function extractKeywords(transcript: string): string[] {
    const words = transcript.toLowerCase().split(/\s+/);
    const keywords: string[] = [];

    // Check for claim-related keywords
    Object.values(CLAIM_KEYWORDS).flat().forEach(keyword => {
        if (words.some(word => word.includes(keyword) || keyword.includes(word))) {
            keywords.push(keyword);
        }
    });

    // Extract specific entities (mock implementation)
    const entities = {
        locations: extractLocations(transcript),
        amounts: extractAmounts(transcript),
        dates: extractDates(transcript)
    };

    // Add extracted entities as keywords
    Object.values(entities).flat().forEach(entity => {
        if (entity) keywords.push(entity);
    });

    return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Determine claim type based on detected keywords
 */
function determineClaimType(keywords: string[]): string {
    const scores = {
        accident: 0,
        medical: 0,
        pharmacy: 0
    };

    keywords.forEach(keyword => {
        Object.entries(CLAIM_KEYWORDS).forEach(([type, typeKeywords]) => {
            if (typeKeywords.includes(keyword)) {
                scores[type as keyof typeof scores]++;
            }
        });
    });

    // Return the type with highest score
    return Object.entries(scores).reduce((a, b) => scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b)[0];
}

/**
 * Extract structured claim data from transcript
 */
function extractClaimData(transcript: string, keywords: string[], claimType: string): any {
    const baseData = {
        claimType,
        severity: determineSeverity(transcript, keywords),
        extractedEntities: {
            locations: extractLocations(transcript),
            amounts: extractAmounts(transcript),
            dates: extractDates(transcript)
        }
    };

    // Add type-specific data
    switch (claimType) {
        case 'accident':
            return {
                ...baseData,
                vehicleType: extractVehicleType(transcript),
                damageType: extractDamageType(transcript)
            };
            
        case 'medical':
            return {
                ...baseData,
                treatmentType: extractTreatmentType(transcript),
                symptoms: extractSymptoms(transcript)
            };
            
        case 'pharmacy':
            return {
                ...baseData,
                medicineType: extractMedicineType(transcript)
            };
            
        default:
            return baseData;
    }
}

// Helper functions for entity extraction
function extractLocations(transcript: string): string[] {
    const locationKeywords = ['hospital', 'clinic', 'pharmacy', 'road', 'street', 'near', 'at'];
    const words = transcript.split(/\s+/);
    const locations: string[] = [];

    words.forEach((word, index) => {
        if (locationKeywords.includes(word.toLowerCase()) && index < words.length - 1) {
            locations.push(words[index + 1]);
        }
    });

    return locations;
}

function extractAmounts(transcript: string): string[] {
    const amountRegex = /₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)/g;
    const matches = transcript.match(amountRegex);
    return matches || [];
}

function extractDates(transcript: string): string[] {
    const dateKeywords = ['yesterday', 'today', 'last week', 'last month'];
    const words = transcript.toLowerCase().split(/\s+/);
    
    return dateKeywords.filter(keyword => words.includes(keyword));
}

function determineSeverity(transcript: string, keywords: string[]): string {
    const highSeverityWords = ['emergency', 'urgent', 'severe', 'critical', 'surgery', 'accident'];
    const lowSeverityWords = ['minor', 'small', 'light', 'routine'];

    const text = transcript.toLowerCase();
    
    if (highSeverityWords.some(word => text.includes(word))) {
        return 'high';
    } else if (lowSeverityWords.some(word => text.includes(word))) {
        return 'low';
    }
    
    return 'medium';
}

function extractVehicleType(transcript: string): string | null {
    const vehicles = ['car', 'bike', 'motorcycle', 'truck', 'bus', 'auto', 'vehicle'];
    const text = transcript.toLowerCase();
    
    return vehicles.find(vehicle => text.includes(vehicle)) || null;
}

function extractDamageType(transcript: string): string | null {
    const damageTypes = ['scratch', 'dent', 'broken', 'damaged', 'collision', 'crash'];
    const text = transcript.toLowerCase();
    
    return damageTypes.find(damage => text.includes(damage)) || null;
}

function extractTreatmentType(transcript: string): string | null {
    const treatments = ['surgery', 'consultation', 'treatment', 'checkup', 'operation'];
    const text = transcript.toLowerCase();
    
    return treatments.find(treatment => text.includes(treatment)) || null;
}

function extractSymptoms(transcript: string): string[] {
    const symptoms = ['fever', 'pain', 'headache', 'cough', 'cold', 'injury'];
    const text = transcript.toLowerCase();
    
    return symptoms.filter(symptom => text.includes(symptom));
}

function extractMedicineType(transcript: string): string | null {
    const medicineTypes = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops'];
    const text = transcript.toLowerCase();
    
    return medicineTypes.find(medicine => text.includes(medicine)) || null;
}
