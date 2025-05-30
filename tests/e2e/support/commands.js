"use strict";
// Custom Cypress commands
Cypress.Commands.add('login', (email, password) => {
    cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: {
            email,
            password
        }
    }).then((response) => {
        expect(response.status).to.eq(200);
        const token = response.body.token;
        // Store token in localStorage
        window.localStorage.setItem('authToken', token);
        // Set default authorization header
        cy.window().then((win) => {
            win.localStorage.setItem('authToken', token);
        });
    });
});
Cypress.Commands.add('uploadFile', (selector, fileName) => {
    cy.fixture(fileName, 'base64').then((fileContent) => {
        cy.get(selector).then((input) => {
            const blob = Cypress.Blob.base64StringToBlob(fileContent);
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            const inputEl = input[0];
            inputEl.files = dataTransfer.files;
            cy.wrap(input).trigger('change', { force: true });
        });
    });
});
Cypress.Commands.add('waitForApi', (alias) => {
    cy.wait(alias).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
    });
});
//# sourceMappingURL=commands.js.map