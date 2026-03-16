jest.mock('../../src/models/portfolioModels', () => ({
  getPortfolio: jest.fn(),
  createPortfolio: jest.fn(),
  updatePortfolio: jest.fn(),
  deletePortfolio: jest.fn(),
  checkIfPortfolioEmpty: jest.fn(),
  getUserPreferedCurrency: jest.fn(),
  getPortfolioValue: jest.fn(),
  getPortfolioReturn: jest.fn(),
  getPortfolioReturnPercentage: jest.fn(),
  getDefaultPortfolio: jest.fn(),
  hasAPortfolio: jest.fn(),
  findStocksPortfolio: jest.fn(),
}));
const portfolioModel = require('../../src/models/portfolioModels');

const ctrl = require('../../src/controllers/portfolioControllers');

describe('portfolioControllers', () => {
  beforeEach(() => jest.clearAllMocks());
  const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  test('getUsersPortfolio -> 200 with list', async () => {
    portfolioModel.getPortfolio.mockResolvedValue([{ uuid: 'p1' }]);
    const r = res();
    await ctrl.getUsersPortfolio({ user: { uuid: 'u1' } }, r);
    expect(portfolioModel.getPortfolio).toHaveBeenCalledWith({ uuid: 'u1' });
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith([{ uuid: 'p1' }]);
  });

  test('createPortfolio -> 201 Created', async () => {
    portfolioModel.getUserPreferedCurrency.mockReturnValue(['gbp']);
    portfolioModel.createPortfolio.mockResolvedValue({ uuid: 'p1' });
    const r = res();
    await ctrl.createPortfolio({ body: { name: 'Main', isDefault: true }, user: { uuid: 'owner' } }, r);
    expect(portfolioModel.createPortfolio).toHaveBeenCalledWith('Main', 'owner', 'gbp', true);
    expect(r.status).toHaveBeenCalledWith(201);
    expect(r.json).toHaveBeenCalledWith({ message: 'Portfolio Created' });
  });

  test('modifyPortfolio -> 200 updated', async () => {
    portfolioModel.updatePortfolio.mockResolvedValue(1);
    const r = res();
    await ctrl.modifyPortfolio({ body: { name: 'New', isDefault: true, portfolio_uuid: 'p1' }, user: { uuid: 'owner' } }, r);
    expect(portfolioModel.updatePortfolio).toHaveBeenCalledWith('New', true, 'p1', 'owner');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ message: 'Portfolio updated successfully' });
  });

  test('deletePortfolio -> 200 when empty', async () => {
    portfolioModel.checkIfPortfolioEmpty.mockResolvedValue(true);
    portfolioModel.deletePortfolio.mockResolvedValue(1);
    const r = res();
    await ctrl.deletePortfolio({ params: { portfolio_uuid: 'p1' }, user: { uuid: 'owner' } }, r);
    expect(portfolioModel.deletePortfolio).toHaveBeenCalledWith('p1', 'owner');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ message: 'Portfolio deleted successfully' });
  });

  test('deletePortfolio -> 400 when not empty', async () => {
    portfolioModel.checkIfPortfolioEmpty.mockResolvedValue(false);
    const r = res();
    await ctrl.deletePortfolio({ params: { portfolio_uuid: 'p1' }, user: { uuid: 'owner' } }, r);
    expect(portfolioModel.checkIfPortfolioEmpty).toHaveBeenCalledWith('p1', 'owner');
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith({ error: 'Portfolio is not empty' });
  });

  test('getPortfolioValue -> 200 with value', async () => {
    portfolioModel.getPortfolioValue.mockResolvedValue(123);
    const r = res();
    await ctrl.getPortfolioValue({ params: { portfolio_uuid: 'p1' }, user: { uuid: 'owner' } }, r);
    expect(portfolioModel.getPortfolioValue).toHaveBeenCalledWith('p1', 'owner');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ value: 123 });
  });

  test('getPortfolioReturn -> 200 with value', async () => {
    portfolioModel.getPortfolioReturn.mockResolvedValue(50);
    const r = res();
    await ctrl.getPortfolioReturn({ params: { portfolio_uuid: 'p1' }, user: { uuid: 'owner' } }, r);
    expect(portfolioModel.getPortfolioReturn).toHaveBeenCalledWith('p1', 'owner');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ value: 50 });
  });

  test('getPortfolioReturnPercentage -> 200 with value', async () => {
    portfolioModel.getPortfolioReturnPercentage.mockResolvedValue(1.5);
    const r = res();
    await ctrl.getPortfolioReturnPercentage({ params: { portfolio_uuid: 'p1' }, user: { uuid: 'owner' } }, r);
    expect(portfolioModel.getPortfolioReturnPercentage).toHaveBeenCalledWith('p1', 'owner');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ value: 1.5 });
  });
});