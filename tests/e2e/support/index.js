"use strict";
// Cypress support commands and global configuration
Object.defineProperty(exports, "__esModule", { value: true });
// Import commands
require("./commands");
// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
    // Prevent Cypress from failing the test on uncaught exceptions
    // that are not related to our application logic
    return false;
});
//# sourceMappingURL=index.js.map