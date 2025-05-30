/// <reference types="cypress" />

describe('Voice Processing E2E Tests', () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept('POST', '/api/voice/transcribe', {
      statusCode: 200,
      body: {
        transcript: 'I need help with my insurance claim',
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
      }
    }).as('transcribeApi');

    cy.intercept('GET', '/api/voice/languages', {
      statusCode: 200,
      body: {
        languages: ['en-IN', 'hi-IN', 'te-IN', 'ta-IN', 'mr-IN']
      }
    }).as('languagesApi');
  });

  it('should display voice upload interface', () => {
    cy.visit('/voice');
    
    // Check if voice upload interface is visible
    cy.get('[data-cy=voice-upload]').should('be.visible');
    cy.get('[data-cy=language-selector]').should('be.visible');
    cy.get('[data-cy=upload-button]').should('be.visible');
  });

  it('should handle successful voice transcription', () => {
    cy.login(Cypress.env('testUser').email, Cypress.env('testUser').password);
    cy.visit('/voice');
    
    // Select language
    cy.get('[data-cy=language-selector]').select('en-IN');
    
    // Upload audio file
    cy.uploadFile('[data-cy=audio-input]', 'test-audio.mp3');
    
    // Submit for transcription
    cy.get('[data-cy=transcribe-button]').click();
    
    // Wait for API call
    cy.waitForApi('@transcribeApi');
    
    // Check results
    cy.get('[data-cy=transcript-result]').should('contain', 'I need help with my insurance claim');
    cy.get('[data-cy=confidence-score]').should('contain', '95%');
  });

  it('should handle authentication errors', () => {
    cy.visit('/voice');
    
    // Try to upload without authentication
    cy.uploadFile('[data-cy=audio-input]', 'test-audio.mp3');
    cy.get('[data-cy=transcribe-button]').click();
    
    // Should show authentication error
    cy.get('[data-cy=error-message]').should('contain', 'Authentication required');
  });

  it('should validate file format', () => {
    cy.login(Cypress.env('testUser').email, Cypress.env('testUser').password);
    cy.visit('/voice');
    
    // Try to upload invalid file format
    cy.uploadFile('[data-cy=audio-input]', 'test-document.pdf');
    
    // Should show format validation error
    cy.get('[data-cy=error-message]').should('contain', 'Invalid file format');
  });

  it('should display supported languages', () => {
    cy.visit('/voice');
    
    // Click on language selector
    cy.get('[data-cy=language-selector]').click();
    
    // Wait for languages API
    cy.waitForApi('@languagesApi');
    
    // Check if languages are loaded
    cy.get('[data-cy=language-selector] option').should('have.length.greaterThan', 1);
    cy.get('[data-cy=language-selector]').should('contain', 'English (India)');
    cy.get('[data-cy=language-selector]').should('contain', 'Hindi');
  });

  it('should handle entity extraction results', () => {
    cy.intercept('POST', '/api/voice/transcribe', {
      statusCode: 200,
      body: {
        transcript: 'My claim number is CLM123456 and policy number is POL789012',
        confidence: 0.92,
        language: 'en-IN',
        entities: {
          claimNumber: 'CLM123456',
          policyNumber: 'POL789012',
          incidentType: null,
          location: null,
          dateTime: null,
          phoneNumber: null,
          vehicleNumber: null
        }
      }
    }).as('transcribeWithEntities');

    cy.login(Cypress.env('testUser').email, Cypress.env('testUser').password);
    cy.visit('/voice');
    
    cy.uploadFile('[data-cy=audio-input]', 'test-audio.mp3');
    cy.get('[data-cy=transcribe-button]').click();
    
    cy.waitForApi('@transcribeWithEntities');
    
    // Check extracted entities
    cy.get('[data-cy=entities-section]').should('be.visible');
    cy.get('[data-cy=claim-number]').should('contain', 'CLM123456');
    cy.get('[data-cy=policy-number]').should('contain', 'POL789012');
  });

  it('should handle rate limiting', () => {
    cy.login(Cypress.env('testUser').email, Cypress.env('testUser').password);
    cy.visit('/voice');
    
    // Mock rate limit response
    cy.intercept('POST', '/api/voice/transcribe', {
      statusCode: 429,
      body: {
        error: 'Too many requests. Please try again later.'
      }
    }).as('rateLimitApi');
    
    cy.uploadFile('[data-cy=audio-input]', 'test-audio.mp3');
    cy.get('[data-cy=transcribe-button]').click();
    
    cy.waitForApi('@rateLimitApi');
    
    // Should show rate limit message
    cy.get('[data-cy=error-message]').should('contain', 'Too many requests');
  });
});
