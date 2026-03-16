const portfolioModel = require("../models/portfolioModels");

///////////////////////////////////////////////////////////////////
//These handle all controller functions related to user portfolio//
///////////////////////////////////////////////////////////////////

///////////Portfolio Basics///////////

/*
    Gets all portfolios of a user
    GET /user/portfolio
    Auth: Required
    @return {Array} - An array of the users portfolios
*/
async function getUsersPortfolio(req, res) {
    try {
        //Get portfolios
        const portfolios = await portfolioModel.getPortfolio(req.user);
        res.status(200).json(portfolios);
        return;
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error returning users portfolios:", err);
        return;
    }
}

/*
    Creates a new portfolio
    POST /user/portfolio
    Auth: Required
    @body {string} name - The name of the portfolio
    @body {boolean} isDefault - Whether the portfolio is the default portfolio
    @return {string} - A message indicating success or failure
*/
async function createPortfolio(req, res) {
    const {name, isDefault} = req.body;                                              //Get info from body
    const owner_uuid = req.user.uuid;                                                //Get owner uuid from authentication
    const prefered_currency = portfolioModel.getUserPreferedCurrency(req.user)[0];   //Get currency from user info
    try {
        //Create the portfolio
        const result = await portfolioModel.createPortfolio(name, owner_uuid, prefered_currency, isDefault);
        res.status(201).json({message: "Portfolio Created"});
        return;
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error creating portfolio: ", err);
        return;
    }
}

/*
    Modify a portfolio
    PATCH /user/portfolio/update
    Auth: Required
    @body {string} name - The new name of the portfolio
    @body {boolean} isDefault - Whether the portfolio is the default portfolio
    @body {string} portfolio_uuid - The unique uuid of the portfolio to be modified
    @return {string} - A message indicating success or failure
*/
async function modifyPortfolio(req, res) {
    const {name, isDefault, portfolio_uuid} = req.body; //Get info from body
    const owner_uuid = req.user.uuid                    //Get user uuid from authentication
    try {
        //Update portfolio
        const update = await portfolioModel.updatePortfolio(name, isDefault, portfolio_uuid, owner_uuid);
        res.status(200).json({message: "Portfolio updated successfully"});
        return;
    }
    catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error updating portfolio: ", err);
        return;
    }
}

/*
    Delete a portfolio
    DELETE /user/portfolio/:portfolio_uuid
    Auth: Required
    @params {string} portfolio_uuid - The unique uuid of the portfolio to be deleted
    @return {string} - A message indicating success or failure
*/
async function deletePortfolio(req, res) {
    const portfolio_uuid = req.params.portfolio_uuid;   //Get info from params
    const owner_uuid = req.user.uuid;                   //Get user uuid from authentication
    try {
        //Verify that the portfolio is empty (cannot delete if not empty)
        if(await portfolioModel.checkIfPortfolioEmpty(portfolio_uuid, owner_uuid)) {
            //Delete portfolio
            await portfolioModel.deletePortfolio(portfolio_uuid, owner_uuid);
            res.status(200).json({message: "Portfolio deleted successfully"});
        }
        else {
            res.status(400).json({error: "Portfolio is not empty"});
            return;
        };
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error deleteing portfolio: ", err);
        return;
    }
}

///////////Portfolio Value///////////

/*
    Get the total raw value of a portfolio
    GET /user/portfolio/value/:portfolio_uuid
    Auth: Required
    @params {string} portfolio_uuid - The unique uuid of the portfolio to get the value of
    @return {number} - The total raw value of the portfolio
*/
async function getPortfolioValue(req, res) {
    const portfolio_uuid = req.params.portfolio_uuid;   //Get info from params
    const owner_uuid = req.user.uuid;                   //Get user uuid from authentication
    try {
        //Get portfolio value
        let value = await portfolioModel.getPortfolioValue(portfolio_uuid, owner_uuid);
        res.status(200).json({value: value});
        return;
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error getting portfolio value:", err);
        return;
    }
}

/*
    Get the total raw return of a portfolio
    GET /user/portfolio/return/:portfolio_uuid
    Auth: Required
    @params {string} portfolio_uuid - The unique uuid of the portfolio to get the return of
    @return {number} - The total raw return of the portfolio
*/
async function getPortfolioReturn(req, res) {
    const portfolio_uuid = req.params.portfolio_uuid;       //Get info from params
    const owner_uuid = req.user.uuid;                       //Get user uuid from authentication
    try {
        //Get portfolio return value
        let value = await portfolioModel.getPortfolioReturn(portfolio_uuid, owner_uuid);
        res.status(200).json({value: value});
        return;
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error getting portfolio return:", err);
        return;
    }
}

/*
    Get the total return percentage of a portfolio
    GET /user/portfolio/return/percentage/:portfolio_uuid
    Auth: Required
    @params {string} portfolio_uuid - The unique uuid of the portfolio to get the return percentage of
    @return {number} - The total return percentage of the portfolio
*/
async function getPortfolioReturnPercentage(req, res) {
    const portfolio_uuid = req.params.portfolio_uuid;       //Get info from params
    const owner_uuid = req.user.uuid;                       //Get user uuid from authentication
    try {
        //Get portfolio return percentage
        let value = await portfolioModel.getPortfolioReturnPercentage(portfolio_uuid, owner_uuid);
        res.status(200).json({value: value});
        return;
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error getting portfolio return percentage:", err);
        return;
    }
}
module.exports = {
    //Portfolio Basics//
    getUsersPortfolio,
    createPortfolio,
    modifyPortfolio,
    deletePortfolio,

    //Portfolio Value//
    getPortfolioValue,
    getPortfolioReturn,
    getPortfolioReturnPercentage
}