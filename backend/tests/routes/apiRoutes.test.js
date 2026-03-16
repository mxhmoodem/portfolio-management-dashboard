const express = require('express');
const request = require('supertest');

jest.mock('../../src/controllers/apiControllers', () => ({
  getCurrentPrice: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getCurrentPrice', tag: req.params.tag })),
  searchForCompany: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'searchForCompany', q: req.params.query })),
  searchNews: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'searchNews', q: req.params.query })),
  searchFincancials: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'searchFincancials', q: req.params.query })),
}));
const ctrl = require('../../src/controllers/apiControllers');

const apiRoutes = require('../../src/routes/apiRoutes');

describe('apiRoutes (success)', () => {
  const app = express();
  app.use('/', apiRoutes);

  beforeEach(() => jest.clearAllMocks());

  test('GET /price/:tag -> controller.getCurrentPrice', async () => {
    const res = await request(app).get('/price/AAPL');
    expect(ctrl.getCurrentPrice).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.tag).toBe('AAPL');
  });

  test('GET /search/:query -> controller.searchForCompany', async () => {
    const res = await request(app).get('/search/apple');
    expect(ctrl.searchForCompany).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.q).toBe('apple');
  });

  test('GET /search/news/:query -> controller.searchNews', async () => {
    const res = await request(app).get('/search/news/ai');
    expect(ctrl.searchNews).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.q).toBe('ai');
  });

  test('GET /search/financial/:query -> controller.searchFincancials', async () => {
    const res = await request(app).get('/search/financial/tech');
    expect(ctrl.searchFincancials).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.q).toBe('tech');
  });
});
