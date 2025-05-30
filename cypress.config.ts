{
  "baseUrl": "http://localhost:3000",
  "supportFile": "tests/e2e/support/index.ts",
  "specPattern": "tests/e2e/specs/**/*.cy.ts",
  "videosFolder": "tests/e2e/videos",
  "screenshotsFolder": "tests/e2e/screenshots",
  "fixturesFolder": "tests/e2e/fixtures",
  "viewportWidth": 1280,
  "viewportHeight": 720,
  "env": {
    "apiUrl": "http://localhost:3000/api",
    "testUser": {
      "email": "test@example.com",
      "password": "testpassword123"
    },
    "adminUser": {
      "email": "admin@example.com", 
      "password": "adminpassword123"
    }
  },
  "e2e": {
    "setupNodeEvents": "tests/e2e/plugins/index.ts"
  },
  "component": {
    "devServer": {
      "framework": "react",
      "bundler": "webpack"
    }
  }
}
