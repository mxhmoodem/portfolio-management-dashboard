jest.mock('../../src/models/middlewareModels', () => ({
  convertCurrency: jest.fn(),
  cleanDb: jest.fn(),
  updateAllStocks: jest.fn(),
}));
const middlewareModel = require('../../src/models/middlewareModels');

const { convertCurrency, cleanDB, updateAll } = require('../../src/controllers/middlewareControllers');

describe('middlewareControllers', () => {
  beforeEach(() => jest.clearAllMocks());
  const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  test('convertCurrency -> 200 with amount', async () => {
    middlewareModel.convertCurrency.mockResolvedValue(80);
    const r = res();
    await convertCurrency({ body: { amount: 100, fromCurrency: 'usd', toCurrency: 'gbp' } }, r);
    expect(middlewareModel.convertCurrency).toHaveBeenCalledWith(100, 'usd', 'gbp');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ amount: 80 });
  });

  test('cleanDB -> 200 success', async () => {
    const r = res();
    await cleanDB({}, r);
    expect(middlewareModel.cleanDb).toHaveBeenCalled();
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ message: 'Database cleaned successfully' });
  });

  test('updateAll -> 200 with true', async () => {
    middlewareModel.updateAllStocks.mockResolvedValue(true);
    const r = res();
    await updateAll({}, r);
    expect(middlewareModel.updateAllStocks).toHaveBeenCalled();
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith(true);
  });
});