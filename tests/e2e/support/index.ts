// Cypress support commands and global configuration

// Import commands
import './commands';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing the test on uncaught exceptions
  // that are not related to our application logic
  return false;
});

// Custom assertions and types
/// <reference types="cypress-axe" />
/// <reference types="cypress-real-events" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to authenticate user
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to login as specific role
       * @example cy.loginAs('admin')
       */
      loginAs(role: 'admin' | 'adjuster' | 'customer'): Chainable<void>;
      
      /**
       * Custom command to upload file
       * @example cy.uploadFile('input[type=file]', 'test.jpg')
       */
      uploadFile(selector: string, fileName: string): Chainable<void>;
      
      /**
       * Custom command to wait for API call
       * @example cy.waitForApi('@transcribeApi')
       */
      waitForApi(alias: string): Chainable<void>;
    }
  }
}
