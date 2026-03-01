describe('Hardening DEMO_MODE', () => {
  const originalDemoMode = process.env.DEMO_MODE;

  afterEach(() => {
    process.env.DEMO_MODE = originalDemoMode;
  });

  test('no permite cargar authMiddleware_demo si DEMO_MODE=false', () => {
    process.env.DEMO_MODE = 'false';
    jest.resetModules();

    expect(() => {
      // eslint-disable-next-line global-require
      require('../middleware/authMiddleware_demo');
    }).toThrow(/DEMO_MODE=false/i);
  });

  test('no permite cargar userController_demo si DEMO_MODE=false', () => {
    process.env.DEMO_MODE = 'false';
    jest.resetModules();

    expect(() => {
      // eslint-disable-next-line global-require
      require('../controllers/userController_demo');
    }).toThrow(/DEMO_MODE=false/i);
  });
});
