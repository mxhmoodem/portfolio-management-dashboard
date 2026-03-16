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

jest.mock('../../../src/models/portfolioModels', () => ({
  getPortfolio: jest.fn(),
  createPortfolio: jest.fn(),
  updatePortfolio: jest.fn(),
  deletePortfolio: jest.fn(),
  checkIfPortfolioEmpty: jest.fn(),
  getUserPreferedCurrency: jest.fn(),
  getPortfolioValue: jest.fn(),
  getPortfolioReturn: jest.fn(),
  getPortfolioReturnPercentage: jest.fn(),
}));
const portfolioModels = require('../../../src/models/portfolioModels');

describe('portfolioControllers (500 paths)', () => {
  const ctrl = require('../../../src/controllers/portfolioControllers');

  test('getUsersPortfolio -> 500 on model error', async () => {
    const res = mkRes();
    portfolioModels.getPortfolio.mockRejectedValue(new Error('boom'));
    await ctrl.getUsersPortfolio({ user: { uuid: 'u' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('createPortfolio -> 500 on model error', async () => {
    const res = mkRes();
    portfolioModels.getUserPreferedCurrency.mockReturnValue(['usd']);
    portfolioModels.createPortfolio.mockRejectedValue(new Error('boom'));
    await ctrl.createPortfolio({ user: { uuid: 'u' }, body: { name: 'Main', isDefault: true } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('modifyPortfolio -> 500 on model error', async () => {
    const res = mkRes();
    portfolioModels.updatePortfolio.mockRejectedValue(new Error('boom'));
    await ctrl.modifyPortfolio({ user: { uuid: 'u' }, body: { name: 'X', isDefault: true, portfolio_uuid: 'p' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('deletePortfolio -> 500 when delete fails after empty check', async () => {
    const res = mkRes();
    portfolioModels.checkIfPortfolioEmpty.mockResolvedValue(true);
    portfolioModels.deletePortfolio.mockRejectedValue(new Error('boom'));
    await ctrl.deletePortfolio({ user: { uuid: 'u' }, params: { portfolio_uuid: 'p' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('deletePortfolio -> 500 when empty check throws', async () => {
    const res = mkRes();
    portfolioModels.checkIfPortfolioEmpty.mockRejectedValue(new Error('boom'));
    await ctrl.deletePortfolio({ user: { uuid: 'u' }, params: { portfolio_uuid: 'p' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('getPortfolioValue -> 500 on model error', async () => {
    const res = mkRes();
    portfolioModels.getPortfolioValue.mockRejectedValue(new Error('boom'));
    await ctrl.getPortfolioValue({ user: { uuid: 'u' }, params: { portfolio_uuid: 'p' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('getPortfolioReturn -> 500 on model error', async () => {
    const res = mkRes();
    portfolioModels.getPortfolioReturn.mockRejectedValue(new Error('boom'));
    await ctrl.getPortfolioReturn({ user: { uuid: 'u' }, params: { portfolio_uuid: 'p' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('getPortfolioReturnPercentage -> 500 on model error', async () => {
    const res = mkRes();
    portfolioModels.getPortfolioReturnPercentage.mockRejectedValue(new Error('boom'));
    await ctrl.getPortfolioReturnPercentage({ user: { uuid: 'u' }, params: { portfolio_uuid: 'p' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});