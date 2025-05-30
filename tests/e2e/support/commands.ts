// Custom Cypress commands
import '@cypress/code-coverage/support';
import 'cypress-file-upload';

// Add custom command types
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<Cypress.Response<any>>;
      loginAsCustomer(): Chainable<void>;
      loginAsAdjuster(): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      mockAuthEndpoints(): void;
    }
  }
}

// User login helpers
Cypress.Commands.add('login', (email, password) => {
  // Use the correct API endpoint path
  return cy.request({
    method: 'POST',
    url: '/api/v1/auth/login',  // Fixed URL - removed undefined prefix
    body: {
      email: email || 'test@example.com',
      password: password || 'password123'
    }
  }).then((response) => {
    // Store the token in localStorage as your app would
    window.localStorage.setItem('authToken', response.body.token);
    return response;
  });
});

// Login as specific user roles
Cypress.Commands.add('loginAsCustomer', () => {
  return cy.login('customer@gromo.com', 'password123');
});

Cypress.Commands.add('loginAsAdjuster', () => {
  return cy.login('adjuster@example.com', 'password123');
});

Cypress.Commands.add('loginAsAdmin', () => {
  return cy.login('admin@gromo.com', 'password123');
});

// Mock the auth endpoints for tests
Cypress.Commands.add('mockAuthEndpoints', () => {
  cy.intercept('POST', '/api/v1/auth/login', {
    statusCode: 200,
    body: {
      token: 'mock-jwt-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'customer'
      }
    }
  }).as('loginRequest');
  
  cy.intercept('GET', '/api/v1/auth/profile', {
    statusCode: 200,
    body: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'customer'
    }
  }).as('profileRequest');
});
