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

jest.mock('../../../src/models/buySellModels', () => ({
  getUserMoney: jest.fn(),
  verifyStock: jest.fn(),
  verifyStockPrice: jest.fn(),
  verifyStockAmount: jest.fn(),
  buyStock: jest.fn(),
  sellStock: jest.fn(),
  logTransaction: jest.fn(),
}));
const bsModels = require('../../../src/models/buySellModels');

jest.mock('../../../src/models/portfolioModels', () => ({
  hasAPortfolio: jest.fn(),
  getDefaultPortfolio: jest.fn(),
  findStocksPortfolio: jest.fn(),
}));
const pModels = require('../../../src/models/portfolioModels');

jest.mock('../../../src/models/middlewareModels', () => ({ convertCurrency: jest.fn() }));
const middlewareCurrency = require('../../../src/models/middlewareModels');

jest.mock('../../../src/models/userModels', () => ({ spendMoney: jest.fn(), gainMoney: jest.fn() }));
const uModels = require('../../../src/models/userModels');

jest.mock('yahoo-finance2', () => ({ default: { quote: jest.fn(), search: jest.fn() } }));
const YF = require('yahoo-finance2').default;

describe('buySellControllers (500 paths)', () => {
  const { buyStocks, sellStocks } = require('../../../src/controllers/buySellControllers');

  test('buyStocks -> 500 on Yahoo quote error', async () => {
    const res = mkRes();
    pModels.hasAPortfolio.mockResolvedValue(true);
    pModels.getDefaultPortfolio.mockResolvedValue('port1');
    YF.quote.mockRejectedValue(new Error('boom'));

    await buyStocks({ user: { uuid: 'u' }, params: { tag: 'AAPL' }, body: { priceAmount: 100, currency: 'usd' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('buyStocks -> 500 when buyStock fails', async () => {
    const res = mkRes();
    pModels.hasAPortfolio.mockResolvedValue(true);
    pModels.getDefaultPortfolio.mockResolvedValue('port1');
    YF.quote.mockResolvedValue({ ask: 10, currency: 'USD' });
    YF.search.mockResolvedValue({ quotes: [{ shortname: 'Apple Inc.' }] });
    middlewareCurrency.convertCurrency.mockResolvedValue(10);
    bsModels.getUserMoney.mockResolvedValue(1000);
    bsModels.buyStock.mockRejectedValue(new Error('boom'));

    await buyStocks({ user: { uuid: 'u' }, params: { tag: 'AAPL' }, body: { priceAmount: 100, currency: 'usd' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('sellStocks -> 500 on Yahoo quote error', async () => {
    const res = mkRes();
    pModels.hasAPortfolio.mockResolvedValue(true);
    pModels.findStocksPortfolio.mockResolvedValue(['port1']);
    bsModels.verifyStock.mockResolvedValue(true);
    YF.quote.mockRejectedValue(new Error('boom'));

    await sellStocks({ user: { uuid: 'u' }, params: { tag: 'AAPL' }, body: { stockAmount: 1, currency: 'usd' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('sellStocks -> 500 when sellStock fails', async () => {
    const res = mkRes();
    pModels.hasAPortfolio.mockResolvedValue(true);
    pModels.findStocksPortfolio.mockResolvedValue(['port1']);
    bsModels.verifyStock.mockResolvedValue(true);
    YF.quote.mockResolvedValue({ bid: 5, currency: 'USD' });
    YF.search.mockResolvedValue({ quotes: [{ shortname: 'Apple Inc.' }] });
    middlewareCurrency.convertCurrency.mockResolvedValue(5);
    bsModels.verifyStockAmount.mockResolvedValue(1);
    bsModels.sellStock.mockRejectedValue(new Error('boom'));

    await sellStocks({ user: { uuid: 'u' }, params: { tag: 'AAPL' }, body: { stockAmount: 1, currency: 'usd' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});