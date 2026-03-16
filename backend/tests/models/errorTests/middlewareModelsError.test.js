// middlewareModels — ERROR paths (returns undefined on failures)

const silenceConsole = () => {
  let log, warn, error;
  beforeAll(() => {
    log   = jest.spyOn(console, 'log').mockImplementation(() => {});
    warn  = jest.spyOn(console, 'warn').mockImplementation(() => {});
    error = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => { log.mockRestore(); warn.mockRestore(); error.mockRestore(); });
};

describe('middlewareModels (error)', () => {
  silenceConsole();

  jest.isolateModules(() => {
    jest.resetModules();

    jest.doMock('../../../src/config/sql', () => ({
      Users:     { destroy: jest.fn(), findAll: jest.fn(), update: jest.fn() },
      Portfolio: { destroy: jest.fn(), findAll: jest.fn(), update: jest.fn() },
      Shares:    { destroy: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn() },
      TransactionLog: { destroy: jest.fn() },
    }));
    const sql = require('../../../src/config/sql');

    jest.doMock('axios', () => ({ get: jest.fn() }));
    const axios = require('axios');

    const YF = { quote: jest.fn() };
    jest.doMock('yahoo-finance2', () => ({ default: YF }));

    jest.doMock('../../../src/models/userModels', () => ({
      getUserPreferedCurrencyUUID: jest.fn(),
    }));
    const userModels = require('../../../src/models/userModels');

    const mod = require('../../../src/models/middlewareModels');

    beforeEach(() => jest.clearAllMocks());

    // convertCurrency
    test('convertCurrency -> axios failure returns undefined', async () => {
      axios.get.mockRejectedValue(new Error('http fail'));
      await expect(mod.convertCurrency(100, 'usd', 'gbp')).resolves.toBeUndefined();
    });

    test('convertCurrency -> input amount is NaN', async () => {
      await expect(mod.convertCurrency('u', 'usd', 'gbp')).resolves.toBeUndefined();
    });

    test('convertCurrency -> rate amount is NaN', async () => {
      axios.get.mockResolvedValue({ data: { usd: { gbp: 'u' } } });
      await expect(mod.convertCurrency(100, 'usd', 'gbp')).resolves.toBeUndefined();
    });

    // cleanDb
    test('cleanDb -> Users.destroy fails => early return undefined (others not called)', async () => {
      sql.Users.destroy.mockRejectedValue(new Error('boom'));
      const out = await mod.cleanDb();
      expect(sql.Users.destroy).toHaveBeenCalled();
      expect(sql.Portfolio.destroy).not.toHaveBeenCalled();
      expect(out).toBeUndefined();
    });

    // updateShareValue
    test('updateShareValue -> Shares.findOne rejects => undefined', async () => {
      sql.Shares.findOne.mockRejectedValue(new Error('db fail'));
      await expect(mod.updateShareValue(1)).resolves.toBeUndefined();
    });

    test('updateShareValue -> Yahoo.quote rejects => undefined', async () => {
      sql.Shares.findOne.mockResolvedValue({ id: 1, tag: 'AAPL', owner_uuid: 'u', total_invested: 0, amount_owned: 1 });
      YF.quote.mockRejectedValue(new Error('yahoo down'));
      await expect(mod.updateShareValue(1)).resolves.toBeUndefined();
    });

    test('updateShareValue -> userModels.getUserPreferedCurrencyUUID rejects => undefined', async () => {
      sql.Shares.findOne.mockResolvedValue({ id: 1, tag: 'AAPL', owner_uuid: 'u', total_invested: 0, amount_owned: 1 });
      YF.quote.mockResolvedValue({ ask: 11, bid: 10, currency: 'USD' });
      userModels.getUserPreferedCurrencyUUID.mockRejectedValue(new Error('user fail'));
      await expect(mod.updateShareValue(1)).resolves.toBeUndefined();
    });

    test('updateShareValue -> Shares.update rejects => undefined', async () => {
      sql.Shares.findOne.mockResolvedValue({ id: 1, tag: 'AAPL', owner_uuid: 'u', total_invested: 100, amount_owned: 2 });
      YF.quote.mockResolvedValue({ ask: 11, bid: 10, currency: 'USD' });
      userModels.getUserPreferedCurrencyUUID.mockResolvedValue('usd');
      sql.Shares.update.mockRejectedValue(new Error('update fail'));
      await expect(mod.updateShareValue(1)).resolves.toBeUndefined();
    });

    // updatePortfolioValue
    test('updatePortfolioValue -> Shares.findAll rejects => undefined', async () => {
      sql.Shares.findAll.mockRejectedValue(new Error('db fail'));
      await expect(mod.updatePortfolioValue('p1')).resolves.toBeUndefined();
    });

    test('updatePortfolioValue -> Portfolio.update rejects => undefined', async () => {
      sql.Shares.findAll.mockResolvedValue([{ id: 11, total_invested: 10 }]);
      // Make the inner updateShareValue compute deterministically:
      sql.Shares.findOne.mockResolvedValue({ id: 11, tag: 'AAPL', owner_uuid: 'u', total_invested: 10, amount_owned: 1 });
      YF.quote.mockResolvedValue({ ask: 6, bid: 5, currency: 'USD' });
      userModels.getUserPreferedCurrencyUUID.mockResolvedValue('usd');

      sql.Shares.update.mockResolvedValue([1]);
      sql.Portfolio.update.mockRejectedValue(new Error('upd fail'));

      await expect(mod.updatePortfolioValue('p1')).resolves.toBeUndefined();
    });

    // updateOwnersPortfolios
    test('updateOwnersPortfolios -> Portfolio.findAll rejects => undefined', async () => {
      sql.Portfolio.findAll.mockRejectedValue(new Error('db fail'));
      await expect(mod.updateOwnersPortfolios('owner')).resolves.toBeUndefined();
    });

    // updateAllStocks
    test('updateAllStocks -> Users.findAll rejects => undefined', async () => {
      sql.Users.findAll.mockRejectedValue(new Error('db fail'));
      await expect(mod.updateAllStocks()).resolves.toBeUndefined();
    });

    // updatePreferredCurrency (current code has undefined vars => always caught)
    test('updatePreferredCurrency -> returns undefined (invalid current/target usage)', async () => {
      await expect(mod.updatePreferredCurrency('gbp', 'u1')).resolves.toBeUndefined();
    });
  });
});
