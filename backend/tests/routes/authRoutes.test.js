const express = require('express');
const request = require('supertest');

jest.mock('../../src/controllers/authControllers', () => ({
  createUser: jest.fn((req, res) => res.status(201).json({ ok: true, route: 'createUser' })),
  getAllUsers: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getAllUsers' })),
  loginUser: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'loginUser' })),
}));
const ctrl = require('../../src/controllers/authControllers');

jest.mock('../../src/middleware/validation', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
  authenticateTokenAdmin: jest.fn((req, res, next) => next()),
}));
const validation = require('../../src/middleware/validation');

const authRoutes = require('../../src/routes/authRoutes');

describe('authRoutes (success)', () => {
  const app = express();
  app.use(express.json());
  app.use('/', authRoutes);

  beforeEach(() => jest.clearAllMocks());

  test('POST /auth/register -> controller.createUser', async () => {
    const res = await request(app).post('/auth/register').send({ username: 'u', password: 'p' });
    expect(ctrl.createUser).toHaveBeenCalled();
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, route: 'createUser' });
  });

  test('GET /auth/users (admin) -> middleware + controller.getAllUsers', async () => {
    const res = await request(app).get('/auth/users').set('Authorization', 'Bearer token');
    expect(validation.authenticateTokenAdmin).toHaveBeenCalled();
    expect(ctrl.getAllUsers).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, route: 'getAllUsers' });
  });

  test('POST /auth/login -> controller.loginUser', async () => {
    const res = await request(app).post('/auth/login').send({ username: 'u', password: 'p' });
    expect(ctrl.loginUser).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, route: 'loginUser' });
  });
});
