const errorHandler = require('../js/middleware/errorHandler');

function createRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe('errorHandler middleware', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('returns provided status and message; includes stack in non-production', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('boom');
    err.status = 418; // teapot
    const res = createRes();

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).toBe(418);
    expect(res.body).toMatchObject({ ok: false, message: 'boom' });
    expect(typeof res.body.stack).toBe('string');
  });

  test('omits stack in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('hidden');
    const res = createRes();

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ ok: false, message: 'hidden' });
  });
});
