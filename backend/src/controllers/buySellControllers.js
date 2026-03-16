const portfolioModel = require("../models/portfolioModels");
const middlewareModel = require("../models/middlewareModels");
const buySellModel = require("../models/buySellModels");
const userModel = require("../models/userModels");
const YahooFinance = require("yahoo-finance2").default;

///////////////////////////////////////////////////////////////////////
//These handle all controller functions related to buying and selling//
///////////////////////////////////////////////////////////////////////

/*
    Function to buy stocks
    POST /buy/:tag
    Auth: Required
    @param {string} tag - The stock tag to buy
    @body {number} stockAmount - The amount of stock to buy (can be null if priceAmount is defined)
    @body {number} priceAmount - The amount of money to spend buying the stock (can be null if stockAmount is defined)
    @body {string} currency - The currency the user is using to buy the stock
    @body {string} portfolio_uuid - (Optional) The uuid of the portfolio to buy the stock into (if not defined, will use default portfolio)
    @return {string} - A message confirming the stock was bought
*/
async function buyStocks(req, res) {
    const tag = req.params.tag;                                             //Get the stock
    const owner_uuid = req.user.uuid;                                       //Get the user
    var {stockAmount, priceAmount, currency, portfolio_uuid} = req.body;    //Get other info
    //Validate info (can have EITHER stock amount to buy or price to buy)
    if((stockAmount && priceAmount) || (!stockAmount && !priceAmount)) {
        res.status(400).json({error: "Please input either stock amount or price amount"});
        return;
    }
    //Verify the user actually has a protfolio to buy to
    try {
        if(!(await portfolioModel.hasAPortfolio(owner_uuid))) {
            res.status(400).json({error: "No portfolio!"});
            return;
        }
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.log("Error getting portfolios: ", err);
        return;
    }
    //Get financial info from Yahoo
    let result;
    let searchResult;
    try {
        result = await YahooFinance.quote(tag);
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.log("Error getting stock info: ", err);
        return;
    }
    try {
        searchResult = await YahooFinance.search(tag);
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.log("Error getting stock info: ", err);
        return;
    }

    if((result.ask == 0 || result.ask == undefined) && (result.bid == 0 || result.bid == undefined)){
        res.status(400).json({error: "Market Closed"});
        return;
    }

    //If no portfolio defined, get default one
    if(!portfolio_uuid || portfolio_uuid == "") {
        try {
            portfolio_uuid = await portfolioModel.getDefaultPortfolio(owner_uuid)
        } catch (err) {
            res.status(500).json({error: "Internal Server Error"});
            console.log("Error getting portfolios: ", err);
            return;
        }
    }

    var stockPrice = result.ask;                        //Get stocks current price
    let buyCurrency = (result.currency).toLowerCase()   //Get stocks current currency
    //If stocks currency and your curreny doesn't match up, we need to convert
    if(buyCurrency != currency)
    {
       stockPrice = await middlewareModel.convertCurrency(result.ask, buyCurrency, currency);
    }

    //If user said to buy X amount of stocks, get the price of that
    if(stockAmount) {
        priceAmount = stockPrice * stockAmount;
    }
    //If user said to buy X money worth of stock, get amount of stock of that
    else {
        stockAmount = priceAmount / stockPrice;
    }
    //Check the user has enough money to buy it
    if(priceAmount > await buySellModel.getUserMoney(owner_uuid)) {
        res.status(400).json({error: "Not enough money"});
        return;
    }

    try {
        //Buy the stock
        await buySellModel.buyStock(tag, priceAmount, stockAmount, owner_uuid, portfolio_uuid)
        try {
            //Spend the momney
            await userModel.spendMoney(priceAmount, owner_uuid)
            //Log transaction
            const log = await buySellModel.logTransaction(false, priceAmount, stockAmount, stockPrice, currency, tag, portfolio_uuid, owner_uuid);
            res.status(200).json({message: `Bought ${stockAmount} shares for ${priceAmount} ${currency} of ${searchResult.quotes[0].shortname} at ${stockPrice} ${currency} per share`});
        } catch (err) {
            res.status(500).json({error: "Internal Server Error"});
            console.log("Unable to spend money: ", err);
            return;
        }
    }   
    catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.log("Unable to buy stocks: ", err);
        return;
    }
}

/*
    Function to sell stocks
    POST /sell/:tag
    Auth: Required
    @param {string} tag - The stock tag to sell
    @body {number} stockAmount - The amount of stock to sell (can be null if priceAmount is defined)
    @body {number} priceAmount - The amount of money to gain from selling the stock (can be null if stockAmount is defined)
    @body {string} currency - The currency the user is using to sell the stock
    @body {string} portfolio_uuid - (Optional) The uuid of the portfolio to sell the stock from (if not defined, will use default portfolio or find the only portfolio with that stock)
    @return {string} - A message confirming the stock was sold
*/
async function sellStocks(req, res) {
    const tag = req.params.tag;                                             //Get the stock
    const owner_uuid = req.user.uuid;                                       //Get the user
    let {stockAmount, priceAmount, currency, portfolio_uuid} = req.body;    //Get other info

    //Validate info (can have EITHER stock amount to buy or price to buy)
    if((stockAmount && priceAmount) || (!stockAmount && !priceAmount)) {
        res.status(400).json({error: "Please input either stock amount or price amount"});
        return;
    }
    //Verify the user actually has a protfolio to sell from
    try {
        const hasPortfolio = await portfolioModel.hasAPortfolio(owner_uuid);
        if(!hasPortfolio) {
            res.status(400).json({error: "No portfolio!"});
            return;
        }
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.log("Error getting portfolios: ", err);
        return;
    }
    //Get financial info from Yahoo
    let result;
    let searchResult;
    try {
        result = await YahooFinance.quote(tag);
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.log("Error getting stock info: ", err);
        return;
    }
    try {
        searchResult = await YahooFinance.search(tag);
    } catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.log("Error getting stock info: ", err);
        return;
    }

    if((result.ask == 0 || result.ask == undefined) && (result.bid == 0 || result.bid == undefined)){
        res.status(400).json({error: "Market Closed"});
        return;
    }

    //If portfolio not defined
    if(!portfolio_uuid || portfolio_uuid == "") {
        //Check if stock is in multiple portfolios, if so, we need the user to defined
        try {
            let portfolios = await portfolioModel.findStocksPortfolio(tag, owner_uuid);
            if(portfolios.length > 1) {
                res.status(400).json({error: "Stock is in multiple portfolios, please specify"})
                return;
            }
            else if(portfolios.length == 0) {
                res.status(400).json({error: "Stock not found in any portfolio"})
                return;
            }
            //Only in one portfolio then we can use that
            portfolio_uuid = portfolios[0];
        } catch (err) {
            res.status(500).json({error: "Internal Server Error"});
            console.log("Error getting portfolios: ", err);
            return;
        }
    }

    //Double validation, make sure that the stock is indeed in the portfolio (in case the user defined the portfolio)
    try {
        if(!(await buySellModel.verifyStock(tag, owner_uuid, portfolio_uuid))) {
            res.status(400).json({error: "Unable to verify stock"})
            return;
        }
    } catch (err) {
         res.status(500).json({error: "Internal Server Error"});
        console.log("Error verifying stocks: ", err);
        return;
    }

    let stockPrice = result.bid;                        //Get stocks current sell price
    let buyCurrency = (result.currency).toLowerCase()   //Get stocks currency
    //If stocks currency and your curreny doesn't match up, we need to convert
    if(buyCurrency != currency)
    {
       stockPrice = await middlewareModel.convertCurrency(result.bid, buyCurrency, currency);
    }

    //If user said to buy X amount of stocks, get the price of that
    if(stockAmount) {
        //If the user wants to sell more stocks than they have, we change the amount to be what they have
        try {
            stockAmount = await buySellModel.verifyStockAmount(tag, owner_uuid, portfolio_uuid, stockAmount);
        } catch (err) {
            res.status(500).json({error: "Internal Server Error"});
            console.log("Error verifying stock amount: ", err);
            return;
        }
        priceAmount = stockPrice * stockAmount;
    }
    //If user said to buy X money worth of stock, get amount of stock of that
    else {
        //If the user wants to sell for more money than the stock is worth, we change the amount to its worth
        try {
            priceAmount = await buySellModel.verifyStockPrice(tag, owner_uuid, portfolio_uuid, priceAmount);
        } catch (err) {
            res.status(500).json({error: "Internal Server Error"});
            console.log("Error verifying price amount: ", err);
            return;
        }
        stockAmount = priceAmount / stockPrice;
    }

    try {
        //Sell the stocks
        await buySellModel.sellStock(tag, owner_uuid, portfolio_uuid, stockAmount)
        try {
            //Give the user the money
            await userModel.gainMoney(priceAmount, owner_uuid)
            //Log transaction
            const log = await buySellModel.logTransaction(true, priceAmount, stockAmount, stockPrice, currency, tag, portfolio_uuid, owner_uuid);
            res.status(200).json({message: `Sold ${stockAmount} shares for ${priceAmount} ${currency} of ${searchResult.quotes[0].shortname} at ${stockPrice} ${currency} per share`});
        } catch (err) {
            res.status(500).json({error: "Internal Server Error"});
            console.log("Unable to gain money: ", err);
            return;
        }
    }   
    catch (err) {
        res.status(500).json({error: "Internal Server Error"});
        console.log("Unable to sell stocks: ", err);
        return;
    }
}

module.exports = {
    buyStocks,
    sellStocks
}