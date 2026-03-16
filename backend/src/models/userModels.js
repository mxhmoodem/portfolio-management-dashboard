const sql = require("../config/sql");

////////////////////////////////////////////////////////
//These handle all model functions related to the user//
////////////////////////////////////////////////////////

///////////Name Getters///////////

/*
    Get the user's first name
    @param {string} uuid - The UUID of the user
    @returns {Promise<string>} - The user's first name
*/
async function getFirstName(uuid) {
    try {
        return await (sql.Users).findOne({
            attributes: ['fname'],
            where: {uuid: uuid}
        });
    } catch (err) {
        console.error("Error getting first name: ", err)
        return;
    }
}

/*
    Get the user's last name
    @param {string} uuid - The UUID of the user
    @returns {Promise<string>} - The user's last name
*/
async function getLastName(uuid) {
    try {
        return await (sql.Users).findOne({
            attributes: ['lname'],
            where: {uuid: uuid}
        });
    } catch (err) {
        console.error("Error getting last name: ", err)
        return;
    }
}

/*
    Get the user's full name
    @param {string} uuid - The UUID of the user
    @returns {Promise<string>} - The user's full name
*/
async function getFullName(uuid) {
    try {
        return await (sql.Users).findOne({
            attributes: ['fname', 'lname'],
            where: {uuid: uuid}
        });
    } catch (err) {
        console.error("Error getting full name: ", err)
        return;
    }
}




///////////Money Functions///////////

/*
    Spend money from the user's account
    @param {number} amount - The amount of money to spend
    @param {string} uuid - The UUID of the user
    @returns {Promise<void>}
*/
async function spendMoney(amount, uuid) {
    try {
        //Get current money
        let user = await (sql.Users).findOne({
            attributes: ['money'],
            where: {uuid: uuid}
        });

        //Adjust money
        let money = user.money;
        money -= amount;

        //Update money
        try {
            return await (sql.Users).update(
                { money: money },
                { where: {uuid: uuid} }
            );
        } catch (err) {
            console.error("Error updating money:", err);
            return;
        }
    } catch (err) {
        console.error("Error spending money:", err);
        return;
    }
}

/*
    Add money to the user's account
    @param {number} amount - The amount of money to gain
    @param {string} uuid - The UUID of the user
    @returns {Promise<void>}
*/
async function gainMoney(amount, uuid) {
    try {
        //Get current money
        let user = await (sql.Users).findOne({
            attributes: ['money'],
            where: {uuid: uuid}
        });

        //Adjust money
        let money = user.money;
        money += amount;

        //Update money
        try {
            return await (sql.Users).update(
                { money: money },
                { where: {uuid: uuid} }
            );
        } catch (err) {
            console.error("Error updating money:", err);
            return;
        }
    } catch (err) {
        console.error("Error spending money:", err);
        return;
    }
}




///////////Getter Functions///////////

/*
    Get the user's balance
    @param {string} uuid - The UUID of the user
    @returns {Promise<number>} - The user's balance
*/
async function getBalance(uuid) {
    try {
        let user = await (sql.Users).findOne({
            attributes: ['money'],
            where: {uuid: uuid}
        });
        if(!user) {
            console.error("Error getting user money: ", err);
            return;
        }
        return user.money;
    } catch (err) {
        console.error("Error getting balance: ", err);
        return;
    }
}

/*
    Get all shares for a user in a portfolio
    @param {string} owner_uuid - The UUID of the user
    @param {string} portfolio_uuid - The UUID of the portfolio
    @returns {Promise<Array>} - An array of shares
*/
async function getAllShares(owner_uuid, portfolio_uuid) {
    //Fallback incase portfolio isnt there
    if(portfolio_uuid != "") {
        try {
            //Get all users shares
            return await (sql.Shares).findAll({
                where: {owner_uuid: owner_uuid, portfolio_uuid: portfolio_uuid}
            });
        } catch (err) {
            console.error("Error getting portfolio shares: ", err);
            return;
        }
    }
    //Get all shares in a portfolio
    else {
        try {
            return await (sql.Shares).findAll({
                where: {owner_uuid: owner_uuid}
            });
        } catch (err) {
            console.error("Error getting all users shares: ", err);
            return;
        }
    }
}

/*
    Get all transaction logs for a user
    @param {string} owner_uuid - The UUID of the user
    @returns {Promise<Array>} - An array of transaction logs
*/
async function getAllLogs(owner_uuid) {
    try {
        return await (sql.TransactionLog).findAll({
           where: {owner_uuid: owner_uuid}
        });
    } catch (err) {
        console.error("Error getting transaction logs: ", err);
        return;
    }
}

/*
    Get the user's preferred currency UUID
    @param {string} uuid - The UUID of the user
    @returns {Promise<string>} - The user's preferred currency UUID
*/
async function getUserPreferedCurrencyUUID(uuid) {
    try {
        let user = await (sql.Users).findOne({
            attributes: ['prefered_currency'],
            where: {uuid : uuid}
        });
        return user.prefered_currency;
    }
    catch (err) {
        console.error("Error getting user's prefered currency: ", err);
        return;
    }
}

module.exports = {
    //Name Getters//
    getFirstName,
    getLastName,
    getFullName,

    //Money Functions//
    spendMoney,
    gainMoney,

    //Getter Functions//
    getBalance,
    getAllShares,
    getAllLogs,
    getUserPreferedCurrencyUUID
};