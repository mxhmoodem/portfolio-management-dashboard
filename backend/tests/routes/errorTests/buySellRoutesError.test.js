const express = require('express');
const request = require('supertest');

jest.mock('../../../src/controllers/buySellControllers', () => ({
  buyStocks: jest.fn((req, res) => res.status(200).json({ ok: true })),
  sellStocks: jest.fn((req, res) => res.status(200).json({ ok: true })),
}));
const ctrl = require('../../../src/controllers/buySellControllers');

jest.mock('../../../src/middleware/validation', () => ({
  authenticateToken: jest.fn((req, res) => res.status(401).json({ error: 'Missing/Invalid token' })), // no next()
}));
const validation = require('../../../src/middleware/validation');

const buySellRoutes = require('../../../src/routes/buySellRoutes');

describe('buySellRoutes (fail)', () => {
  const app = express();
  app.use(express.json());
  app.use('/', buySellRoutes);

  beforeEach(() => jest.clearAllMocks());

  test('POST /buy/:tag -> 401 when auth fails; controller not called', async () => {
    const res = await request(app).post('/buy/AAPL').send({ priceAmount: 100, currency: 'usd' });
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.buyStocks).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });

  test('POST /sell/:tag -> 401 when auth fails; controller not called', async () => {
    const res = await request(app).post('/sell/TSLA').send({ stockAmount: 1, currency: 'usd' });
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.sellStocks).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
  });
});
