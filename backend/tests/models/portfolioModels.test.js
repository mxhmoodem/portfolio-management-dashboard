const silenceConsole = () => {
  let log, warn, error;
  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    error = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => { log.mockRestore(); warn.mockRestore(); error.mockRestore(); });
};

describe('userModels (success)', () => {
  silenceConsole();

  jest.isolateModules(() => {
    jest.resetModules();

    jest.doMock('../../src/config/sql', () => ({
      Users: { findOne: jest.fn(), findAll: jest.fn(), update: jest.fn() },
      Shares: { findAll: jest.fn() },
      TransactionLog: { findAll: jest.fn() },
    }));
    const sql = require('../../src/config/sql');
    const m = require('../../src/models/userModels');

    beforeEach(() => jest.clearAllMocks());

    // Name getters
    test('getFirstName / getLastName / getFullName', async () => {
      sql.Users.findOne.mockResolvedValueOnce({ fname: 'A' });
      await expect(m.getFirstName('u')).resolves.toEqual({ fname: 'A' });

      sql.Users.findOne.mockResolvedValueOnce({ lname: 'B' });
      await expect(m.getLastName('u')).resolves.toEqual({ lname: 'B' });

      sql.Users.findOne.mockResolvedValueOnce({ fname: 'A', lname: 'B' });
      await expect(m.getFullName('u')).resolves.toEqual({ fname: 'A', lname: 'B' });
    });

    // Money functions
    test('spendMoney -> subtracts and updates', async () => {
      sql.Users.findOne.mockResolvedValue({ money: 100 });
      sql.Users.update.mockResolvedValue([1]);
      const out = await m.spendMoney(30, 'u');
      expect(sql.Users.update).toHaveBeenCalledWith(
        { money: 70 },
        { where: { uuid: 'u' } }
      );
      expect(out).toEqual([1]);
    });

    test('gainMoney -> adds and updates', async () => {
      sql.Users.findOne.mockResolvedValue({ money: 10 });
      sql.Users.update.mockResolvedValue([1]);
      const out = await m.gainMoney(90, 'u');
      expect(sql.Users.update).toHaveBeenCalledWith(
        { money: 100 },
        { where: { uuid: 'u' } }
      );
      expect(out).toEqual([1]);
    });

    // Getters
    test('getBalance -> returns rows array of money', async () => {
      const rows = [{ money: 42 }];
      sql.Users.findOne.mockResolvedValue({money: 42});
      const out = await m.getBalance('u');
      expect(out).toBe(42);
    });

    test('getAllShares -> by specific portfolio', async () => {
      const rows = [{ id: 1 }];
      sql.Shares.findAll.mockResolvedValue(rows);
      const out = await m.getAllShares('u', 'p1');
      expect(sql.Shares.findAll).toHaveBeenCalledWith({
        where: { owner_uuid: 'u', portfolio_uuid: 'p1' }
      });
      expect(out).toBe(rows);
    });

    test('getAllShares -> all for user when portfolio empty string', async () => {
      const rows = [{ id: 2 }];
      sql.Shares.findAll.mockResolvedValue(rows);
      const out = await m.getAllShares('u', '');
      expect(sql.Shares.findAll).toHaveBeenCalledWith({
        where: { owner_uuid: 'u' }
      });
      expect(out).toBe(rows);
    });

    test('getAllLogs -> returns rows', async () => {
      const rows = [{ type: 'BUY' }];
      sql.TransactionLog.findAll.mockResolvedValue(rows);
      const out = await m.getAllLogs('u');
      expect(sql.TransactionLog.findAll).toHaveBeenCalledWith({ where: { owner_uuid: 'u' } });
      expect(out).toBe(rows);
    });

    test('getUserPreferedCurrencyUUID -> returns field value', async () => {
      sql.Users.findOne.mockResolvedValue({ prefered_currency: 'usd' });
      await expect(m.getUserPreferedCurrencyUUID('u')).resolves.toBe('usd');
    });
  });
});
