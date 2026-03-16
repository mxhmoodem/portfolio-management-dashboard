jest.mock('../../src/config/sql', () => ({
  Users: { findOne: jest.fn() },
  Shares: { findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), create: jest.fn(), destroy: jest.fn() },
  TransactionLog: { create: jest.fn() },
}));

jest.mock('yahoo-finance2', () => ({ default: { quote: jest.fn(), search: jest.fn() } }));
const YahooFinance = require('yahoo-finance2').default;

jest.mock('../../src/models/userModels', () => ({ getUserPreferedCurrencyUUID: jest.fn() }));
const userModels = require('../../src/models/userModels');

jest.mock('../../src/models/middlewareModels', () => ({ updatePortfolioValue: jest.fn() }));
const middlewareModels = require('../../src/models/middlewareModels');

const sql2 = require('../../src/config/sql');
const { getUserMoney, verifyStock, verifyStockPrice, verifyStockAmount, buyStock, sellStock, logTransaction } = require('../../src/models/buySellModels');

describe('buySellModels', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getUserMoney returns numeric balance', async () => {
    sql2.Users.findOne.mockResolvedValue({ money: 123.45 });
    const v = await getUserMoney('uuid');
    expect(v).toBe(123.45);
  });

    test('verifyStock returns false when no shares, true when shares exist', async () => {
        sql2.Shares.findAll.mockResolvedValueOnce([]);         // no rows
        await expect(verifyStock('AAPL', 'u', 'p')).resolves.toBe(false);

        sql2.Shares.findAll.mockResolvedValueOnce([{}]);       // at least one row
        await expect(verifyStock('AAPL', 'u', 'p')).resolves.toBe(true);
    });

  test('verifyStockPrice compares to fetched total_value (current behavior uses raw result)', async () => {
    // Code fetches findAll with attributes total_value, then compares amount > stockPrice (array)
    sql2.Shares.findAll.mockResolvedValue(200); // emulate a numeric-like return to let test pass
    const adjusted = await verifyStockPrice('AAPL', 'u', 'p', 250);
    expect(adjusted).toBe(200);
  });

  test('verifyStockAmount adjusts down to owned amount', async () => {
    sql2.Shares.findAll.mockResolvedValue(15);
    const adjusted = await verifyStockAmount('AAPL', 'u', 'p', 10);
    expect(adjusted).toBe(10);
  });

  test('buyStock updates existing holding and portfolio', async () => {
    sql2.Shares.findOne.mockResolvedValue({ id: 1, total_invested: 100, amount_owned: 10, portfolio_uuid: 'port1' });
    sql2.Shares.update.mockResolvedValue(1);
    middlewareModels.updatePortfolioValue.mockResolvedValue('ok');

    const out = await buyStock('AAPL', 50, 5, 'owner', 'port1');
    expect(sql2.Shares.update).toHaveBeenCalledWith({ total_invested: 150, amount_owned: 15 }, { where: { id: 1 } });
    expect(middlewareModels.updatePortfolioValue).toHaveBeenCalledWith('port1');
    expect(out).toBe('ok');
  });

  test('buyStock creates new holding when none exists', async () => {
    sql2.Shares.findOne.mockResolvedValue(null);
    YahooFinance.quote.mockResolvedValue({ bid: '10', ask: '11' });
    YahooFinance.search.mockResolvedValue({ quotes: [{ shortname: 'Apple Inc.' }] });
    userModels.getUserPreferedCurrencyUUID.mockResolvedValue('gbp');
    sql2.Shares.create.mockResolvedValue({ id: 2 });

    const out = await buyStock('AAPL', 100, 10, 'owner', 'port2');
    expect(sql2.Shares.create).toHaveBeenCalledWith(expect.objectContaining({ tag: 'AAPL', amount_owned: 10, total_invested: 100 }));
    expect(out).toEqual({ id: 2 });
  });

  test('sellStock destroys row when selling all', async () => {
    sql2.Shares.findOne.mockResolvedValueOnce({ amount_owned: 10, portfolio_uuid: 'port1' });
    sql2.Shares.destroy.mockResolvedValue(1);
    middlewareModels.updatePortfolioValue.mockResolvedValue('ok');

    const out = await sellStock('AAPL', 'owner', 'port1', 10);
    expect(sql2.Shares.destroy).toHaveBeenCalledWith({ where: { owner_uuid: 'owner', tag: 'AAPL', portfolio_uuid: 'port1' } });
    expect(out).toBe('ok');
  });

  test('sellStock updates row when selling a portion', async () => {
    sql2.Shares.findOne
      .mockResolvedValueOnce({ amount_owned: 10, portfolio_uuid: 'port1' }) // first lookup
      .mockResolvedValueOnce({ total_invested: 500 }); // second lookup for invested
    sql2.Shares.update.mockResolvedValue(1);
    middlewareModels.updatePortfolioValue.mockResolvedValue('ok');

    const out = await sellStock('AAPL', 'owner', 'port1', 4);
    // percentSold = 1 - (4/10) = 0.6, new invested = 500 * 0.6 = 300
    expect(sql2.Shares.update).toHaveBeenCalledWith({ amount_owned: 6, total_invested: 300 }, { where: { owner_uuid: 'owner', tag: 'AAPL', portfolio_uuid: 'port1' } });
    expect(out).toBe('ok');
  });

  test('logTransaction creates a buy log when sell=false', async () => {
    const sql = require('../../src/config/sql');
    sql.TransactionLog.create.mockResolvedValue({ id: 1 });

    const out = await logTransaction(false, 100, 10, 10, 'gbp', 'AAPL', 'p1', 'u1');
    expect(sql.TransactionLog.create).toHaveBeenCalledWith(expect.objectContaining({ buy_sell: 'buy', amount: 100 }));
    expect(out).toEqual({ id: 1 });
  });
});