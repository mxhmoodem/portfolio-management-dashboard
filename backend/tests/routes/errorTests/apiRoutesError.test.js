const express = require('express');
const request = require('supertest');

jest.mock('../../../src/controllers/apiControllers', () => ({
  getCurrentPrice: jest.fn((_req, _res, next) => { throw new Error('boom'); }),
  searchForCompany: jest.fn((_req, _res, next) => { throw new Error('boom'); }),
  searchNews: jest.fn((_req, _res, next) => { throw new Error('boom'); }),
  searchFincancials: jest.fn((_req, _res, next) => { throw new Error('boom'); }),
}));
const ctrl = require('../../../src/controllers/apiControllers');

const apiRoutes = require('../../../src/routes/apiRoutes');

describe('apiRoutes (fail)', () => {
  const app = express();
  app.use('/', apiRoutes);
  // simple error handler to force JSON output
  app.use((err, req, res, _next) => res.status(500).json({ error: err.message }));

  beforeEach(() => jest.clearAllMocks());

  test('GET /price/:tag -> 500 when controller throws', async () => {
    const res = await request(app).get('/price/AAPL');
    expect(ctrl.getCurrentPrice).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });

  test('GET /search/:query -> 500 when controller throws', async () => {
    const res = await request(app).get('/search/apple');
    expect(ctrl.searchForCompany).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });

  test('GET /search/news/:query -> 500 when controller throws', async () => {
    const res = await request(app).get('/search/news/ai');
    expect(ctrl.searchNews).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });

  test('GET /search/financial/:query -> 500 when controller throws', async () => {
    const res = await request(app).get('/search/financial/tech');
    expect(ctrl.searchFincancials).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });
});
