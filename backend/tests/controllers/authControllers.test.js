jest.mock('../../src/models/authModels', () => ({
  createUser: jest.fn(),
  getAllUsers: jest.fn(),
  verifyLogin: jest.fn(),
}));
const model = require('../../src/models/authModels');

jest.mock('jsonwebtoken', () => ({ sign: jest.fn(() => 'signed.jwt.token') }));
const jwt = require('jsonwebtoken');

const controller = require('../../src/controllers/authControllers');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('authControllers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('createUser -> 201 on success', async () => {
    model.createUser.mockResolvedValue({ uuid: 'u1' });
    const req = { body: { username: 'a', password: 'p' } };
    const res = mockRes();

    await controller.createUser(req, res);
    expect(model.createUser).toHaveBeenCalledWith({ username: 'a', password: 'p' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'User created' });
  });

  test('getAllUsers -> 200 with users', async () => {
    model.getAllUsers.mockResolvedValue([{ uuid: 'u1' }]);
    const req = {};
    const res = mockRes();

    await controller.getAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ uuid: 'u1' }]);
  });

  test('loginUser -> 200 with token on valid creds', async () => {
    model.verifyLogin.mockResolvedValue('u1');
    const req = { body: { username: 'alice', password: 'x' } };
    const res = mockRes();

    await controller.loginUser(req, res);
    expect(model.verifyLogin).toHaveBeenCalledWith({ username: 'alice', password: 'x' });
    expect(jwt.sign).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'success', token: 'signed.jwt.token' });
  });

  test('loginUser -> 401 on invalid creds', async () => {
    model.verifyLogin.mockResolvedValue(undefined);
    const req = { body: { username: 'alice', password: 'bad' } };
    const res = mockRes();

    await controller.loginUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid Credentials' });
  });
});