// middlewareModels — SUCCESS paths (no spying on intra-module calls)

const silenceConsole = () => {
  let log, warn, error;
  beforeAll(() => {
    log   = jest.spyOn(console, 'log').mockImplementation(() => {});
    warn  = jest.spyOn(console, 'warn').mockImplementation(() => {});
    error = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => { log.mockRestore(); warn.mockRestore(); error.mockRestore(); });
};

describe('middlewareModels (success)', () => {
  silenceConsole();

  jest.isolateModules(() => {
    jest.resetModules();

    // --- mocks
    jest.doMock('../../src/config/sql', () => ({
      Users:     { destroy: jest.fn(), findAll: jest.fn() },
      Portfolio: { destroy: jest.fn(), update: jest.fn(), findAll: jest.fn() },
      Shares:    { destroy: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn() },
      TransactionLog: { destroy: jest.fn() },
    }));
    const sql = require('../../src/config/sql');

    jest.doMock('axios', () => ({ get: jest.fn() }));
    const axios = require('axios');

    const YF = { quote: jest.fn() };
    jest.doMock('yahoo-finance2', () => ({ default: YF }));

    jest.doMock('../../src/models/userModels', () => ({
      getUserPreferedCurrencyUUID: jest.fn(),
    }));
    const userModels = require('../../src/models/userModels');

    const mod = require('../../src/models/middlewareModels');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('convertCurrency -> returns amount * rate', async () => {
      axios.get.mockResolvedValue({ data: { usd: { gbp: 0.8 } } });
      const out = await mod.convertCurrency(100, 'usd', 'gbp');
      expect(out).toBeCloseTo(80);
    });

    test('convertCurrency -> returns 0 if input is 0', async () => {
      const out = await mod.convertCurrency(0, 'usd', 'gbp');
      expect(out).toBe(0);
    });

    test('convertCurrency -> returns amount if conversion is the same', async () => {
      const out = await mod.convertCurrency(200, 'gbp', 'gbp');
      expect(out).toBe(200);
    });

    test('cleanDb -> calls all destroys and resolves undefined', async () => {
      sql.Users.destroy.mockResolvedValue(1);
      sql.Portfolio.destroy.mockResolvedValue(1);
      sql.Shares.destroy.mockResolvedValue(1);
      sql.TransactionLog.destroy.mockResolvedValue(1);

      const out = await mod.cleanDb();
      expect(sql.Users.destroy).toHaveBeenCalled();
      expect(sql.Portfolio.destroy).toHaveBeenCalled();
      expect(sql.Shares.destroy).toHaveBeenCalled();
      expect(sql.TransactionLog.destroy).toHaveBeenCalled();
      expect(out).toBeUndefined();
    });

    test('updateShareValue -> same-currency path updates share and returns total_value', async () => {
      sql.Shares.findOne.mockResolvedValue({
        id: 1, tag: 'AAPL', owner_uuid: 'u1', total_invested: 500, amount_owned: 10, closed:false
      });
      YF.quote.mockResolvedValue({ ask: 11, bid: 10, currency: 'USD' });
      userModels.getUserPreferedCurrencyUUID.mockResolvedValue('usd');
      sql.Shares.update.mockResolvedValue([1]);

      const out = await mod.updateShareValue(1);
      expect(sql.Shares.update).toHaveBeenCalledWith(
        { ask: 11, bid: 10, total_value: 100, total_invested: 500, currency: 'usd', closed: false },
        { where: { id: 1 } }
      );
      expect(out).toBe(100);
    });

    test('updateShareValue -> with currency conversion (EUR→USD)', async () => {
      sql.Shares.findOne.mockResolvedValue({
        id: 2, tag: 'SAP', owner_uuid: 'u2', total_invested: 200, amount_owned: 5, currency: 'eur', closed: false,
      });
      YF.quote.mockResolvedValue({ ask: 2, bid: 1, currency: 'eur' });
      userModels.getUserPreferedCurrencyUUID.mockResolvedValue('usd');
      // First conversion (ask) then (bid) then (total_invested)
      axios.get.mockResolvedValue({ data: { eur: { usd: 2 } } });
      sql.Shares.update.mockResolvedValue([1]);

      const out = await mod.updateShareValue(2);
      // ask 2 EUR -> 4 USD; bid 1 EUR -> 2 USD; invested 200 EUR -> 400 USD; total_value 2*5 = 10
      expect(sql.Shares.update).toHaveBeenCalledWith(
        { ask: 4, bid: 2, total_value: 10, total_invested: 400, currency: 'usd', closed: false },
        { where: { id: 2 } }
      );
      expect(out).toBe(10);
    });

    test('updatePortfolioValue -> sums share values and updates portfolio', async () => {
      // The function will loop shares and call updateShareValue for each. We drive the inner
      // computation by mocking the lower-level deps that updateShareValue uses.
      sql.Shares.findAll.mockResolvedValue([
        { id: 11, total_invested: 150 },
        { id: 12, total_invested: 250 },
      ]);

      // For id 11
      sql.Shares.findOne
        .mockResolvedValueOnce({ id: 11, tag: 'AAPL', owner_uuid: 'u', total_invested: 150, amount_owned: 1 });
      YF.quote
        .mockResolvedValueOnce({ ask: 51, bid: 50, currency: 'USD' });

      // For id 12
      sql.Shares.findOne
        .mockResolvedValueOnce({ id: 12, tag: 'MSFT', owner_uuid: 'u', total_invested: 250, amount_owned: 1 });
      YF.quote
        .mockResolvedValueOnce({ ask: 71, bid: 70, currency: 'USD' });

      jest.spyOn(userModels, 'getUserPreferedCurrencyUUID').mockResolvedValue('usd');
      sql.Shares.update.mockResolvedValue([1]); // ignore per-call details in this test
      sql.Portfolio.update.mockResolvedValue([1]);

      const out = await mod.updatePortfolioValue('port-1');

      // Called once (after loop) with cumulative values
      expect(sql.Portfolio.update).toHaveBeenCalledWith(
        { value: 120, inputValue: 400 },
        { where: { uuid: 'port-1' } }
      );
      expect(out).toEqual([1]);
    });

    test('updateOwnersPortfolios -> iterates each portfolio (observe nested DB calls), returns undefined', async () => {
      sql.Portfolio.findAll.mockResolvedValue([{ uuid: 'p1' }, { uuid: 'p2' }]);

      // When updatePortfolioValue runs per portfolio, it calls Shares.findAll with that uuid.
      sql.Shares.findAll
        .mockResolvedValueOnce([]) // for p1
        .mockResolvedValueOnce([]); // for p2
      // Portfolio.update will then be called with totals 0,0 for each
      sql.Portfolio.update.mockResolvedValue([1]);

      const out = await mod.updateOwnersPortfolios('owner-1');

      expect(sql.Portfolio.findAll).toHaveBeenCalledWith({ where: { owner_uuid: 'owner-1' } });
      expect(sql.Shares.findAll).toHaveBeenNthCalledWith(1, { where: { portfolio_uuid: 'p1' } });
      expect(sql.Shares.findAll).toHaveBeenNthCalledWith(2, { where: { portfolio_uuid: 'p2' } });
      expect(out).toBeUndefined();
    });

    test('updateAllStocks -> iterates users (observe nested Portfolio.findAll), returns true', async () => {
      sql.Users.findAll.mockResolvedValue([{ uuid: 'u1' }, { uuid: 'u2' }]);

      // updateOwnersPortfolios -> Portfolio.findAll per user
      sql.Portfolio.findAll
        .mockResolvedValueOnce([]) // for u1
        .mockResolvedValueOnce([]); // for u2
      sql.Portfolio.update.mockResolvedValue([1]);

      const out = await mod.updateAllStocks();

      expect(sql.Portfolio.findAll).toHaveBeenNthCalledWith(1, { where: { owner_uuid: 'u1' } });
      expect(sql.Portfolio.findAll).toHaveBeenNthCalledWith(2, { where: { owner_uuid: 'u2' } });
      expect(out).toBe(true);
    });
  });
});
