// Simple test to check voice service exports
const fs = require('fs');

// Read the actual TypeScript source
const source = fs.readFileSync('./src/services/voiceService.ts', 'utf8');

// Count the exports
const exportMatches = source.match(/^export\s+/gm);
console.log('Export statements found:', exportMatches ? exportMatches.length : 0);

// Look for the specific functions
const getSupportedLanguagesMatch = source.match(/export\s+function\s+getSupportedLanguages/);
const validateAudioFileMatch = source.match(/export\s+function\s+validateAudioFile/);

console.log('getSupportedLanguages export found:', !!getSupportedLanguagesMatch);
console.log('validateAudioFile export found:', !!validateAudioFileMatch);

// Check for syntax issues around the exports
const lines = source.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export function getSupportedLanguages')) {
    console.log(`getSupportedLanguages at line ${i + 1}:`);
    console.log(lines.slice(i - 2, i + 5).join('\n'));
    break;
  }
}
