import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'tests/e2e/support/index.ts',
    specPattern: 'tests/e2e/specs/**/*.cy.ts',
    fixturesFolder: 'tests/e2e/fixtures',
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',
    downloadsFolder: 'tests/e2e/downloads',
    viewportWidth: 1280,
    viewportHeight: 720,
    env: {
      apiUrl: '/api/v1',
      authUrl: '/api/v1/auth',
      mockAuth: true
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config;
    },
  },
});
