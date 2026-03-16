// backend/tests/authMiddleware.test.js

jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
const jwt = require('jsonwebtoken');

const { authenticateToken, authenticateTokenAdmin } = require('../../src/middleware/validation'); // placeholder path

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

beforeAll(() => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.ADMIN_USERNAME = 'admin';
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authenticateToken', () => {
  test('401 when Authorization header missing', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('401 when token missing after "Bearer"', () => {
    const req = { headers: { authorization: 'Bearer' } };
    const res = mockRes();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('401 when jwt.verify returns error (invalid token)', () => {
    const req = { headers: { authorization: 'Bearer bad.token' } };
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockImplementation((_token, _secret, cb) => cb(new Error('bad token')));

    authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('SUCCESS: sets req.user and calls next()', () => {
    const req = { headers: { authorization: 'Bearer good.token' } };
    const res = mockRes();
    const next = jest.fn();

    // Your code expects `user.id` (string/uuid) and copies it to req.user.uuid
    jwt.verify.mockImplementation((_token, _secret, cb) => cb(null, { id: 'u1', username: 'alice' }));

    authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'u1', username: 'alice', uuid: 'u1' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('authenticateTokenAdmin', () => {
  test('401 when Authorization header missing', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authenticateTokenAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('401 when token missing after "Bearer"', () => {
    const req = { headers: { authorization: 'Bearer' } };
    const res = mockRes();
    const next = jest.fn();

    authenticateTokenAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('401 when jwt.verify returns error (invalid token)', () => {
    const req = { headers: { authorization: 'Bearer bad.token' } };
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockImplementation((_token, _secret, cb) => cb(new Error('bad token')));

    authenticateTokenAdmin(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('NON-ADMIN: responds 401 "Admin Only" (current implementation ALSO calls next — likely a bug)', () => {
    const req = { headers: { authorization: 'Bearer good.token' } };
    const res = mockRes();
    const next = jest.fn();

    // Your admin handler expects: user.username and user.id[0].uuid
    jwt.verify.mockImplementation((_token, _secret, cb) =>
      cb(null, { username: 'not-admin', id: [{ uuid: 'u1' }] }),
    );

    authenticateTokenAdmin(req, res, next);

    // It sends 401...
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin Only' });

    // ...but due to missing "return" it STILL continues to set uuid and call next()
    expect(req.user).toEqual({ username: 'not-admin', id: [{ uuid: 'u1' }], uuid: 'u1' });
    expect(next).toHaveBeenCalled(); // <-- exposes the likely bug
  });

  test('ADMIN SUCCESS: sets req.user.uuid from id[0].uuid and calls next()', () => {
    const req = { headers: { authorization: 'Bearer good.token' } };
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockImplementation((_token, _secret, cb) =>
      cb(null, { username: 'admin', id: [{ uuid: 'admin-uuid' }] }),
    );

    authenticateTokenAdmin(req, res, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(req.user).toEqual({ username: 'admin', id: [{ uuid: 'admin-uuid' }], uuid: 'admin-uuid' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
