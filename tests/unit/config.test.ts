/// <reference types="jest" />
import { config } from '../../src/config/config';

describe('Config Service', () => {
  it('should load configuration successfully', () => {
    expect(config).toBeDefined();
    expect(config.getServer()).toBeDefined();
    expect(config.getSecurity()).toBeDefined();
    expect(config.getTwilio()).toBeDefined();
  });

  it('should have required security configuration', () => {
    const security = config.getSecurity();
    expect(security.jwtSecret).toBeDefined();
    expect(security.bcryptRounds).toBeGreaterThan(0);
  });

  it('should have server configuration', () => {
    const server = config.getServer();
    expect(server.port).toBeGreaterThan(0);
    expect(server.nodeEnv).toBeDefined();
  });
});
