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

jest.mock('../../../src/models/authModels', () => ({
  createUser: jest.fn(),
  getAllUsers: jest.fn(),
  verifyLogin: jest.fn(),
}));
const authModels = require('../../../src/models/authModels');

describe('authControllers (500 paths)', () => {
  const { createUser, getAllUsers, loginUser } = require('../../../src/controllers/authControllers');

  test('createUser -> 500 on model error', async () => {
    const req = { body: { username: 'a', password: 'p', fname: 'A', lname: 'B' } };
    const res = mkRes();
    authModels.createUser.mockRejectedValue(new Error('boom'));

    await createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('getAllUsers -> 500 on model error', async () => {
    const req = {};
    const res = mkRes();
    authModels.getAllUsers.mockRejectedValue(new Error('boom'));

    await getAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  test('loginUser -> 500 on verifyLogin crash', async () => {
    const req = { body: { username: 'x', password: 'y' } };
    const res = mkRes();
    authModels.verifyLogin.mockRejectedValue(new Error('boom'));

    await loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});