const express = require('express');
const request = require('supertest');

jest.mock('../../src/controllers/buySellControllers', () => ({
  buyStocks: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'buyStocks', tag: req.params.tag })),
  sellStocks: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'sellStocks', tag: req.params.tag })),
}));
const ctrl = require('../../src/controllers/buySellControllers');

jest.mock('../../src/middleware/validation', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));
const validation = require('../../src/middleware/validation');

const buySellRoutes = require('../../src/routes/buySellRoutes');

describe('buySellRoutes (success)', () => {
  const app = express();
  app.use(express.json());
  app.use('/', buySellRoutes);

  beforeEach(() => jest.clearAllMocks());

  test('POST /buy/:tag -> auth + controller.buyStocks', async () => {
    const res = await request(app).post('/buy/AAPL').set('Authorization', 'Bearer t').send({ priceAmount: 100, currency: 'usd' });
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.buyStocks).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.tag).toBe('AAPL');
  });

  test('POST /sell/:tag -> auth + controller.sellStocks', async () => {
    const res = await request(app).post('/sell/TSLA').set('Authorization', 'Bearer t').send({ stockAmount: 1, currency: 'usd' });
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.sellStocks).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.tag).toBe('TSLA');
  });
});
