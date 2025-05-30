/// <reference types="cypress" />

describe('User Authentication & Authorization E2E Tests', () => {
  beforeEach(() => {
    // Reset database state
    cy.task('db:seed');
    
    // Set up API intercepts
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'adjuster',
          permissions: ['view_claims', 'edit_claims', 'approve_claims']
        }
      }
    }).as('loginApi');

    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        message: 'User created successfully',
        user: {
          id: 'user-124',
          email: 'newuser@example.com'
        }
      }
    }).as('registerApi');

    cy.intercept('POST', '/api/auth/logout', {
      statusCode: 200,
      body: { message: 'Logged out successfully' }
    }).as('logoutApi');

    cy.intercept('GET', '/api/auth/profile', {
      statusCode: 200,
      body: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'adjuster',
        lastLogin: '2024-01-20T10:00:00Z',
        profileComplete: true
      }
    }).as('getProfile');
  });

  describe('User Registration Flow', () => {
    it('should register a new user successfully', () => {
      cy.visit('/register');
      
      // Fill registration form
      cy.get('[data-cy=email-input]').type('newuser@example.com');
      cy.get('[data-cy=password-input]').type('SecurePass123!');
      cy.get('[data-cy=confirm-password]').type('SecurePass123!');
      cy.get('[data-cy=first-name]').type('John');
      cy.get('[data-cy=last-name]').type('Doe');
      cy.get('[data-cy=phone-number]').type('+91-9876543210');
      
      // Accept terms
      cy.get('[data-cy=terms-checkbox]').check();
      
      // Submit registration
      cy.get('[data-cy=register-button]').click();
      
      // Verify registration
      cy.wait('@registerApi');
      cy.get('[data-cy=success-message]').should('contain', 'Registration successful');
      cy.url().should('include', '/login');
    });

    it('should validate password strength', () => {
      cy.visit('/register');
      
      // Test weak password
      cy.get('[data-cy=password-input]').type('123');
      cy.get('[data-cy=password-strength]').should('contain', 'Weak');
      cy.get('[data-cy=password-requirements]').should('be.visible');
      
      // Test strong password
      cy.get('[data-cy=password-input]').clear().type('SecurePass123!');
      cy.get('[data-cy=password-strength]').should('contain', 'Strong');
    });

    it('should handle registration validation errors', () => {
      cy.visit('/register');
      
      // Submit empty form
      cy.get('[data-cy=register-button]').click();
      
      // Check validation messages
      cy.get('[data-cy=email-error]').should('contain', 'Email is required');
      cy.get('[data-cy=password-error]').should('contain', 'Password is required');
      cy.get('[data-cy=first-name-error]').should('contain', 'First name is required');
    });
  });

  describe('User Login Flow', () => {
    it('should login with valid credentials', () => {
      cy.visit('/login');
      
      // Enter credentials
      cy.get('[data-cy=email-input]').type('test@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      
      // Submit login
      cy.get('[data-cy=login-button]').click();
      
      // Verify login
      cy.wait('@loginApi');
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy=user-menu]').should('contain', 'test@example.com');
    });

    it('should handle invalid credentials', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { message: 'Invalid credentials' }
      }).as('failedLogin');

      cy.visit('/login');
      
      // Enter invalid credentials
      cy.get('[data-cy=email-input]').type('wrong@example.com');
      cy.get('[data-cy=password-input]').type('wrongpassword');
      
      // Submit login
      cy.get('[data-cy=login-button]').click();
      
      // Verify error
      cy.wait('@failedLogin');
      cy.get('[data-cy=error-message]').should('contain', 'Invalid credentials');
    });

    it('should remember user preference', () => {
      cy.visit('/login');
      
      // Check remember me
      cy.get('[data-cy=remember-me]').check();
      
      // Login
      cy.get('[data-cy=email-input]').type('test@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').click();
      
      // Verify token persistence
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.not.be.null;
      });
    });
  });

  describe('Role-based Access Control', () => {
    it('should restrict access based on user role - Adjuster', () => {
      cy.loginAs('adjuster');
      cy.visit('/admin/users');
      
      // Should be redirected or show access denied
      cy.get('[data-cy=access-denied]').should('contain', 'Access denied');
    });

    it('should allow admin access to all sections', () => {
      cy.loginAs('admin');
      
      // Check admin navigation
      cy.visit('/admin/users');
      cy.get('[data-cy=admin-panel]').should('be.visible');
      cy.get('[data-cy=users-table]').should('be.visible');
      
      // Check system settings access
      cy.visit('/admin/settings');
      cy.get('[data-cy=system-settings]').should('be.visible');
    });

    it('should allow customer limited access', () => {
      cy.loginAs('customer');
      
      // Can view own claims
      cy.visit('/my-claims');
      cy.get('[data-cy=my-claims-list]').should('be.visible');
      
      // Cannot access admin features
      cy.visit('/admin/users');
      cy.get('[data-cy=access-denied]').should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('should handle session timeout', () => {
      cy.loginAs('adjuster');
      
      // Mock session expiry
      cy.intercept('GET', '/api/claims', {
        statusCode: 401,
        body: { message: 'Session expired' }
      }).as('sessionExpired');
      
      cy.visit('/dashboard/claims');
      cy.wait('@sessionExpired');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-cy=session-expired-message]').should('contain', 'Session expired');
    });

    it('should handle concurrent login sessions', () => {
      cy.loginAs('adjuster');
      
      // Simulate another login session
      cy.window().then((win) => {
        win.dispatchEvent(new Event('storage'));
      });
      
      // Should show session conflict warning
      cy.get('[data-cy=session-conflict]').should('be.visible');
    });

    it('should logout successfully', () => {
      cy.loginAs('adjuster');
      
      // Logout
      cy.get('[data-cy=user-menu]').click();
      cy.get('[data-cy=logout-button]').click();
      
      cy.wait('@logoutApi');
      
      // Verify logout
      cy.url().should('include', '/login');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('authToken')).to.be.null;
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should request password reset', () => {
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 200,
        body: { message: 'Reset email sent' }
      }).as('forgotPassword');

      cy.visit('/forgot-password');
      
      // Enter email
      cy.get('[data-cy=email-input]').type('test@example.com');
      cy.get('[data-cy=reset-button]').click();
      
      cy.wait('@forgotPassword');
      cy.get('[data-cy=success-message]').should('contain', 'Reset email sent');
    });

    it('should reset password with valid token', () => {
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: { message: 'Password reset successful' }
      }).as('resetPassword');

      cy.visit('/reset-password?token=valid-reset-token');
      
      // Enter new password
      cy.get('[data-cy=new-password]').type('NewSecurePass123!');
      cy.get('[data-cy=confirm-password]').type('NewSecurePass123!');
      cy.get('[data-cy=reset-submit]').click();
      
      cy.wait('@resetPassword');
      cy.get('[data-cy=success-message]').should('contain', 'Password reset successful');
      cy.url().should('include', '/login');
    });
  });

  describe('Profile Management', () => {
    it('should view and edit user profile', () => {
      cy.loginAs('adjuster');
      cy.visit('/profile');
      
      cy.wait('@getProfile');
      
      // Check profile data
      cy.get('[data-cy=email-field]').should('contain', 'test@example.com');
      cy.get('[data-cy=role-field]').should('contain', 'adjuster');
      
      // Edit profile
      cy.get('[data-cy=edit-profile]').click();
      cy.get('[data-cy=first-name-input]').clear().type('Updated Name');
      cy.get('[data-cy=save-profile]').click();
      
      cy.get('[data-cy=profile-updated]').should('contain', 'Profile updated');
    });

    it('should change password', () => {
      cy.intercept('POST', '/api/auth/change-password', {
        statusCode: 200,
        body: { message: 'Password changed successfully' }
      }).as('changePassword');

      cy.loginAs('adjuster');
      cy.visit('/profile/security');
      
      // Change password
      cy.get('[data-cy=current-password]').type('oldpassword');
      cy.get('[data-cy=new-password]').type('NewSecurePass123!');
      cy.get('[data-cy=confirm-new-password]').type('NewSecurePass123!');
      cy.get('[data-cy=change-password-button]').click();
      
      cy.wait('@changePassword');
      cy.get('[data-cy=password-changed]').should('contain', 'Password changed');
    });
  });

  describe('Security Features', () => {
    it('should handle brute force protection', () => {
      cy.visit('/login');
      
      // Multiple failed attempts
      for (let i = 0; i < 5; i++) {
        cy.get('[data-cy=email-input]').clear().type('test@example.com');
        cy.get('[data-cy=password-input]').clear().type('wrongpassword');
        cy.get('[data-cy=login-button]').click();
        cy.wait(1000);
      }
      
      // Should show rate limiting
      cy.get('[data-cy=rate-limit-message]').should('contain', 'Too many attempts');
    });

    it('should enforce 2FA when enabled', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          requireTwoFactor: true,
          tempToken: 'temp-token'
        }
      }).as('loginWith2FA');

      cy.visit('/login');
      cy.get('[data-cy=email-input]').type('test@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').click();
      
      cy.wait('@loginWith2FA');
      
      // Should show 2FA verification
      cy.url().should('include', '/verify-2fa');
      cy.get('[data-cy=2fa-code-input]').should('be.visible');
    });
  });
});
