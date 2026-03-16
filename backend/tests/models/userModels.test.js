jest.mock('../../src/config/sql', () => ({
    Users: { findOne: jest.fn(), findAll: jest.fn(), update: jest.fn() },
    Shares: { findAll: jest.fn() },
    TransactionLog: { findAll: jest.fn() }
}));

const sql5 = require('../../src/config/sql');
const {
    getFirstName, getLastName, getFullName, spendMoney, gainMoney, getBalance,
    getAllShares, getAllLogs, getUserPreferedCurrencyUUID
} = require('../../src/models/userModels');

describe('userModels', () => {
    beforeEach(() => jest.clearAllMocks());

    test('name getters hit Users table with expected attributes', async () => {
        sql5.Users.findOne.mockResolvedValueOnce({ fname: 'A' })
                            .mockResolvedValueOnce({ lname: 'B' })
                            .mockResolvedValueOnce({ fname: 'A', lname: 'B' });
        await expect(getFirstName('u')).resolves.toEqual({ fname: 'A' });
        await expect(getLastName('u')).resolves.toEqual({ lname: 'B' });
        await expect(getFullName('u')).resolves.toEqual({ fname: 'A', lname: 'B' });
    });

    test('spendMoney subtracts and updates', async () => {
        sql5.Users.findOne.mockResolvedValue({ money: 100 });
        sql5.Users.update.mockResolvedValue(1);
        await spendMoney(30, 'u');
        expect(sql5.Users.update).toHaveBeenCalledWith({ money: 70 }, { where: { uuid: 'u' } });
    });

    test('gainMoney adds and updates', async () => {
        sql5.Users.findOne.mockResolvedValue({ money: 100 });
        sql5.Users.update.mockResolvedValue(1);
        await gainMoney(25, 'u');
        expect(sql5.Users.update).toHaveBeenCalledWith({ money: 125 }, { where: { uuid: 'u' } });
    });

    test('getBalance uses findAll with money attribute', async () => {
        sql5.Users.findOne.mockResolvedValue({ money: 42 });
        const out = await getBalance('u');
        expect(sql5.Users.findOne).toHaveBeenCalledWith({ attributes: ['money'], where: { uuid: 'u' } });
        expect(out).toEqual(42);
    });

    test('getAllShares filters by owner and portfolio when provided / not provided', async () => {
        sql5.Shares.findAll.mockResolvedValueOnce([{ id: 1 }]);
        await expect(getAllShares('u', 'p')).resolves.toEqual([{ id: 1 }]);
        expect(sql5.Shares.findAll).toHaveBeenLastCalledWith({ where: { owner_uuid: 'u', portfolio_uuid: 'p' } });

        sql5.Shares.findAll.mockResolvedValueOnce([{ id: 2 }]);
        await expect(getAllShares('u', '')).resolves.toEqual([{ id: 2 }]);
        expect(sql5.Shares.findAll).toHaveBeenLastCalledWith({ where: { owner_uuid: 'u' } });
    });

    test('getAllLogs returns all logs for owner', async () => {
        sql5.TransactionLog.findAll.mockResolvedValue([{ id: 3 }]);
        const out = await getAllLogs('u');
        expect(sql5.TransactionLog.findAll).toHaveBeenCalledWith({ where: { owner_uuid: 'u' } });
        expect(out).toEqual([{ id: 3 }]);
    });

    test('getUserPreferedCurrencyUUID returns prefered_currency', async () => {
        sql5.Users.findOne.mockResolvedValue({ prefered_currency: 'gbp' });
        const out = await getUserPreferedCurrencyUUID('u');
        expect(out).toBe('gbp');
    });
});