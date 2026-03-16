const express = require('express');
const request = require('supertest');

jest.mock('../../../src/controllers/userControllers', () => ({
  getFirstName: jest.fn((req, res) => res.status(200).json({ ok: true })),
  getLastName: jest.fn((req, res) => res.status(200).json({ ok: true })),
  getFullName: jest.fn((req, res) => res.status(200).json({ ok: true })),
  depositMoney: jest.fn((req, res) => res.status(200).json({ ok: true })),
  withdrawMoney: jest.fn((req, res) => res.status(200).json({ ok: true })),
  getBalance: jest.fn((req, res) => res.status(200).json({ ok: true })),
  getShares: jest.fn((req, res) => res.status(200).json({ ok: true })),
  getLogs: jest.fn((req, res) => res.status(200).json({ ok: true })),
  changePreferredCurrency: jest.fn((req, res) => res.status(200).json({ ok: true })),
  updateUserPortfolios: jest.fn((req, res) => res.status(200).json({ ok: true })),
}));
const ctrl = require('../../../src/controllers/userControllers');

jest.mock('../../../src/middleware/validation', () => ({
  authenticateToken: jest.fn((req, res) => res.status(401).json({ error: 'Missing/Invalid token' })), // no next()
}));
const validation = require('../../../src/middleware/validation');

const routes = require('../../../src/routes/userRoutes');

describe('userRoutes (fail)', () => {
  const app = express();
  app.use(express.json());
  app.use('/', routes);

  beforeEach(() => jest.clearAllMocks());

  const protectedGETs = [
    '/user/fname',
    '/user/lname',
    '/user/name',
    '/user/balance',
    '/user/logs',
    '/user/shares/p1',
  ];
  test.each(protectedGETs)('%s -> 401 when auth fails; controller not called', async (path) => {
    const res = await request(app).get(path);
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.getFirstName).not.toHaveBeenCalled(); // generic guard (specific handlers also not called)
    expect(res.status).toBe(401);
  });

  const protectedPOSTs = [
    ['/user/deposit', { amount: 10 }],
    ['/user/withdraw', { amount: 10 }],
    ['/user/currency', { currency: 'gbp' }],
  ];
  test.each(protectedPOSTs)('%s -> 401 when auth fails; controller not called', async (path, body) => {
    const res = await request(app).post(path).send(body);
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.depositMoney).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });
});
