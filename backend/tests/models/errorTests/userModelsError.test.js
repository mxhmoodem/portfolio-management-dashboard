const silenceConsole = () => {
  let log, warn, error;
  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    error = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => { log.mockRestore(); warn.mockRestore(); error.mockRestore(); });
};

describe('userModels (error paths)', () => {
  silenceConsole();

  jest.isolateModules(() => {
    jest.resetModules();

    jest.doMock('../../../src/config/sql', () => ({
      Users: { findOne: jest.fn(), findAll: jest.fn(), update: jest.fn() },
      Shares: { findAll: jest.fn() },
      TransactionLog: { findAll: jest.fn() },
    }));
    const sql = require('../../../src/config/sql');
    const m = require('../../../src/models/userModels');

    beforeEach(() => jest.clearAllMocks());

    // Name getters
    test('getFirstName / getLastName / getFullName -> undefined on DB error', async () => {
      sql.Users.findOne.mockRejectedValue(new Error('boom'));
      await expect(m.getFirstName('u')).resolves.toBeUndefined();
      await expect(m.getLastName('u')).resolves.toBeUndefined();
      await expect(m.getFullName('u')).resolves.toBeUndefined();
    });

    // Money functions
    test('spendMoney -> undefined when Users.findOne rejects', async () => {
      sql.Users.findOne.mockRejectedValue(new Error('boom'));
      await expect(m.spendMoney(10, 'u')).resolves.toBeUndefined();
    });

    test('spendMoney -> undefined when Users.update rejects', async () => {
      sql.Users.findOne.mockResolvedValue({ money: 50 });
      sql.Users.update.mockRejectedValue(new Error('boom'));
      await expect(m.spendMoney(10, 'u')).resolves.toBeUndefined();
    });

    test('gainMoney -> undefined when Users.findOne rejects', async () => {
      sql.Users.findOne.mockRejectedValue(new Error('boom'));
      await expect(m.gainMoney(10, 'u')).resolves.toBeUndefined();
    });

    test('gainMoney -> undefined when Users.update rejects', async () => {
      sql.Users.findOne.mockResolvedValue({ money: 5 });
      sql.Users.update.mockRejectedValue(new Error('boom'));
      await expect(m.gainMoney(10, 'u')).resolves.toBeUndefined();
    });

    // Getters
    test('getBalance -> undefined on DB error', async () => {
      sql.Users.findOne.mockRejectedValue(new Error('boom'));
      await expect(m.getBalance('u')).resolves.toBeUndefined();
    });

    test('getAllShares -> undefined when DB error (both branches)', async () => {
      sql.Shares.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.getAllShares('u', 'p')).resolves.toBeUndefined();

      sql.Shares.findAll.mockRejectedValue(new Error('boom2'));
      await expect(m.getAllShares('u', '')).resolves.toBeUndefined();
    });

    test('getAllLogs -> undefined on DB error', async () => {
      sql.TransactionLog.findAll.mockRejectedValue(new Error('boom'));
      await expect(m.getAllLogs('u')).resolves.toBeUndefined();
    });

    test('getUserPreferedCurrencyUUID -> undefined on DB error or null row', async () => {
      sql.Users.findOne.mockRejectedValue(new Error('boom'));
      await expect(m.getUserPreferedCurrencyUUID('u')).resolves.toBeUndefined();

      sql.Users.findOne.mockResolvedValue(null); // would throw on property access; outer catch returns undefined
      await expect(m.getUserPreferedCurrencyUUID('u')).resolves.toBeUndefined();
    });
  });
});
