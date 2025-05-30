/// <reference types="cypress" />

describe('Voice Processing E2E Tests', () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept('POST', '/api/v1/voice/process', {
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
        },
        keywords: ['insurance', 'claim', 'help'],
        claimType: 'general'
      }
    }).as('processVoiceApi');
    
    // Visit the voice processing page
    cy.visit('/voice');
    
    // Login if needed
    cy.get('[data-cy=login-email]').type('user@example.com');
    cy.get('[data-cy=login-password]').type('password123');
    cy.get('[data-cy=login-submit]').click();
  });

  it('should allow uploading an audio file for processing', () => {
    // Upload an audio file
    cy.get('[data-cy=voice-upload]').attachFile('../fixtures/test-audio.mp3');
    
    // Click process button
    cy.get('[data-cy=process-audio]').click();
    
    // Wait for API response
    cy.wait('@processVoiceApi');
    
    // Check that the transcript is displayed
    cy.get('[data-cy=transcript-result]')
      .should('be.visible')
      .and('contain', 'I need help with my insurance claim');
  });

  it('should display extracted entities from voice processing', () => {
    // Upload an audio file
    cy.get('[data-cy=voice-upload]').attachFile('../fixtures/test-audio.mp3');
    
    // Click process button
    cy.get('[data-cy=process-audio]').click();
    
    // Wait for API response
    cy.wait('@processVoiceApi');
    
    // Check that entities section is displayed
    cy.get('[data-cy=entities-section]').should('be.visible');
    
    // Check confidence score is displayed correctly
    cy.get('[data-cy=confidence-score]')
      .should('be.visible')
      .and('contain', '95%');
  });

  it('should automatically detect claim type from voice input', () => {
    // Upload an audio file
    cy.get('[data-cy=voice-upload]').attachFile('../fixtures/test-audio.mp3');
    
    // Click process button
    cy.get('[data-cy=process-audio]').click();
    
    // Wait for API response
    cy.wait('@processVoiceApi');
    
    // Check that claim type is detected and displayed
    cy.get('[data-cy=claim-type]')
      .should('be.visible')
      .and('contain', 'general');
  });
});
