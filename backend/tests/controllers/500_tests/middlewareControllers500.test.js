const mkRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

let clog, cerr;
beforeEach(() => {
  clog = jest.spyOn(console, 'log').mockImplementation(() => {});
  cerr = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  clog.mockRestore();
  cerr.mockRestore();
});

beforeAll(() => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.ADMIN_USERNAME = 'admin';
});

beforeEach(() => jest.clearAllMocks());

jest.mock('../../../src/models/middlewareModels', () => ({
  convertCurrency: jest.fn(),
  cleanDb: jest.fn(),
  updateAllStocks: jest.fn(),
}));
const middlewareModels = require('../../../src/models/middlewareModels');

describe('middlewareControllers (500 paths)', () => {
  const { convertCurrency: cc, cleanDB, updateAll } = require('../../../src/controllers/middlewareControllers');

  test('convertCurrency -> 500 on model error', async () => {
    const res = mkRes();
    middlewareModels.convertCurrency.mockRejectedValue(new Error('boom'));
    await cc({ body: { amount: 1, fromCurrency: 'gbp', toCurrency: 'usd' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('cleanDB -> 500 on model error', async () => {
    const res = mkRes();
    middlewareModels.cleanDb.mockRejectedValue(new Error('boom'));
    await cleanDB({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('updateAll -> 500 on model error', async () => {
    const res = mkRes();
    middlewareModels.updateAllStocks.mockRejectedValue(new Error('boom'));
    await updateAll({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});