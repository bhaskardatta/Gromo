/**
 * Utility functions for validation
 */

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): {
  isValid: boolean;
  formatted?: string;
  error?: string;
} {
  try {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^+\d]/g, '');
    
    // Add + if missing
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    // Basic validation - should be 10-15 digits
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return {
        isValid: false,
        error: 'Phone number must be 10-15 digits'
      };
    }
    
    return {
      isValid: true,
      formatted: cleaned
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid phone number format'
    };
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate claim number format
 */
export function validateClaimNumber(claimNumber: string): boolean {
  const claimRegex = /^CLM\d{6}$/;
  return claimRegex.test(claimNumber);
}

/**
 * Validate policy number format
 */
export function validatePolicyNumber(policyNumber: string): boolean {
  const policyRegex = /^POL\d{6}$/;
  return policyRegex.test(policyNumber);
}

/**
 * Validate vehicle number format (Indian format)
 */
export function validateVehicleNumber(vehicleNumber: string): boolean {
  const vehicleRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
  return vehicleRegex.test(vehicleNumber.replace(/\s/g, ''));
}

// Export as module
