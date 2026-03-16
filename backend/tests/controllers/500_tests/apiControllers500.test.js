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

jest.mock('yahoo-finance2', () => ({ default: { quote: jest.fn(), search: jest.fn() } }));
const Yahoo = require('yahoo-finance2').default;

describe('apiControllers (500 paths)', () => {
  const { getCurrentPrice, searchForCompany, searchNews, searchFincancials } = require('../../../src/controllers/apiControllers');

  test('getCurrentPrice -> 500 on quote error', async () => {
    const req = { params: { tag: 'AAPL' } };
    const res = mkRes();
    Yahoo.quote.mockRejectedValue(new Error('boom'));
    await getCurrentPrice(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('searchForCompany -> 500 on search error', async () => {
    const res = mkRes();
    Yahoo.search.mockRejectedValue(new Error('boom'));
    await searchForCompany({ params: { query: 'apple' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('searchNews -> 500 on search error', async () => {
    const res = mkRes();
    Yahoo.search.mockRejectedValue(new Error('boom'));
    await searchNews({ params: { query: 'ai' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('searchFincancials -> 500 when search rejects', async () => {
    const res = mkRes();
    Yahoo.search.mockRejectedValue(new Error('boom'));
    await searchFincancials({ params: { query: 'tech' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});