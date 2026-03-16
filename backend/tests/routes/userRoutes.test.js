const express = require('express');
const request = require('supertest');

jest.mock('../../src/controllers/userControllers', () => ({
  getFirstName: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getFirstName' })),
  getLastName: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getLastName' })),
  getFullName: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getFullName' })),
  depositMoney: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'depositMoney' })),
  withdrawMoney: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'withdrawMoney' })),
  getBalance: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getBalance' })),
  getShares: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getShares', id: req.params.portfolio_uuid })),
  getLogs: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'getLogs' })),
  changePreferredCurrency: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'changePreferredCurrency' })),
  updateUserPortfolios: jest.fn((req, res) => res.status(200).json({ ok: true, route: 'updateUserPortfolios' })),
}));
const ctrl = require('../../src/controllers/userControllers');

jest.mock('../../src/middleware/validation', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));
const validation = require('../../src/middleware/validation');

const userRoutes = require('../../src/routes/userRoutes');

describe('userRoutes (success)', () => {
  const app = express();
  app.use(express.json());
  app.use('/', userRoutes);

  beforeEach(() => jest.clearAllMocks());

  test('GET /user/fname', async () => {
    const res = await request(app).get('/user/fname').set('Authorization', 'Bearer t');
    expect(validation.authenticateToken).toHaveBeenCalled();
    expect(ctrl.getFirstName).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('GET /user/lname', async () => {
    const res = await request(app).get('/user/lname').set('Authorization', 'Bearer t');
    expect(ctrl.getLastName).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('GET /user/name', async () => {
    const res = await request(app).get('/user/name').set('Authorization', 'Bearer t');
    expect(ctrl.getFullName).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('POST /user/deposit', async () => {
    const res = await request(app).post('/user/deposit').set('Authorization', 'Bearer t').send({ amount: 10 });
    expect(ctrl.depositMoney).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('POST /user/withdraw', async () => {
    const res = await request(app).post('/user/withdraw').set('Authorization', 'Bearer t').send({ amount: 10 });
    expect(ctrl.withdrawMoney).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('GET /user/balance', async () => {
    const res = await request(app).get('/user/balance').set('Authorization', 'Bearer t');
    expect(ctrl.getBalance).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('GET /user/shares/:portfolio_uuid', async () => {
    const res = await request(app).get('/user/shares/p1').set('Authorization', 'Bearer t');
    expect(ctrl.getShares).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p1');
  });

  test('GET /user/logs', async () => {
    const res = await request(app).get('/user/logs').set('Authorization', 'Bearer t');
    expect(ctrl.getLogs).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('POST /user/currency', async () => {
    const res = await request(app).post('/user/currency').set('Authorization', 'Bearer t').send({ currency: 'gbp' });
    expect(ctrl.changePreferredCurrency).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  test('POST /user/update-portfolios', async () => {
    const res = await request(app).post('/user/update-portfolios').set('Authorization', 'Bearer t');
    expect(ctrl.updateUserPortfolios).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
