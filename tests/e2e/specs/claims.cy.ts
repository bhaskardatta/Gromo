/// <reference types="cypress" />

describe('Claims Management E2E Tests', () => {
  beforeEach(() => {
    // Set up API intercepts
    cy.intercept('GET', '/api/claims', {
      statusCode: 200,
      body: {
        claims: [
          {
            id: 'claim-001',
            claimNumber: 'CLM-2024-001',
            policyNumber: 'POL-12345',
            status: 'pending',
            amount: 50000,
            incidentDate: '2024-01-15',
            createdAt: '2024-01-16T10:00:00Z'
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      }
    }).as('getClaims');

    cy.intercept('POST', '/api/claims', {
      statusCode: 201,
      body: {
        id: 'claim-002',
        claimNumber: 'CLM-2024-002',
        message: 'Claim created successfully'
      }
    }).as('createClaim');

    cy.intercept('PUT', '/api/claims/*', {
      statusCode: 200,
      body: {
        message: 'Claim updated successfully'
      }
    }).as('updateClaim');

    cy.intercept('GET', '/api/claims/analytics', {
      statusCode: 200,
      body: {
        totalClaims: 156,
        pendingClaims: 23,
        approvedClaims: 98,
        rejectedClaims: 35,
        totalClaimAmount: 2500000,
        averageProcessingTime: 7.5,
        claimsByMonth: [
          { month: 'Jan', count: 15 },
          { month: 'Feb', count: 12 },
          { month: 'Mar', count: 18 }
        ]
      }
    }).as('getAnalytics');
  });

  describe('Claims Dashboard', () => {
    it('should display claims dashboard with analytics', () => {
      cy.login('test@example.com', 'password123');
      cy.visit('/dashboard/claims');
      
      // Wait for analytics data
      cy.wait('@getAnalytics');
      
      // Check analytics cards
      cy.get('[data-cy=total-claims]').should('contain', '156');
      cy.get('[data-cy=pending-claims]').should('contain', '23');
      cy.get('[data-cy=approved-claims]').should('contain', '98');
      cy.get('[data-cy=rejected-claims]').should('contain', '35');
      
      // Check charts are rendered
      cy.get('[data-cy=claims-chart]').should('be.visible');
      cy.get('[data-cy=trend-chart]').should('be.visible');
    });

    it('should filter claims by status', () => {
      cy.login('test@example.com', 'password123');
      cy.visit('/dashboard/claims');
      
      // Select pending filter
      cy.get('[data-cy=status-filter]').select('pending');
      cy.get('[data-cy=apply-filter]').click();
      
      // Verify filtered request
      cy.wait('@getClaims').then((interception) => {
        expect(interception.request.url).to.include('status=pending');
      });
    });

    it('should search claims by claim number', () => {
      cy.login('test@example.com', 'password123');
      cy.visit('/dashboard/claims');
      
      // Search for specific claim
      cy.get('[data-cy=search-input]').type('CLM-2024-001');
      cy.get('[data-cy=search-button]').click();
      
      // Verify search request
      cy.wait('@getClaims').then((interception) => {
        expect(interception.request.url).to.include('search=CLM-2024-001');
      });
    });
  });

  describe('Claim Creation', () => {
    it('should create a new claim with all required fields', () => {
      cy.login('test@example.com', 'password123');
      cy.visit('/claims/new');
      
      // Fill claim form
      cy.get('[data-cy=policy-number]').type('POL-12345');
      cy.get('[data-cy=incident-type]').select('Vehicle Accident');
      cy.get('[data-cy=incident-date]').type('2024-01-15');
      cy.get('[data-cy=incident-location]').type('Mumbai, Maharashtra');
      cy.get('[data-cy=claim-amount]').type('75000');
      cy.get('[data-cy=description]').type('Minor collision at traffic signal');
      
      // Upload documents
      cy.uploadFile('[data-cy=document-upload]', 'test-document.jpg');
      cy.get('[data-cy=document-type]').select('Accident Report');
      
      // Submit claim
      cy.get('[data-cy=submit-claim]').click();
      
      // Verify submission
      cy.wait('@createClaim');
      cy.get('[data-cy=success-message]').should('contain', 'Claim created successfully');
      cy.url().should('include', '/claims/CLM-2024-002');
    });

    it('should validate required fields', () => {
      cy.login('test@example.com', 'password123');
      cy.visit('/claims/new');
      
      // Try to submit without required fields
      cy.get('[data-cy=submit-claim]').click();
      
      // Check validation messages
      cy.get('[data-cy=policy-number-error]').should('contain', 'Policy number is required');
      cy.get('[data-cy=incident-type-error]').should('contain', 'Incident type is required');
      cy.get('[data-cy=incident-date-error]').should('contain', 'Incident date is required');
    });

    it('should handle file upload errors gracefully', () => {
      cy.login('test@example.com', 'password123');
      cy.visit('/claims/new');
      
      // Try to upload invalid file type
      cy.uploadFile('[data-cy=document-upload]', 'invalid-file.txt');
      
      // Check error message
      cy.get('[data-cy=upload-error]').should('contain', 'Invalid file type');
    });
  });

  describe('Claim Processing Workflow', () => {
    it('should handle claim status updates', () => {
      cy.login('adjuster@example.com', 'password123');
      cy.visit('/claims/CLM-2024-001');
      
      // Update claim status
      cy.get('[data-cy=status-select]').select('Under Review');
      cy.get('[data-cy=notes-input]').type('Initial review completed. Requesting additional documents.');
      cy.get('[data-cy=update-status]').click();
      
      // Verify update
      cy.wait('@updateClaim');
      cy.get('[data-cy=status-updated]').should('contain', 'Status updated successfully');
    });

    it('should approve claim with settlement amount', () => {
      cy.login('adjuster@example.com', 'password123');
      cy.visit('/claims/CLM-2024-001');
      
      // Approve claim
      cy.get('[data-cy=approve-claim]').click();
      cy.get('[data-cy=settlement-amount]').type('45000');
      cy.get('[data-cy=approval-notes]').type('Claim approved after thorough investigation.');
      cy.get('[data-cy=confirm-approval]').click();
      
      // Verify approval
      cy.wait('@updateClaim');
      cy.get('[data-cy=claim-approved]').should('contain', 'Claim approved successfully');
    });

    it('should reject claim with reason', () => {
      cy.login('adjuster@example.com', 'password123');
      cy.visit('/claims/CLM-2024-001');
      
      // Reject claim
      cy.get('[data-cy=reject-claim]').click();
      cy.get('[data-cy=rejection-reason]').select('Policy Violation');
      cy.get('[data-cy=rejection-notes]').type('Claim rejected due to policy exclusions.');
      cy.get('[data-cy=confirm-rejection]').click();
      
      // Verify rejection
      cy.wait('@updateClaim');
      cy.get('[data-cy=claim-rejected]').should('contain', 'Claim rejected');
    });
  });

  describe('Performance and Accessibility', () => {
    it('should load claims list within performance budget', () => {
      cy.login('test@example.com', 'password123');
      
      // Measure page load time
      const start = performance.now();
      cy.visit('/dashboard/claims');
      cy.wait('@getClaims').then(() => {
        const end = performance.now();
        const loadTime = end - start;
        expect(loadTime).to.be.lessThan(3000); // 3 seconds
      });
    });

    it('should be keyboard navigable', () => {
      cy.login('test@example.com', 'password123');
      cy.visit('/claims/new');
      
      // Test tab navigation
      cy.get('[data-cy=policy-number]').focus();
      cy.focused().should('have.attr', 'data-cy', 'policy-number');
      
      cy.get('[data-cy=incident-type]').focus();
      cy.focused().should('have.attr', 'data-cy', 'incident-type');
    });

    it('should meet accessibility standards', () => {
      cy.login('test@example.com', 'password123');
      cy.visit('/dashboard/claims');
      
      // Basic accessibility checks
      cy.get('h1, h2, h3, h4, h5, h6').should('exist');
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
      cy.get('input, textarea, select').each(($input) => {
        const element = $input[0];
        const hasAriaLabel = element.hasAttribute('aria-label');
        const hasId = element.hasAttribute('id');
        expect(hasAriaLabel || hasId).to.be.true;
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should display properly on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.login('test@example.com', 'password123');
      cy.visit('/dashboard/claims');
      
      // Check mobile navigation
      cy.get('[data-cy=mobile-menu-toggle]').should('be.visible');
      cy.get('[data-cy=mobile-menu-toggle]').click();
      cy.get('[data-cy=mobile-menu]').should('be.visible');
      
      // Check responsive layout
      cy.get('[data-cy=claims-grid]').should('have.css', 'flex-direction', 'column');
    });

    it('should handle touch interactions', () => {
      cy.viewport('ipad-2');
      cy.login('test@example.com', 'password123');
      cy.visit('/dashboard/claims');
      
      // Test swipe gestures on claim cards
      cy.get('[data-cy=claim-card]').first().trigger('touchstart');
      cy.get('[data-cy=claim-card]').first().trigger('touchend');
    });
  });
});
