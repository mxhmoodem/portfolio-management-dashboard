const express = require('express');
const request = require('supertest');

jest.mock('../../src/controllers/middlewareControllers', () => ({
  convertCurrency: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'convertCurrency' })),
  cleanDB: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'cleanDB' })),
  updateAll: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'updateAll' })),
}));
const ctrl = require('../../src/controllers/middlewareControllers');

jest.mock('../../src/middleware/validation', () => ({
  authenticateTokenAdmin: jest.fn((req, res, next) => next()),
}));
const validation = require('../../src/middleware/validation');

const middlewareRoutes = require('../../src/routes/middlewareRoutes');

describe('middlewareRoutes (success)', () => {
  const app = express();
  app.use(express.json());
  app.use('/', middlewareRoutes);

  beforeEach(() => jest.clearAllMocks());

  test('POST /convert -> controller.convertCurrency', async () => {
    const res = await request(app).post('/convert').send({ amount: 5, fromCurrency: 'usd', toCurrency: 'gbp' });
    expect(ctrl.convertCurrency).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('GET /clean -> admin auth + controller.cleanDB', async () => {
    const res = await request(app).get('/clean').set('Authorization', 'Bearer admin');
    expect(validation.authenticateTokenAdmin).toHaveBeenCalled();
    expect(ctrl.cleanDB).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('GET /sync -> controller.updateAll', async () => {
    const res = await request(app).get('/sync');
    expect(ctrl.updateAll).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
