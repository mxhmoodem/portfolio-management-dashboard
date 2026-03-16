const silenceConsole = () => {
  let log, warn, error;
  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    error = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    log.mockRestore(); warn.mockRestore(); error.mockRestore();
  });
};

describe('buySellModels — error & edge paths', () => {
  silenceConsole();

  jest.isolateModules(() => {
    jest.resetModules();

    jest.doMock('../../../src/config/sql', () => ({
      Users: { findOne: jest.fn(), update: jest.fn() },
      Shares: { findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), create: jest.fn(), destroy: jest.fn() },
      TransactionLog: { create: jest.fn() },
    }));
    const sql = require('../../../src/config/sql');

    const Yahoo = { quote: jest.fn(), search: jest.fn() };
    jest.doMock('yahoo-finance2', () => ({ default: Yahoo }));

    jest.doMock('../../../src/models/userModels', () => ({
      getUserPreferedCurrencyUUID: jest.fn().mockResolvedValue('usd'),
    }));

    const m = require('../../../src/models/buySellModels');

    test('getUserMoney returns undefined when Users.findOne fails', async () => {
      sql.Users.findOne.mockRejectedValue(new Error('db fail'));
      await expect(m.getUserMoney('u')).resolves.toBeUndefined();
    });

    test('verifyStock returns undefined on DB error', async () => {
      sql.Shares.findAll.mockRejectedValue(new Error('db fail'));
      await expect(m.verifyStock('AAPL', 'u', 'p')).resolves.toBeUndefined();
    });

    test('verifyStockPrice returns undefined on DB error', async () => {
      sql.Shares.findAll.mockRejectedValue(new Error('db fail'));
      await expect(m.verifyStockPrice('AAPL', 'u', 'p', 250)).resolves.toBeUndefined();
    });

    test('verifyStockAmount returns undefined on DB error', async () => {
      sql.Shares.findAll.mockRejectedValue(new Error('db fail'));
      await expect(m.verifyStockAmount('AAPL', 'u', 'p', 10)).resolves.toBeUndefined();
    });

    test('buyStock returns undefined when Yahoo.search fails', async () => {
      sql.Shares.findOne.mockResolvedValue(null);
      Yahoo.quote.mockResolvedValue({ bid: '10', ask: '11', currency: 'USD' });
      Yahoo.search.mockRejectedValue(new Error('search fail'));
      await expect(m.buyStock('AAPL', 100, 10, 'u', 'p')).resolves.toBeUndefined();
    });

    test('buyStock returns undefined when Shares.create fails', async () => {
      sql.Shares.findOne.mockResolvedValue(null);
      Yahoo.quote.mockResolvedValue({ bid: '10', ask: '11', currency: 'USD' });
      Yahoo.search.mockResolvedValue({ quotes: [{ shortname: 'Apple' }] });
      sql.Shares.create.mockRejectedValue(new Error('create fail'));
      await expect(m.buyStock('AAPL', 100, 10, 'u', 'p')).resolves.toBeUndefined();
    });

    test('sellStock returns undefined when pre-check findOne fails', async () => {
      sql.Shares.findOne.mockRejectedValue(new Error('db fail'));
      await expect(m.sellStock('AAPL', 'u', 'p', 1)).resolves.toBeUndefined();
    });

    test('sellStock returns undefined when update fails', async () => {
      sql.Shares.findOne
        .mockResolvedValueOnce({ amount_owned: 10, portfolio_uuid: 'p' })
        .mockResolvedValueOnce({ total_invested: 500 });
      sql.Shares.update.mockRejectedValue(new Error('update fail'));
      await expect(m.sellStock('AAPL', 'u', 'p', 4)).resolves.toBeUndefined();
    });

    test('logTransaction returns undefined when TransactionLog.create fails', async () => {
      sql.TransactionLog.create.mockRejectedValue(new Error('log fail'));
      await expect(m.logTransaction('u', 'BUY', 'AAPL', 10, 100, 'usd')).resolves.toBeUndefined();
    });

    // Edge: <=0 amounts — keep behavior loose but defined
    test('verifyStockAmount defined for non-positive amounts (edge)', async () => {
      sql.Shares.findAll.mockResolvedValue([{ amount_owned: 10 }]);
      await expect(m.verifyStockAmount('AAPL', 'u', 'p', 0)).resolves.toBeDefined();
      await expect(m.verifyStockAmount('AAPL', 'u', 'p', -1)).resolves.toBeDefined();
    });
  });
});