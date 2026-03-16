const bcrypt = require('bcrypt');
jest.mock('bcrypt');


jest.mock('../../src/config/sql', () => ({
    Users: {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    }
}));


const sql = require('../../src/config/sql');
const { createUser, getAllUsers, verifyLogin } = require('../../src/models/authModels');


describe('authModels', () => {
    beforeEach(() => jest.clearAllMocks());


    test('createUser creates when username is unique', async () => {
        sql.Users.findAll.mockResolvedValue([]);
        sql.Users.create.mockResolvedValue({ uuid: 'u1', username: 'alice' });


        const out = await createUser({ username: 'alice', password: 'x' });
        expect(sql.Users.findAll).toHaveBeenCalledWith({
            attributes: ['uuid'],
            where: { username: 'alice' }
        });
        expect(sql.Users.create).toHaveBeenCalled();
        expect(out).toEqual({ uuid: 'u1', username: 'alice' });
    });


    test('createUser logs when username exists (no create)', async () => {
        console.error = jest.fn();
        sql.Users.findAll.mockResolvedValue([{ uuid: 'u1' }]);


        const out = await createUser({ username: 'alice', password: 'x' });
        expect(sql.Users.create).not.toHaveBeenCalled();
        expect(out).toBeUndefined();
        expect(console.error).toHaveBeenCalled();
    });


    test('getAllUsers returns array', async () => {
        sql.Users.findAll.mockResolvedValue([{ uuid: 'a' }]);
        const out = await getAllUsers();
        expect(sql.Users.findAll).toHaveBeenCalled();
        expect(out).toEqual([{ uuid: 'a' }]);
    });


    test('verifyLogin returns uuid on password match', async () => {
        sql.Users.findOne.mockResolvedValue({ uuid: 'u2', password: 'hashed' });
        bcrypt.compare.mockResolvedValue(true);


        const uuid = await verifyLogin({ username: 'bob', password: 'secret' });
        expect(sql.Users.findOne).toHaveBeenCalledWith({ where: { username: 'bob' } });
        expect(bcrypt.compare).toHaveBeenCalledWith('secret', 'hashed');
        expect(uuid).toBe('u2');
    });


    test('verifyLogin returns undefined when password mismatch', async () => {
        sql.Users.findOne.mockResolvedValue({ uuid: 'u2', password: 'hashed' });
        bcrypt.compare.mockResolvedValue(false);


        const uuid = await verifyLogin({ username: 'bob', password: 'wrong' });
        expect(uuid).toBeUndefined();
    });
});