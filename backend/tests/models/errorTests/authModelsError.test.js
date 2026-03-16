// backend/tests/models/errorTests/authModelsError.test.js

const silenceConsole = () => {
  let log, warn, error;
  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    error = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    log.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });
};

describe('authModels — error & edge paths (non-throwing implementation)', () => {
  silenceConsole();

  jest.isolateModules(() => {
    jest.resetModules();

    jest.doMock('../../../src/config/sql', () => ({
      Users: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
    }));
    const sql = require('../../../src/config/sql');

    jest.doMock('bcrypt', () => ({
      compare: jest.fn(),
    }));
    const bcrypt = require('bcrypt');

    const auth = require('../../../src/models/authModels');

    test('createUser returns undefined when Users.findAll fails (caught & swallowed)', async () => {
      sql.Users.findAll.mockRejectedValue(new Error('db down'));
      await expect(auth.createUser({ username: 'a', password: 'p' })).resolves.toBeUndefined();
    });

    test('createUser returns undefined when Users.create fails (caught & swallowed)', async () => {
      sql.Users.findAll.mockResolvedValue([]); // no duplicate
      sql.Users.create.mockRejectedValue(new Error('boom'));
      await expect(auth.createUser({ username: 'a', password: 'p' })).resolves.toBeUndefined();
    });

    test('createUser returns undefined when username already exists (edge case)', async () => {
      sql.Users.findAll.mockResolvedValue([{ uuid: 'u1' }]); // duplicate found
      await expect(auth.createUser({ username: 'a', password: 'p' })).resolves.toBeUndefined();
    });

    test('getAllUsers returns undefined when Users.findAll fails (caught & swallowed)', async () => {
      sql.Users.findAll.mockRejectedValue(new Error('boom'));
      await expect(auth.getAllUsers()).resolves.toBeUndefined();
    });

    test('verifyLogin returns undefined when Users.findOne fails (caught & swallowed)', async () => {
      sql.Users.findOne.mockRejectedValue(new Error('boom'));
      await expect(auth.verifyLogin({ username: 'a', password: 'p' })).resolves.toBeUndefined();
    });

    test('verifyLogin returns undefined when user not found (edge case)', async () => {
      sql.Users.findOne.mockResolvedValue(null);
      await expect(auth.verifyLogin({ username: 'missing', password: 'x' })).resolves.toBeUndefined();
    });

    test('verifyLogin returns undefined when bcrypt.compare throws (caught & swallowed)', async () => {
      sql.Users.findOne.mockResolvedValue({ uuid: 'u1', username: 'a', password: 'hash' });
      bcrypt.compare.mockRejectedValue(new Error('bcrypt fail'));
      await expect(auth.verifyLogin({ username: 'a', password: 'p' })).resolves.toBeUndefined();
    });

    test('verifyLogin returns undefined when password mismatch', async () => {
      sql.Users.findOne.mockResolvedValue({ uuid: 'u1', username: 'a', password: 'hash' });
      bcrypt.compare.mockResolvedValue(false);
      await expect(auth.verifyLogin({ username: 'a', password: 'wrong' })).resolves.toBeUndefined();
    });

    test('verifyLogin returns uuid when password matches (sanity check)', async () => {
      sql.Users.findOne.mockResolvedValue({ uuid: 'u1', username: 'a', password: 'hash' });
      bcrypt.compare.mockResolvedValue(true);
      await expect(auth.verifyLogin({ username: 'a', password: 'p' })).resolves.toBe('u1');
    });
  });
});
