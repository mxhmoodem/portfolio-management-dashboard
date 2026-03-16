const sql = require("../config/sql");
const axios = require("axios");
const YahooFinance = require("yahoo-finance2").default;
const userModels = require("./userModels");

//////////////////////////////////////////////////////////////
//These handle all model functions related to the middleware//
//////////////////////////////////////////////////////////////

///////////Use Functions///////////

/*
    Converts the input currency into the target currency
    @param {number} amount - The amount of money to convert
    @param {string} current - The currency of which the money is currently in
    @param {string} target - The currency of which the money would like to be in
    @return {number} - The amount of money in the target currency
*/
async function convertCurrency(amount, current, target) {
    // Validate input parameters
    if (isNaN(amount) || !current || !target) {
        console.log('Invalid currency conversion parameters:', { amount, current, target });
        return;
    }

    // If amount is 0, return 0 without API call
    if (amount === 0 || parseFloat(amount) === 0) {
        return 0;
    }

    // If currencies are the same, return original amount
    if (current.toLowerCase() === target.toLowerCase()) {
        return parseFloat(amount);
    }

    let response;
    try {
        response = await axios.get(`https://2024-03-06.currency-api.pages.dev/v1/currencies/${current}.json`);
    }
    catch (err) {
        console.log('Error in currency conversion:', err);
        return;
    }
    const rate = response.data[current][target];
        
    // Validate the exchange rate
    if (!rate || isNaN(rate) || rate <= 0) {
        console.log('Invalid exchange rate received:', rate);
        return;
    }

    const returnAmount = parseFloat(amount) * parseFloat(rate);
        
    // Validate the result
    if (isNaN(returnAmount)) {
        console.log('Currency conversion resulted in NaN:', { amount, rate, returnAmount });
        return;
    }

    return returnAmount;
}

/*
    Completly cleans all of the databases
*/
async function cleanDb() {
    try {
        await (sql.Users).destroy({ where: {}, truncate: true });
    } catch (err) {
        console.error("Unable to clean Users table", err);
        return;
    }
    try {
        await (sql.Portfolio).destroy({ where: {}, truncate: true });
    } catch (err) {
        console.error("Unable to clean Portfolio table", err);
        return;
    }
    try {
        await (sql.Shares).destroy({ where: {}, truncate: true });
    } catch (err) {
        console.error("Unable to clean Shares table", err);
        return;
    }
    try {
        await (sql.TransactionLog).destroy({ where: {}, truncate: true });
    } catch (err) {
        console.error("Unable to clean TransactionLog table", err);
        return;
    }
    return;
}




///////////Update Functions///////////

/*
    Updates the values of a share based on latest information
    @param {number} share_id - The unique id number of the share in the Shares table
    @return {number} - The current total value of the share
*/
async function updateShareValue(share_id){
    let share;
    //Find the share
    try {
        share = await (sql.Shares).findOne({
            where: {id: share_id}
        });
    } catch(err) {
        console.error("Unable to get stock", err);
        return;
    }
    
    //Get up to date info
    let result;
    let userCurrency;
    try {
        result = await YahooFinance.quote(share.tag);
    } catch(err) {
        console.error("Error getting stock info from Yahoo: ", err);
        return;
    }

    try {
        userCurrency = await userModels.getUserPreferedCurrencyUUID(share.owner_uuid);
    } catch(err) {
        console.error("Error getting users prefered currency: ", err);
        return;
    }

    //Get currency and buy and sell prices
    let buyCurrency = (result.currency).toLowerCase()
    let ask = result.ask
    let bid = result.bid

    // Validate ask and bid values - ensure they are valid numbers
    if (!ask || isNaN(ask) || ask <= 0) {
        ask = share.ask || 0;
    }
    if (!bid || isNaN(bid) || bid <= 0) {
        bid = share.bid || 0;
    }

    let closed = false;

    if((ask == 0 || ask == undefined) && (bid == 0 || bid == undefined)) {
        closed = true;
        // Use stored values, but ensure they're valid numbers
        ask = share.ask && !isNaN(share.ask) ? share.ask : 0;
        bid = share.bid && !isNaN(share.bid) ? share.bid : 0;
    }

    //Convert currency if needed
    if(buyCurrency != userCurrency)
    {
        try {
            let convertedAsk = await convertCurrency(ask, buyCurrency, userCurrency);
            ask = (convertedAsk !== null && !isNaN(convertedAsk)) ? convertedAsk : ask;
        } catch(err) {
            console.error("Error converting ask currency: ", err);
            return;
        }
        try {
            let convertedBid = await convertCurrency(bid, buyCurrency, userCurrency);
            bid = (convertedBid !== null && !isNaN(convertedBid)) ? convertedBid : bid;
        } catch(err) {
            console.error("Error converting bid currency: ", err);
            return;
        }

        if(share.currency != userCurrency) {
            try {
                let convertedInvested = await convertCurrency(share.total_invested, share.currency, userCurrency);
                share.total_invested = (convertedInvested !== null && !isNaN(convertedInvested)) ? convertedInvested : share.total_invested;
            } catch(err) {
                console.error("Error converting invested currency: ", err);
                return;
            }
        }
    }

    // Ensure all values are valid numbers before calculation
    const validBid = (bid && !isNaN(bid)) ? parseFloat(bid) : 0;
    const validAmountOwned = (share.amount_owned && !isNaN(share.amount_owned)) ? parseFloat(share.amount_owned) : 0;
    const validTotalInvested = (share.total_invested && !isNaN(share.total_invested)) ? parseFloat(share.total_invested) : 0;
    const validAsk = (ask && !isNaN(ask)) ? parseFloat(ask) : 0;

    //Update the share
    let currentShareValue = validBid * validAmountOwned;
    
    // Final validation to ensure no NaN values are passed to database
    if (isNaN(currentShareValue)) {
        currentShareValue = 0;
    }
    if (isNaN(validTotalInvested)) {
        validTotalInvested = 0;
    }
    if (isNaN(validAsk)) {
        validAsk = 0;
    }
    if (isNaN(validBid)) {
        validBid = 0;
    }

    try {
        let update = await (sql.Shares).update(
            { ask: validAsk, bid: validBid, total_value: currentShareValue, total_invested: validTotalInvested, currency: userCurrency, closed: closed },
            { where: { id: share_id } }
        );
        return currentShareValue;
    }
    catch(err) {
        console.error("Error updating share: ", err);
        return;
    }
}

/*
    Updates the value of a portfolio based on the values of its shares
    @param {string} uuid - The unique uuid of the portfolio in the Portfolio table
    @return {object} - The response from the sql update command
*/
async function updatePortfolioValue(uuid) {
    try {
        //Get all shares in the portfolio
        let shares = await (sql.Shares).findAll({
            where: {portfolio_uuid: uuid}
        });

        var portValue = 0;
        var portInvested = 0;

        //Update each share and add to the portfolio value
        for(let i = 0; i < shares.length; i++) {
            let shareValue;
            try {
                shareValue = await updateShareValue(shares[i].id);
                
                // Validate shareValue before adding to portfolio
                if (shareValue && !isNaN(shareValue)) {
                    portValue += parseFloat(shareValue);
                }
                
                // Validate total_invested before adding to portfolio
                if (shares[i].total_invested && !isNaN(shares[i].total_invested)) {
                    portInvested += parseFloat(shares[i].total_invested);
                }
            } catch (err) {
                console.error("Error updating share value: ", err);
                // Continue with other shares instead of returning
                continue;
            }
        }

        // Final validation to ensure no NaN values are passed to database
        if (isNaN(portValue)) {
            portValue = 0;
        }
        if (isNaN(portInvested)) {
            portInvested = 0;
        }

        try {
            //Update the portfolio
            return await (sql.Portfolio).update(
                { value: portValue, inputValue: portInvested },
                { where: { uuid: uuid } }
            );
        } catch (err) {
            console.error("Error updating portfolio table: ", err);
            return;
        }
    } catch(err) {
        console.error("Error updating portfolio: ", err);
        return;
    }
}

/*
    Updates all portfolios owned by a user
    @param {string} uuid - The unique uuid of the user in the Users table
    @return {object} - The response from the sql update command
*/
async function updateOwnersPortfolios(uuid) {
    try {
        //Get all portfolios owned by the user
        let portfolios = await (sql.Portfolio).findAll({
            where: {owner_uuid: uuid}
        });
        //Update each portfolio
        for(let i = 0; i < portfolios.length; i++) {
            let update;
            try {
                update = await updatePortfolioValue(portfolios[i].uuid);
            } catch (err) {
                console.error("Error updating portfolio value: ", err);
                return;
            }
        }
        return;
    } catch (err) {
        console.error("Error updating users portfolios: ", err);
        return;
    }
}

/*
    Updates all stocks in the database
    @return {boolean} - True if successful, false if error
*/  
async function updateAllStocks() {
    try {
        //Get all users
        let users = await (sql.Users).findAll({});
        //Update each users portfolios
        for(let i = 0; i < users.length; i++) {
            let update;
            try {
                update = await updateOwnersPortfolios(users[i].uuid);
            } catch (err) {
                console.error("Error updating portfolio value: ", err);
                return;
            }
        }
    } catch(err) {
        console.error("Error updating stocks: ", err);
        return;
    }
    return true;
}

/*
    Updates the preferred currency of a user and all their shares and portfolios
    @param {string} preferedCurrency - The new preferred currency of the user
    @param {string} uuid - The unique uuid of the user in the Users table
    @return {object} - The response from updating all of the users portfolios
*/
async function updatePreferredCurrency(preferedCurrency, uuid) {
    try {
        //Verify that the currency is valid
        const response = await axios.get(`https://2024-03-06.currency-api.pages.dev/v1/currencies/${current}.json`);
        try {
           const rate = response.data[current][target];
        } catch(err) {
           console.error("Invalid currency: ", err);
           return;
        }
    } catch(err) {
        console.error("Error getting new currency: ", err);
        return;
    }
    try {
        //Update all shares to the new currency
        let updateShare = await (sql.Shares).update(
            { currency: preferedCurrency},
            { where: {owner_uuid: uuid,}}
        );
    } catch(err) {
        console.error("Error updating shares preferred currency: ", err);
        return;
    }
    try {
        //Update all portfolios to the new currency
        let updatePortfolio = await (sql.Portfolio).update(
            { currency: preferedCurrency},
            { where: {owner_uuid: uuid,}}
        );

    } catch(err) {
        console.error("Error updating portfolio preferred currency: ", err);
        return;
    }
    try {
        //Update the user to the new currency
        let updateUser = await (sql.Users).update(
            { preferedCurrency: preferedCurrency},
            { where: {uuid: uuid,}}
        );
    } catch(err) {
        console.error("Error updating users preferred currency: ", err);
        return;
    }
    //Update all of the users portfolios to reflect the new currency
    return updateOwnersPortfolios(uuid);
}

module.exports = {
    //Use Functions//
    convertCurrency,
    cleanDb,

    //Update Functions//
    updateShareValue,
    updatePortfolioValue,
    updateOwnersPortfolios,
    updateAllStocks,
    updatePreferredCurrency
}