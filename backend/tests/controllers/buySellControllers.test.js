jest.mock('../../src/models/portfolioModels', () => ({
  hasAPortfolio: jest.fn(),
  getDefaultPortfolio: jest.fn(),
  findStocksPortfolio: jest.fn(),
}));
const portfolioModel2 = require('../../src/models/portfolioModels');

jest.mock('../../src/models/middlewareModels', () => ({ convertCurrency: jest.fn() }));
const middlewareModel2 = require('../../src/models/middlewareModels');

jest.mock('../../src/models/buySellModels', () => ({
  getUserMoney: jest.fn(),
  verifyStock: jest.fn(),
  verifyStockPrice: jest.fn(),
  verifyStockAmount: jest.fn(),
  buyStock: jest.fn(),
  sellStock: jest.fn(),
  logTransaction: jest.fn(),
}));
const buySellModel2 = require('../../src/models/buySellModels');

jest.mock('../../src/models/userModels', () => ({ spendMoney: jest.fn(), gainMoney: jest.fn() }));
const userModel2 = require('../../src/models/userModels');

jest.mock('yahoo-finance2', () => ({ default: { quote: jest.fn(), search: jest.fn() } }));
const Yahoo2 = require('yahoo-finance2').default;

const { buyStocks, sellStocks } = require('../../src/controllers/buySellControllers');

describe('buySellControllers', () => {
  beforeEach(() => jest.clearAllMocks());
  const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  // --- BUY happy path
  test('buyStocks -> 200 happy path (priceAmount input)', async () => {
    portfolioModel2.hasAPortfolio.mockResolvedValue(true);
    portfolioModel2.getDefaultPortfolio.mockResolvedValue('port1');
    Yahoo2.quote.mockResolvedValue({ ask: 10, currency: 'USD' });
    Yahoo2.search.mockResolvedValue({ quotes: [{ shortname: 'Apple Inc.' }] });
    middlewareModel2.convertCurrency.mockResolvedValue(10); // already USD
    buySellModel2.getUserMoney.mockResolvedValue(1000);
    buySellModel2.buyStock.mockResolvedValue('ok');
    userModel2.spendMoney.mockResolvedValue('ok');
    buySellModel2.logTransaction.mockResolvedValue({});

    const r = res();
    const req = { params: { tag: 'AAPL' }, user: { uuid: 'owner' }, body: { priceAmount: 100, currency: 'usd' } };
    await buyStocks(req, r);

    expect(buySellModel2.buyStock).toHaveBeenCalledWith('AAPL', 100, 10, 'owner', 'port1');
    expect(userModel2.spendMoney).toHaveBeenCalledWith(100, 'owner');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ message: expect.stringContaining('Bought 10 shares for 100 usd of Apple Inc. at 10 usd per share') });
  });

  // --- BUY validation & error paths
  test('buyStocks -> 400 when neither priceAmount nor stockAmount provided', async () => {
    portfolioModel2.hasAPortfolio.mockResolvedValue(true);
    portfolioModel2.getDefaultPortfolio.mockResolvedValue('port1');
    const r = res();
    await buyStocks({ params: { tag: 'AAPL' }, user: { uuid: 'owner' }, body: { currency: 'usd' } }, r);
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  test('buyStocks -> 400 when both priceAmount and stockAmount provided', async () => {
    portfolioModel2.hasAPortfolio.mockResolvedValue(true);
    portfolioModel2.getDefaultPortfolio.mockResolvedValue('port1');
    const r = res();
    await buyStocks({ params: { tag: 'AAPL' }, user: { uuid: 'owner' }, body: { currency: 'usd', priceAmount: 100, stockAmount: 10 } }, r);
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  test('buyStocks -> 400 when user has no portfolio', async () => {
    portfolioModel2.hasAPortfolio.mockResolvedValue(false);
    const r = res();
    await buyStocks({ params: { tag: 'AAPL' }, user: { uuid: 'owner' }, body: { priceAmount: 100, currency: 'usd' } }, r);
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  test('buyStocks -> 400 when not enough money', async () => {
    portfolioModel2.hasAPortfolio.mockResolvedValue(true);
    portfolioModel2.getDefaultPortfolio.mockResolvedValue('port1');
    Yahoo2.quote.mockResolvedValue({ ask: 10, currency: 'USD' });
    Yahoo2.search.mockResolvedValue({ quotes: [{ shortname: 'Apple Inc.' }] });
    middlewareModel2.convertCurrency.mockResolvedValue(10);
    buySellModel2.getUserMoney.mockResolvedValue(50); // insufficient for priceAmount 100

    const r = res();
    const req = { params: { tag: 'AAPL' }, user: { uuid: 'owner' }, body: { priceAmount: 100, currency: 'usd' } };
    await buyStocks(req, r);

    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  // --- SELL happy path
  test('sellStocks -> 200 happy path (stockAmount input)', async () => {
    portfolioModel2.hasAPortfolio.mockResolvedValue(true);
    portfolioModel2.findStocksPortfolio.mockResolvedValue(['port1']);
    buySellModel2.verifyStock.mockResolvedValue(true);
    Yahoo2.quote.mockResolvedValue({ bid: 5, currency: 'USD' });
    Yahoo2.search.mockResolvedValue({ quotes: [{ shortname: 'Apple Inc.' }] });
    middlewareModel2.convertCurrency.mockResolvedValue(5);
    buySellModel2.verifyStockAmount.mockResolvedValue(4); // user sells 4
    buySellModel2.sellStock.mockResolvedValue('ok');
    userModel2.gainMoney.mockResolvedValue('ok');
    buySellModel2.logTransaction.mockResolvedValue({});

    const r = res();
    const req = { params: { tag: 'AAPL' }, user: { uuid: 'owner' }, body: { stockAmount: 4, currency: 'usd' } };
    await sellStocks(req, r);

    expect(buySellModel2.sellStock).toHaveBeenCalledWith('AAPL', 'owner', 'port1', 4);
    expect(userModel2.gainMoney).toHaveBeenCalledWith(20, 'owner');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ message: expect.stringContaining('Sold 4 shares for 20 usd of Apple Inc. at 5 usd per share') });
  });

  // --- SELL validation & error paths
  test('sellStocks -> 400 when neither priceAmount nor stockAmount provided', async () => {
    portfolioModel2.hasAPortfolio.mockResolvedValue(true);
    portfolioModel2.findStocksPortfolio.mockResolvedValue(['port1']);
    const r = res();
    await sellStocks({ params: { tag: 'AAPL' }, user: { uuid: 'owner' }, body: { currency: 'usd' } }, r);
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  test('sellStocks -> 400 when both priceAmount and stockAmount provided', async () => {
    portfolioModel2.hasAPortfolio.mockResolvedValue(true);
    portfolioModel2.findStocksPortfolio.mockResolvedValue(['port1']);
    const r = res();
    await sellStocks({ params: { tag: 'AAPL' }, user: { uuid: 'owner' }, body: { currency: 'usd', priceAmount: 100, stockAmount: 10 } }, r);
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  test('sellStocks -> 400 when user has no portfolio containing stock', async () => {
    portfolioModel2.hasAPortfolio.mockResolvedValue(true);
    portfolioModel2.findStocksPortfolio.mockResolvedValue([]);
    const r = res();
    await sellStocks({ params: { tag: 'AAPL' }, user: { uuid: 'owner' }, body: { stockAmount: 1, currency: 'usd' } }, r);
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  test('sellStocks -> 400 when verifyStock reports user does not own that stock', async () => {
    portfolioModel2.hasAPortfolio.mockResolvedValue(true);
    portfolioModel2.findStocksPortfolio.mockResolvedValue(['port1']);
    buySellModel2.verifyStock.mockResolvedValue(false);
    const r = res();
    await sellStocks({ params: { tag: 'AAPL' }, user: { uuid: 'owner' }, body: { stockAmount: 1, currency: 'usd' } }, r);
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });
});
