const middlewareModel = require("../models/middlewareModels");

///////////////////////////////////////////////////////////////////
//These handle all controller functions related to the middleware//
///////////////////////////////////////////////////////////////////

/*
    This function converts currency from one type to another
    POST /convert
    @body {number} amount - The amount of money to convert
    @body {string} fromCurrency - The currency of which the money is currently in
    @body {string} toCurrency - The currency of which the money would like to be in
    @return {number} - The amount of money in the target currency
*/
async function convertCurrency(req, res) {
    const { amount, fromCurrency, toCurrency } = req.body;                                  //Get info from body
    try {
        let convertedAmount = await middlewareModel.convertCurrency(amount, fromCurrency, toCurrency);    //Convert currency
        res.status(200).json({amount: convertedAmount});
        return;
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error converting currency: ", err);
        return;
    }
}


/*
    This function cleans the database by removing all data (Admin use only!!!)
    Legal Notice: Misuse of this function can lead to severe legal consequences
    GET /clean
    Auth: Required Admin Only
    @return {string} - A message indicating the success or failure of the operation
*/
async function cleanDB(req, res) {
    try {
        //Scrub it all
        await middlewareModel.cleanDb();
        res.status(200).json({message: "Database cleaned successfully"});
        return;
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error cleaning database: ", err);
        return;
    }
}

/*
    This function updates all stock prices in the database and portfolios
    GET /sync
    @return {object} - The response from updating all stocks
*/
async function updateAll(req, res) {
    //Updates everything
    try {
        let response = await middlewareModel.updateAllStocks();
        res.status(200).json(response);
        return;
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.error("Error updating stocks: ", err);
        return;
    }
}

module.exports = {
    convertCurrency,
    cleanDB,
    updateAll
}