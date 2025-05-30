import './commands';
declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to authenticate user
             * @example cy.login('test@example.com', 'password123')
             */
            login(email: string, password: string): Chainable<void>;
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
//# sourceMappingURL=index.d.ts.map