const sql = require("../config/sql");
const axios = require("axios");
const YahooFinance = require("yahoo-finance2").default;
const userModels = require("./userModels");
const middlewareModels = require("./middlewareModels");

//////////////////////////////////////////////////////////////////
//These handle all model functions related to buying and selling//
//////////////////////////////////////////////////////////////////

///////////Helper Functions///////////

/*
    Get the user's current money balance
    @param {string} uuid - The user's unique identifier
    @returns {number} - The user's current money balance
*/
async function getUserMoney(uuid) {
    try {
        let user = await (sql.Users).findOne({
            attributes: ['money'],
            where: {uuid: uuid}
        });
        return user.money;
    }
    catch (err) {
        console.error("Error getting user money:", err);
        return;
    }
}



///////////Verify Functions///////////

/*
    Verify if a stock exists in the user's portfolio
    @param {string} tag - The stock's unique identifier
    @param {string} uuid - The user's unique identifier
    @param {string} portfolio_uuid - The portfolio's unique identifier
    @returns {boolean} - Whether the stock exists in the portfolio
*/
async function verifyStock(tag, uuid, portfolio_uuid) {
    try {
        //Search stocks if any have the right portfolio UUID
        let stock = await (sql.Shares).findAll({
            attributes: ['portfolio_uuid'],
            where: {owner_uuid: uuid, tag: tag, portfolio_uuid: portfolio_uuid}
        });
        //Return result
        if(stock.length > 0) return true;
        else return false;
    } catch (err) {
        console.error("Error getting portfolios:", err);
        return;
    }
}

/*
    Verify and modifies the price of stock the user is selling to make sure
    its not more than they own
    @param {string} tag - The stock's unique identifier
    @param {string} uuid - The user's unique identifier
    @param {string} portfolio_uuid - The portfolio's unique identifier
    @param {number} amount - The total price of stock to buy/sell
    @returns {number} - The verified stock price
*/
async function verifyStockPrice(tag, uuid, portfolio_uuid, amount) {
    try {
        //Get the desired stock
        let stockPrice = await (sql.Shares).findAll({
            attributes: ['total_value'],
            where: {owner_uuid: uuid, tag: tag, portfolio_uuid: portfolio_uuid}
        });
        //Verify amount currently owned
        if( amount > stockPrice) {
            return stockPrice;
        }
        else {
            return amount;
        }
    } catch (err) {
        console.error("Error verifying price: ", err);
        return;
    }
}

/*
    Verify and modifies the amount of stock the user is selling to make sure
    its not more than they own
    @param {string} tag - The stock's unique identifier
    @param {string} uuid - The user's unique identifier
    @param {string} portfolio_uuid - The portfolio's unique identifier
    @param {number} amount - The amount of stock to buy/sell
    @returns {number} - The verified stock amount
*/
async function verifyStockAmount(tag, uuid, portfolio_uuid, amount) {
    try {
        //Get the desired stock
        let stockAmount = await (sql.Shares).findAll({
            attributes: ['amount_owned'],
            where: {owner_uuid: uuid, tag: tag, portfolio_uuid: portfolio_uuid}
        });
        //Verify amount currently owned
        if( amount > stockAmount.amount_owned) {
            console.log("Amount trying to sell is greater than amount owned, Adjusting...");
            return stockAmount.amount_owned;
        }
        else {
            return amount;
        }
    } catch (err) {
        console.error("Error verifying amount: ", err);
        return;
    }
}




///////////Buy And Sell///////////

/*
    Buy stock
    @param {string} tag - The stock's unique identifier
    @param {number} cost - The total cost of the stock (not amount at the same time)
    @param {number} amount - The amount of stock to buy (not cost at the same time)
    @param {string} owner_uuid - The user's unique identifier
    @param {string} portfolio_uuid - The portfolio's unique identifier
    @returns {Promise} - The result of the buy operation
*/
async function buyStock(tag, cost, amount, owner_uuid, portfolio_uuid) {
    try {
        //Check if user already owns some of that stock
        let stock = await (sql.Shares).findOne({
            where: {tag: tag, owner_uuid: owner_uuid, portfolio_uuid: portfolio_uuid}
        });
        //If user already owns some stock from there
        if(stock) {
            //Increase investment and amount owned
            var newInvestment = stock.total_invested + cost;
            var newAmount = stock.amount_owned + amount;
            try {
                //Update the stock information
                let update = await (sql.Shares).update(
                    { total_invested: newInvestment, amount_owned:newAmount },
                    { where: {id: stock.id} }
                );
                try{
                    //Update portfolio
                    return await middlewareModels.updatePortfolioValue(stock.portfolio_uuid);
                } catch (err) {
                    console.error("Error updating portfolio: ", err);
                    return;
                }
            } catch (err) {
                console.error("Error updating shares tables: ", err);
                return;
            }
        }
    } catch(err) {
        console.error("Error buying more stocks: ", err);
        return;
    }
    //User does not already own that stock
    try {
        //Get info and create stock object
        const result = await YahooFinance.quote(tag);
        const searchResult = await YahooFinance.search(tag);
        const currentValue = parseFloat(result.bid) * amount;
        const share = {
            tag: tag,
            portfolio_uuid: portfolio_uuid,
            owner_uuid: owner_uuid,
            name: searchResult.quotes[0].shortname,
            current_ask: result.ask,
            current_bid: result.bid,
            amount_owned: amount,
            total_invested: cost,
            total_value: currentValue,
            currency: await userModels.getUserPreferedCurrencyUUID(owner_uuid),
            closed: false
        }
        return await (sql.Shares).create(share);
    } catch (err) {
        console.error("Error buying share:", err);
        return;
    }
}

/*
    Sell stock
    @param {string} tag - The stock's unique identifier
    @param {string} uuid - The user's unique identifier
    @param {string} portfolio_uuid - The portfolio's unique identifier
    @param {number} stockAmount - The amount of stock to sell
    @returns {Promise} - The result of the sell operation
*/
async function sellStock(tag, uuid, portfolio_uuid, stockAmount) {
    try {
        //Find stock
        let stock = await (sql.Shares).findOne({
            attributes: ['amount_owned'],
            where: {owner_uuid: uuid, tag: tag, portfolio_uuid: portfolio_uuid}
        });
        //If user is selling all of their stock
        if(stock.amount_owned == stockAmount) {
            let destroy = await (sql.Shares).destroy({
                where: {owner_uuid: uuid, tag: tag, portfolio_uuid: portfolio_uuid}
            });
            return await middlewareModels.updatePortfolioValue(stock.portfolio_uuid);
        }
        //User is selling part of their stock
        else {
            //Use percentage sold to re-adjust the amount invested
            let percentSold = 1 - (stockAmount/stock.amount_owned);
            let newStock = await (sql.Shares).findOne({
                attributes: ['total_invested'],
                where: {owner_uuid: uuid, tag: tag, portfolio_uuid: portfolio_uuid}
            });
            //Adjust the other values
            let newValueIn = newStock.total_invested * percentSold;
            let amountLeft = stock.amount_owned - stockAmount;
            let update = await (sql.Shares).update(
                { amount_owned: amountLeft, total_invested:  newValueIn},
                { where: {owner_uuid: uuid, tag: tag, portfolio_uuid: portfolio_uuid }}
            );
            return await middlewareModels.updatePortfolioValue(stock.portfolio_uuid);
        }
    } catch (err) {
        console.error("Error verifying amount: ", err);
        return;
    }
}




///////////Logging///////////

/*
    Log a buy or sell transaction
    @param {boolean} sell - Whether the transaction is a sell (true) or buy (false)
    @param {number} amount - The total amount of money involved in the transaction
    @param {number} stockAmount - The amount of stock bought or sold
    @param {number} price_per - The price per unit of stock
    @param {string} currency - The currency used in the transaction
    @param {string} tag - The stock's unique identifier
    @param {string} portfolio_uuid - The portfolio's unique identifier
    @param {string} owner_uuid - The user's unique identifier
    @returns {Promise} - The result of the logging operation
*/
async function logTransaction(sell, amount, stockAmount, price_per, currency, tag, portfolio_uuid, owner_uuid) {
    //Set buy or sell string
    let buy_or_sell;
    if(sell) buy_or_sell = "sell";
    else buy_or_sell = "buy";
 
    const newLog = {
        buy_sell: buy_or_sell,
        amount: amount,
        stock_traded: stockAmount,
        price_per: price_per,
        currency: currency,
        stock_tag: tag,
        portfolio_uuid: portfolio_uuid,
        owner_uuid: owner_uuid
    };
    try {
        return await (sql.TransactionLog).create(newLog);
    }
    catch (err) {
        console.error("Error logging transaction: ", err);
        return;
    }
}

module.exports = {
    //Helper Functions//
    getUserMoney,

    //Verify Functions//
    verifyStock,
    verifyStockPrice,
    verifyStockAmount,

    //Buy And Sell//
    buyStock,
    sellStock,

    //Logging//
    logTransaction
}