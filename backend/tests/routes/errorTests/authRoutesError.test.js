const express = require('express');
const request = require('supertest');

jest.mock('../../../src/controllers/authControllers', () => ({
  createUser: jest.fn((req, res) => res.status(201).json({ ok: true })),
  getAllUsers: jest.fn((req, res) => res.status(200).json({ ok: true })),
  loginUser: jest.fn((req, res) => res.status(200).json({ ok: true })),
}));
const ctrl = require('../../../src/controllers/authControllers');

jest.mock('../../../src/middleware/validation', () => ({
  authenticateTokenAdmin: jest.fn((req, res) => res.status(401).json({ error: 'Missing/Invalid token' })), // no next()
}));
const validation = require('../../../src/middleware/validation');

const authRoutes = require('../../../src/routes/authRoutes');

describe('authRoutes (fail)', () => {
  const app = express();
  app.use('/', authRoutes);

  beforeEach(() => jest.clearAllMocks());

  test('GET /auth/users -> 401 when admin auth fails; controller not called', async () => {
    const res = await request(app).get('/auth/users');
    expect(validation.authenticateTokenAdmin).toHaveBeenCalled();
    expect(ctrl.getAllUsers).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });
});
