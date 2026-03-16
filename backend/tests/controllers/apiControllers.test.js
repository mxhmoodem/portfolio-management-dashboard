jest.mock('yahoo-finance2', () => ({ default: { quote: jest.fn(), search: jest.fn() } }));
const Yahoo = require('yahoo-finance2').default;

const controller = require('../../src/controllers/apiControllers');

describe('apiControllers', () => {
  beforeEach(() => jest.clearAllMocks());
  const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  test('getCurrentPrice -> 200 with ask/bid/currency', async () => {
    Yahoo.quote.mockResolvedValue({ ask: 11, bid: 10, currency: 'USD' });
    const req = { params: { tag: 'AAPL' } };
    const r = res();
    await controller.getCurrentPrice(req, r);
    expect(Yahoo.quote).toHaveBeenCalledWith('AAPL');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith({ ask: 11, bid: 10, currency: 'USD' });
  });

  test('searchForCompany -> 200 with quotes array', async () => {
    Yahoo.search.mockResolvedValue({ quotes: [{ symbol: 'AAPL' }] });
    const req = { params: { query: 'apple' } };
    const r = res();
    await controller.searchForCompany(req, r);
    expect(Yahoo.search).toHaveBeenCalledWith('apple');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith([{ symbol: 'AAPL' }]);
  });

  test('searchNews -> 200 with news array', async () => {
    Yahoo.search.mockResolvedValue({ news: [{ title: 'x' }] });
    const r = res();
    await controller.searchNews({ params: { query: 'apple' } }, r);
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith([{ title: 'x' }]);
  });

  test('searchFincancials -> 200 with quotes details', async () => {
    Yahoo.search.mockResolvedValue({ quotes: [{ symbol: 'AAPL' }, { symbol: 'MSFT' }] });
    Yahoo.quote
      .mockResolvedValueOnce({ symbol: 'AAPL', bid: 10 })
      .mockResolvedValueOnce({ symbol: 'MSFT', bid: 20 });
    const r = res();
    await controller.searchFincancials({ params: { query: 'tech' } }, r);
    expect(r.status).toHaveBeenCalledWith(200);
    expect(r.json).toHaveBeenCalledWith([{ symbol: 'AAPL', bid: 10 }, { symbol: 'MSFT', bid: 20 }]);
  });
});