const express = require('express');
const request = require('supertest');

jest.mock('../../../src/controllers/portfolioControllers', () => ({
  getUsersPortfolio: jest.fn((req, res) => res.status(200).json({ ok: true })),
  createPortfolio: jest.fn((req, res) => res.status(201).json({ ok: true })),
  modifyPortfolio: jest.fn((req, res) => res.status(200).json({ ok: true })),
  deletePortfolio: jest.fn((req, res) => res.status(200).json({ ok: true })),
  getPortfolioValue: jest.fn((req, res) => res.status(200).json({ ok: true })),
  getPortfolioReturn: jest.fn((req, res) => res.status(200).json({ ok: true })),
  getPortfolioReturnPercentage: jest.fn((req, res) => res.status(200).json({ ok: true })),
}));
const ctrl = require('../../../src/controllers/portfolioControllers');

jest.mock('../../../src/middleware/validation', () => ({
  authenticateToken: jest.fn((req, res) => res.status(401).json({ error: 'Missing/Invalid token' })), // no next()
}));
const validation = require('../../../src/middleware/validation');

const routes = require('../../../src/routes/portfolioRoutes');

describe('portfolioRoutes (fail)', () => {
  const app = express();
  app.use(express.json());
  app.use('/', routes);

  beforeEach(() => jest.clearAllMocks());

  const protectedGETs = [
    '/user/portfolio',
    '/user/portfolio/value/p1',
    '/user/portfolio/return/p1',
    '/user/portfolio/return/percentage/p1',
  ];
  test.each(protectedGETs)('%s -> 401 when auth fails; controller not called', async (path) => {
    const res = await request(app).get(path);
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.getUsersPortfolio).not.toHaveBeenCalled(); // generic check; specific handler also not called
    expect(res.status).toBe(401);
  });

  test('POST /user/portfolio/create -> 401 when auth fails', async () => {
    const res = await request(app).post('/user/portfolio/create').send({ name: 'Main' });
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.createPortfolio).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  test('PATCH /user/portfolio/update -> 401 when auth fails', async () => {
    const res = await request(app).patch('/user/portfolio/update').send({ name: 'New' });
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.modifyPortfolio).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  test('DELETE /user/portfolio/:id -> 401 when auth fails', async () => {
    const res = await request(app).delete('/user/portfolio/p1');
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.deletePortfolio).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });
});
