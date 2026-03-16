jest.mock('../../src/models/userModels', () => ({
    getFirstName: jest.fn(),
    getLastName: jest.fn(),
    getFullName: jest.fn(),
    gainMoney: jest.fn(),
    spendMoney: jest.fn(),
    getBalance: jest.fn(),
    getAllShares: jest.fn(),
    getAllLogs: jest.fn(),
}));
const userModel = require('../../src/models/userModels');


jest.mock('../../src/models/middlewareModels', () => ({ updateOwnersPortfolios: jest.fn(), updatePreferredCurrency: jest.fn() }));
const middlewareModel = require('../../src/models/middlewareModels');


const userCtrl = require('../../src/controllers/userControllers');


describe('userControllers', () => {
    beforeEach(() => jest.clearAllMocks());
    const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });


    test('getFirstName / getLastName / getFullName -> 200', async () => {
        userModel.getFirstName.mockResolvedValue({ fname: 'A' });
        userModel.getLastName.mockResolvedValue({ lname: 'B' });
        userModel.getFullName.mockResolvedValue({ fname: 'A', lname: 'B' });

        const r1 = res();
        await userCtrl.depositMoney({ body: { amount: 100 }, user: { uuid: 'u' } }, r1);
        expect(userModel.gainMoney).toHaveBeenCalledWith(100, 'u');
        expect(r1.status).toHaveBeenCalledWith(200);
        expect(r1.json).toHaveBeenCalledWith({ message: 'Money Deposited' });


        const r2 = res();
        await userCtrl.withdrawMoney({ body: { amount: 30 }, user: { uuid: 'u' } }, r2);
        expect(userModel.spendMoney).toHaveBeenCalledWith(30, 'u');
        expect(r2.status).toHaveBeenCalledWith(200);
        expect(r2.json).toHaveBeenCalledWith({ message: 'Money Withdrawn' });
    });


    test('getBalance -> 200', async () => {
        userModel.getBalance.mockResolvedValue([{ money: 42 }]);
        const r = res();
        await userCtrl.getBalance({ user: { uuid: 'u' } }, r);
        expect(userModel.getBalance).toHaveBeenCalledWith('u');
        expect(r.status).toHaveBeenCalledWith(200);
        expect(r.json).toHaveBeenCalledWith([{ money: 42 }]);
    });


    test('getShares -> 200 list', async () => {
        userModel.getAllShares.mockResolvedValue([{ id: 1 }]);
        const r = res();
        await userCtrl.getShares({ user: { uuid: 'u' }, params: { portfolio_uuid: 'p' } }, r);
        expect(userModel.getAllShares).toHaveBeenCalledWith('u', 'p');
        expect(r.status).toHaveBeenCalledWith(200);
        expect(r.json).toHaveBeenCalledWith([{ id: 1 }]);
    });


    test('getLogs -> 200 list', async () => {
        userModel.getAllLogs.mockResolvedValue([{ id: 3 }]);
        const r = res();
        await userCtrl.getLogs({ user: { uuid: 'u' } }, r);
        expect(userModel.getAllLogs).toHaveBeenCalledWith('u');
        expect(r.status).toHaveBeenCalledWith(200);
        expect(r.json).toHaveBeenCalledWith([{ id: 3 }]);
    });


    test('changePreferredCurrency -> 200 ok', async () => {
        middlewareModel.updatePreferredCurrency.mockResolvedValue('ok');
        const r = res();
        await userCtrl.changePreferredCurrency({ user: { uuid: 'u' }, body: { currency: 'gbp' } }, r);
        expect(middlewareModel.updatePreferredCurrency).toHaveBeenCalledWith('gbp', 'u');
        expect(r.status).toHaveBeenCalledWith(200);
        expect(r.json).toHaveBeenCalledWith({ message: 'Updated Currency Successfully' });
    });
});