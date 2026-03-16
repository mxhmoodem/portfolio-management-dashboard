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

jest.mock('../../../src/models/userModels', () => ({
  getFirstName: jest.fn(),
  getLastName: jest.fn(),
  getFullName: jest.fn(),
  gainMoney: jest.fn(),
  spendMoney: jest.fn(),
  getBalance: jest.fn(),
  getAllShares: jest.fn(),
  getAllLogs: jest.fn(),
}));
const userModels = require('../../../src/models/userModels');

jest.mock('../../../src/models/middlewareModels', () => ({ updateOwnersPortfolios: jest.fn(), updatePreferredCurrency: jest.fn() }));
const midModels = require('../../../src/models/middlewareModels');

describe('userControllers (500 paths)', () => {
  const ctrl = require('../../../src/controllers/userControllers');

  test('getFirstName -> 500 on model error', async () => {
    const res = mkRes();
    userModels.getFirstName.mockRejectedValue(new Error('boom'));
    await ctrl.getFirstName({ user: { uuid: 'u' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
  test('getLastName -> 500', async () => {
    const res = mkRes();
    userModels.getLastName.mockRejectedValue(new Error('boom'));
    await ctrl.getLastName({ user: { uuid: 'u' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
  test('getFullName -> 500', async () => {
    const res = mkRes();
    userModels.getFullName.mockRejectedValue(new Error('boom'));
    await ctrl.getFullName({ user: { uuid: 'u' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
  test('depositMoney -> 500', async () => {
    const res = mkRes();
    userModels.gainMoney.mockRejectedValue(new Error('boom'));
    await ctrl.depositMoney({ user: { uuid: 'u' }, body: { amount: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
  test('withdrawMoney -> 500', async () => {
    const res = mkRes();
    userModels.spendMoney.mockRejectedValue(new Error('boom'));
    await ctrl.withdrawMoney({ user: { uuid: 'u' }, body: { amount: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
  test('getBalance -> 500', async () => {
    const res = mkRes();
    userModels.getBalance.mockRejectedValue(new Error('boom'));
    await ctrl.getBalance({ user: { uuid: 'u' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
  test('getShares -> 500 when fetching shares fails', async () => {
    const res = mkRes();
    midModels.updateOwnersPortfolios.mockResolvedValue('ok');
    userModels.getAllShares.mockRejectedValue(new Error('boom'));
    await ctrl.getShares({ user: { uuid: 'u' }, params: { portfolio_uuid: 'p' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
  test('getLogs -> 500', async () => {
    const res = mkRes();
    userModels.getAllLogs.mockRejectedValue(new Error('boom'));
    await ctrl.getLogs({ user: { uuid: 'u' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
  test('changePreferredCurrency -> 500', async () => {
    const res = mkRes();
    midModels.updatePreferredCurrency.mockRejectedValue(new Error('boom'));
    await ctrl.changePreferredCurrency({ user: { uuid: 'u' }, body: { currency: 'gbp' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});