const silenceConsole = () => {
  let log, warn, error;
  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    error = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => { log.mockRestore(); warn.mockRestore(); error.mockRestore(); });
};

describe('portfolioModels (error paths)', () => {
  silenceConsole();

  jest.isolateModules(() => {
    jest.resetModules();

    jest.doMock('../../../src/config/sql', () => ({
      Users: { findAll: jest.fn(), findOne: jest.fn() },
      Portfolio: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), destroy: jest.fn() },
      Shares: { findAll: jest.fn() },
    }));
    const sql = require('../../../src/config/sql');
    const m = require('../../../src/models/portfolioModels');

    beforeEach(() => jest.clearAllMocks());

    // Checks
    test('hasAPortfolio -> returns undefined on DB error', async () => {
      sql.Portfolio.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.hasAPortfolio('u')).resolves.toBeUndefined();
    });

    test('checkIfPortfolioEmpty -> returns undefined on DB error', async () => {
      sql.Shares.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.checkIfPortfolioEmpty('p', 'u')).resolves.toBeUndefined();
    });

    // GET functions
    test('getUserPreferedCurrency -> undefined on DB error', async () => {
      sql.Users.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.getUserPreferedCurrency({ uuid: 'u' })).resolves.toBeUndefined();
    });

    test('getDefaultPortfolio -> undefined when findOne rejects or returns null', async () => {
      sql.Portfolio.findOne.mockRejectedValue(new Error('boom'));
      await expect(m.getDefaultPortfolio('u')).resolves.toBeUndefined();
      sql.Portfolio.findOne.mockResolvedValue(null); // would throw on .uuid, caught by outer try
      await expect(m.getDefaultPortfolio('u')).resolves.toBeUndefined();
    });

    // Misc
    test('findStocksPortfolio -> undefined on DB error', async () => {
      sql.Shares.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.findStocksPortfolio('AAPL', 'u')).resolves.toBeUndefined();
    });

    test('clearDefaultPortfolio -> undefined on DB error', async () => {
      sql.Portfolio.update.mockRejectedValue(new Error('boom'));
      await expect(m.clearDefaultPortfolio('u')).resolves.toBeUndefined();
    });

    // CRUD
    test('getPortfolio / getPortfolioUUID -> undefined on DB error', async () => {
      sql.Portfolio.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.getPortfolio({ uuid: 'u' })).resolves.toBeUndefined();
      await expect(m.getPortfolioUUID('u')).resolves.toBeUndefined();
    });

    test('createPortfolio -> undefined on prefetch error', async () => {
      sql.Portfolio.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.createPortfolio('Main', 'u', 'usd', true)).resolves.toBeUndefined();
    });

    test('createPortfolio -> undefined when create fails', async () => {
      sql.Portfolio.findAll.mockResolvedValue([]);
      sql.Portfolio.create.mockRejectedValue(new Error('boom'));
      await expect(m.createPortfolio('Main', 'u', 'usd', false)).resolves.toBeUndefined();
    });

    test('updatePortfolio -> undefined when name update fails', async () => {
      sql.Portfolio.update.mockRejectedValue(new Error('boom'));
      await expect(m.updatePortfolio('New', false, 'p', 'u')).resolves.toBeUndefined();
    });

    test('updatePortfolio -> undefined when default flow second update fails', async () => {
      // clearDefaultPortfolio ok (first update), then second update fails
      sql.Portfolio.update
        .mockResolvedValueOnce([1])
        .mockRejectedValueOnce(new Error('boom'));
      await expect(m.updatePortfolio(undefined, true, 'p', 'u')).resolves.toBeUndefined();
    });

    test('deletePortfolio -> undefined on DB error', async () => {
      sql.Portfolio.destroy.mockRejectedValue(new Error('boom'));
      await expect(m.deletePortfolio('p', 'u')).resolves.toBeUndefined();
    });

    // Values
    test('getPortfolioValue -> undefined when Shares.findAll rejects', async () => {
      sql.Shares.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.getPortfolioValue('p', 'u')).resolves.toBeUndefined();
    });

    test('getPortfolioValue -> undefined when Portfolio.update rejects', async () => {
      sql.Shares.findAll.mockResolvedValue([{ total_value: 5, total_invested: 10 }]);
      sql.Portfolio.update.mockRejectedValue(new Error('boom'));
      await expect(m.getPortfolioValue('p', 'u')).resolves.toBeUndefined();
    });

    test('getPortfolioReturn -> undefined on inner failures', async () => {
      // Failure in getPortfolioValue (via Shares.findAll)
      sql.Shares.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.getPortfolioReturn('p', 'u')).resolves.toBeUndefined();

      // Or in findOne
      sql.Shares.findAll.mockResolvedValue([{ total_value: 10, total_invested: 10 }]);
      sql.Portfolio.update.mockResolvedValue([1]);
      sql.Portfolio.findOne.mockRejectedValue(new Error('boom'));
      await expect(m.getPortfolioReturn('p', 'u')).resolves.toBeUndefined();
    });

    test('getPortfolioReturnPercentage -> undefined on inner failures', async () => {
      sql.Shares.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.getPortfolioReturnPercentage('p', 'u')).resolves.toBeUndefined();

      sql.Shares.findAll.mockResolvedValue([{ total_value: 10, total_invested: 10 }]);
      sql.Portfolio.update.mockResolvedValue([1]);
      sql.Portfolio.findOne.mockRejectedValue(new Error('boom'));
      await expect(m.getPortfolioReturnPercentage('p', 'u')).resolves.toBeUndefined();
    });
  });
});
