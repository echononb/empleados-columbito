import { logger, logError, logAuthEvent, logPerformance } from '../logger';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logger.clearLogs();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
  });

  describe('Basic logging functionality', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Test debug message');
    });

    it('should log info messages', () => {
      logger.info('Test info message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Test info message');
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
      expect(logs[0].message).toBe('Test warning message');
    });

    it('should log error messages', () => {
      logger.error('Test error message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toBe('Test error message');
    });

    it('should include additional data in logs', () => {
      const testData = { userId: '123', action: 'test' };
      logger.info('Test with data', testData);

      const logs = logger.getLogs();
      expect(logs[0].data).toEqual(testData);
    });

    it('should include timestamp in logs', () => {
      logger.info('Test timestamp');

      const logs = logger.getLogs();
      expect(logs[0].timestamp).toBeDefined();
      expect(typeof logs[0].timestamp).toBe('string');
    });
  });

  describe('Log management', () => {
    it('should limit logs to maximum amount', () => {
      // Create more logs than the limit (1000)
      for (let i = 0; i < 1005; i++) {
        logger.info(`Test message ${i}`);
      }

      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });

    it('should clear logs', () => {
      logger.info('Test message');
      expect(logger.getLogs()).toHaveLength(1);

      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('Error statistics', () => {
    it('should provide error statistics', () => {
      logger.error('Error 1');
      logger.error('Error 2');
      logger.info('Info message');

      const stats = logger.getErrorStats();
      expect(stats.totalErrors).toBe(2);
      expect(stats.recentErrors).toHaveLength(2);
    });

    it('should limit recent errors to 10', () => {
      for (let i = 0; i < 15; i++) {
        logger.error(`Error ${i}`);
      }

      const stats = logger.getErrorStats();
      expect(stats.recentErrors.length).toBe(10);
    });
  });

  describe('Convenience functions', () => {
    it('should log errors with logError function', () => {
      const error = new Error('Test error');
      logError(error, 'test context');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toContain('Error in test context');
    });

    it('should log auth events', () => {
      logAuthEvent('User login', { userId: '123' });

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Auth event: User login');
    });

    it('should log performance metrics', () => {
      logPerformance('database query', 150);

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toContain('took 150ms');
    });
  });

  describe('Session and user tracking', () => {
    it('should generate session ID', () => {
      logger.info('Test message');

      const logs = logger.getLogs();
      expect(logs[0].sessionId).toBeDefined();
      expect(typeof logs[0].sessionId).toBe('string');
    });

    it('should reuse session ID within same session', () => {
      logger.info('First message');
      const firstSessionId = logger.getLogs()[0].sessionId;

      logger.info('Second message');
      const secondSessionId = logger.getLogs()[1].sessionId;

      expect(firstSessionId).toBe(secondSessionId);
    });
  });
});