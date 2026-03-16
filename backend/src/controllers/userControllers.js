const userModel = require("../models/userModels");
const middlewareModel = require("../models/middlewareModels");

/////////////////////////////////////////////////////////////
//These handle all controller functions related to the user//
/////////////////////////////////////////////////////////////

///////////User Info///////////

/*
    Get the user's first name
    GET /user/fname
    Auth: Required
    @return {string} - The user's first name
*/
async function getFirstName(req, res) {
    const owner_uuid = req.user.uuid;           //Get uuid from authentication
    try {
        //Get first name
        const firstName = await userModel.getFirstName(owner_uuid);
        res.status(200).json(firstName);
        return;
    }
    catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error getting first name: ", err);
        return;
    }
}

/*
    Get the user's last name
    GET /user/lname
    Auth: Required
    @return {string} - The user's last name
*/
async function getLastName(req, res) {
    const owner_uuid = req.user.uuid;           //Get uuid from authentication
    try {
        //Get last name
        const lastName = await userModel.getLastName(owner_uuid);
        res.status(200).json(lastName);
        return;
    }
    catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error getting last name: ", err);
        return;
    }
}

/*
    Get the user's full name
    GET /user/name
    Auth: Required
    @return {string} - The user's full name
*/
async function getFullName(req, res) {
    const owner_uuid = req.user.uuid;           //Get uuid from authentication
    try {
        //Get full name
        const fullName = await userModel.getFullName(owner_uuid);
        res.status(200).json(fullName);
        return;
    }
    catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error getting full name: ", err);
        return;
    }
}


///////////User Money///////////

/*
    Deposit money into the user's account
    POST /user/deposit
    Auth: Required
    @body {number} amount - The amount of money to deposit
    @return {string} - A message indicating success or failure
*/
async function depositMoney(req, res) {
    const amount = parseFloat(req.body.amount);         //Get amount from body
    const owner_uuid = req.user.uuid;                   //Get uuid from authentication
    try {
        //Deposit the money
        const result = await userModel.gainMoney(amount, owner_uuid);
        res.status(200).json({message: "Money Deposited"});
        return;
    }
    catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error depositing money: ", err);
        return;
    }
}

/*
    Withdraw money from the user's account
    POST /user/withdraw
    Auth: Required
    @body {number} amount - The amount of money to withdraw
    @return {string} - A message indicating success or failure
*/
async function withdrawMoney(req, res) {
    const amount = req.body.amount;         //Get amount from body
    const owner_uuid = req.user.uuid;       //Get uuid from authentication
    try {
        //Withdraw the money
        const result = await userModel.spendMoney(amount, owner_uuid);
        res.status(200).json({message: "Money Withdrawn"});
        return;
    }
    catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error withdrawing money: ", err);
        return;
    }
}

/*
    Get the user's account balance
    GET /user/balance
    Auth: Required
    @return {number} - The user's account balance
*/
async function getBalance(req, res) {
    const owner_uuid = req.user.uuid;       //Get uuid from authentication
    try {
        //Get the balance
        const balance = await userModel.getBalance(owner_uuid);
        res.status(200).json(balance);
        return;
    }
    catch (err) {
        res.status(500).json({error: "Internal Server Error"})
        console.error("Error getting balance: ", err);
        return;
    }
}

///////////Shares and Logs///////////

/*
    Get all shares for a user's portfolio
    GET /user/shares/:portfolio_uuid
    Auth: Required
    @params {string} portfolio_uuid - The unique uuid of the portfolio to get shares from
    @return {object} - An array of share objects
*/
async function getShares(req, res) {
    const owner_uuid = req.user.uuid;                   //Get uuid from authentication
    const portfolio_uuid = req.params.portfolio_uuid;   //Get portfolio uuid from params
    try {
        const result = await userModel.getAllShares(owner_uuid, portfolio_uuid)       //Get all shares
        res.status(200).json(result);
        return;
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"})
        console.error("Error getting shares: ", err);
        return;
    }
}

/*
    Get all transaction logs for a user's account
    GET /user/logs
    Auth: Required
    @return {object} - An array of log objects
*/
async function getLogs(req, res) {
    const owner_uuid = req.user.uuid;                   //Get uuid from authentication
    try {
        const logs = await userModel.getAllLogs(owner_uuid);
        res.status(200).json(logs);
        return;
    }
    catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error getting logs: ", err);
        return;
    }
}




///////////Change Preferred Currency///////////

/*
    Change the user's preferred currency
    POST /user/currency
    Auth: Required
    @body {string} currency - The new preferred currency of the user
    @return {string} - A message indicating success or failure
*/
async function changePreferredCurrency(req, res) {
    const owner_uuid = req.user.uuid;
    const currency = req.body.currency;
    try {
        const update = await middlewareModel.updatePreferredCurrency(currency, owner_uuid);
        res.status(200).json({message: "Updated Currency Successfully"});
        return;
    } catch(err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error updaing currency");
        return;
    }
}

/*
    Update all portfolios for the current user (separate endpoint for background updates)
    POST /user/update-portfolios
    Auth: Required
    @return {string} - A message indicating success or failure
*/
async function updateUserPortfolios(req, res) {
    const owner_uuid = req.user.uuid;
    try {
        const update = await middlewareModel.updateOwnersPortfolios(owner_uuid);
        res.status(200).json({message: "Portfolios updated successfully"});
        return;
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error updating user portfolios: ", err);
        return;
    }
}

module.exports = {
    //User Info//
    getFirstName,
    getLastName,
    getFullName,

    //User Money//
    depositMoney,
    withdrawMoney,
    getBalance,

    //Shares and Logs//
    getShares,
    getLogs,

    //Change Preferred Currency//
    changePreferredCurrency,

    //Portfolio Updates//
    updateUserPortfolios
}