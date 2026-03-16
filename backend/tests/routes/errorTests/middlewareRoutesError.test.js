const express = require('express');
const request = require('supertest');

jest.mock('../../../src/controllers/middlewareControllers', () => ({
  convertCurrency: jest.fn((_req, _res, _next) => { throw new Error('boom'); }),
  cleanDB: jest.fn((req, res) => res.status(200).json({ ok: true })), // success if auth passes
  updateAll: jest.fn((_req, _res, _next) => { throw new Error('boom'); }),
}));
const ctrl = require('../../../src/controllers/middlewareControllers');

jest.mock('../../../src/middleware/validation', () => ({
  authenticateTokenAdmin: jest.fn((req, res) => res.status(401).json({ error: 'Admin Only' })), // no next()
}));
const validation = require('../../../src/middleware/validation');

const routes = require('../../../src/routes/middlewareRoutes');

describe('middlewareRoutes (fail)', () => {
  const app = express();
  app.use(express.json());
  app.use('/', routes);
  app.use((err, req, res, _next) => res.status(500).json({ error: err.message }));

  beforeEach(() => jest.clearAllMocks());

  test('POST /convert -> 500 when controller throws', async () => {
    const res = await request(app).post('/convert').send({ amount: 1, fromCurrency: 'usd', toCurrency: 'gbp' });
    expect(ctrl.convertCurrency).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });

  test('GET /clean -> 401 when admin auth fails; controller not called', async () => {
    const res = await request(app).get('/clean');
    expect(validation.authenticateTokenAdmin).toHaveBeenCalled();
    expect(ctrl.cleanDB).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Admin Only' });
  });

  test('GET /sync -> 500 when controller throws', async () => {
    const res = await request(app).get('/sync');
    expect(ctrl.updateAll).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });
});
