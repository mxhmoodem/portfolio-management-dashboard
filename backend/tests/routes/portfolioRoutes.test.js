const express = require('express');
const request = require('supertest');

jest.mock('../../src/controllers/portfolioControllers', () => ({
  getUsersPortfolio: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getUsersPortfolio' })),
  createPortfolio: jest.fn((req, res) => res.status(201).json({ ok: true, route: 'createPortfolio' })),
  modifyPortfolio: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'modifyPortfolio' })),
  deletePortfolio: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'deletePortfolio' })),
  getPortfolioValue: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getPortfolioValue', id: req.params.portfolio_uuid })),
  getPortfolioReturn: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getPortfolioReturn', id: req.params.portfolio_uuid })),
  getPortfolioReturnPercentage: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getPortfolioReturnPercentage', id: req.params.portfolio_uuid })),
}));
const ctrl = require('../../src/controllers/portfolioControllers');

jest.mock('../../src/middleware/validation', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));
const validation = require('../../src/middleware/validation');

const portfolioRoutes = require('../../src/routes/portfolioRoutes');

describe('portfolioRoutes (success)', () => {
  const app = express();
  app.use(express.json());
  app.use('/', portfolioRoutes);

  beforeEach(() => jest.clearAllMocks());

  test('GET /user/portfolio', async () => {
    const res = await request(app).get('/user/portfolio').set('Authorization', 'Bearer t');
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.getUsersPortfolio).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('POST /user/portfolio/create', async () => {
    const res = await request(app).post('/user/portfolio/create').set('Authorization', 'Bearer t').send({ name: 'Main' });
    expect(ctrl.createPortfolio).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  test('PATCH /user/portfolio/update', async () => {
    const res = await request(app).patch('/user/portfolio/update').set('Authorization', 'Bearer t').send({ name: 'New' });
    expect(ctrl.modifyPortfolio).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('DELETE /user/portfolio/:portfolio_uuid', async () => {
    const res = await request(app).delete('/user/portfolio/p1').set('Authorization', 'Bearer t');
    expect(ctrl.deletePortfolio).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('deletePortfolio');
  });

  test('GET /user/portfolio/value/:portfolio_uuid', async () => {
    const res = await request(app).get('/user/portfolio/value/p1').set('Authorization', 'Bearer t');
    expect(ctrl.getPortfolioValue).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p1');
  });

  test('GET /user/portfolio/return/:portfolio_uuid', async () => {
    const res = await request(app).get('/user/portfolio/return/p2').set('Authorization', 'Bearer t');
    expect(ctrl.getPortfolioReturn).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p2');
  });

  test('GET /user/portfolio/return/percentage/:portfolio_uuid', async () => {
    const res = await request(app).get('/user/portfolio/return/percentage/p3').set('Authorization', 'Bearer t');
    expect(ctrl.getPortfolioReturnPercentage).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p3');
  });
});
