const sql = require("../config/sql");

/////////////////////////////////////////////////////////////
//These handle all model functions related to the portfolio//
/////////////////////////////////////////////////////////////

///////////Portfolio Checks///////////

/*
    Check if a user has a portfolio (for use when buying)
    @param {string} uuid - The UUID of the user
    @returns {Promise<boolean>} - True if the user has a portfolio, false otherwise
*/
async function hasAPortfolio(uuid) {
    try {
        //Find all of the users portfolios
        const portfolio = await (sql.Portfolio).findAll({
            where: {owner_uuid: uuid}
        });
        //Check if there are any
        if(portfolio.length == 0){
            return false;
        }
        return true;
    } catch (err) {
        console.error("Error getting portfolios:", err);
        return;
    }
}

/*
    Check if the designated portfolio is empty (for use when selling)
    @param {string} portfolio_uuid - The UUID of the portfolio
    @param {string} owner_uuid - The UUID of the user
    @returns {Promise<boolean>} - True if the portfolio is empty, false otherwise
*/
async function checkIfPortfolioEmpty(portfolio_uuid, owner_uuid) {
    try {
        //Find all shares in the portfolio that belongs to the user
        const share = await (sql.Shares).findAll({
            where: {owner_uuid: owner_uuid, portfolio_uuid: portfolio_uuid}
        });
        //Check if any came back
        if(share.length == 0){
            return true;
        }
        return false;
    } catch (err) {
        console.error("Error getting shares:", err);
        return;
    }
}



///////////Portfolio GET Functions///////////

/*
    Get the user's preferred currency
    @param {Object} user - The user object
    @returns {Promise<string>} - The user's preferred currency
*/
async function getUserPreferedCurrency(user) {
    try {
        return await (sql.Users).findAll({
            attributes: ['prefered_currency'],
            where: {uuid : user.uuid}
        });
    } catch (err) {
        console.error("Error getting preffered currency:", err);
        return;
    }
}

/*
    Get the user's default portfolio
    @param {string} uuid - The UUID of the user
    @returns {Promise<Object>} - The user's default portfolio
*/
async function getDefaultPortfolio(uuid) {
    try {
        const portfolio = await (sql.Portfolio).findOne({
            attributes: ['uuid'],
            where: {owner_uuid: uuid, is_default: true}
        });
        return portfolio.uuid;
    } catch (err) {
        console.error("Error getting default portfolios:", err);
        return;
    }
}



///////////Portfolio Misc Functions///////////

/*
    Find the portfolio associated with a specific stock
    @param {string} tag - The stock tag
    @param {string} uuid - The UUID of the user
    @returns {Promise<Object>} - The portfolio associated with the stock
*/
async function findStocksPortfolio(tag, uuid) {
    try {
        return await (sql.Shares).findAll({
            attributes: ['portfolio_uuid'],
            where: {owner_uuid: uuid, tag: tag}
        });
    } catch (err) {
        console.error("Error getting portfolios:", err);
        return;
    }
}

/*
    Clear the default portfolio for a user (so it can then be set properly)
    @param {string} owner_uuid - The UUID of the user
*/
async function clearDefaultPortfolio(owner_uuid) {
    try {
        //Update all portfolios the user owns and set them as not default
        return await (sql.Portfolio).update(
            { is_default: false },
            { where: { owner_uuid: owner_uuid } }
        );
    } catch (err) {
        console.error("Error clearing default portfolio:", err);
        return;
    }
}




///////////Portfolio CRUD Functions///////////


/*
    Get all portfolios for a user
    @param {Object} user - The user object
    @returns {Promise<Array>} - An array of portfolios
*/
async function getPortfolio(user) {
    try {
        //Finds it using the user object
        return await (sql.Portfolio).findAll({
            where: {owner_uuid: user.uuid}
        });
    } catch (err) {
        console.error("Error getting portfolios:", err);
        return;
    }
}

/*
    Get all portfolios for a user by their UUID
    @param {string} uuid - The UUID of the user
    @returns {Promise<Array>} - An array of portfolios
*/
async function getPortfolioUUID(uuid) {
    try {
        //Finds it using their UUID
        return await (sql.Portfolio).findAll({
            where: {owner_uuid: uuid}
        });
    } catch (err) {
        console.error("Error getting portfolios:", err);
        return;
    }
}

/*
    Create a new portfolio
    @param {string} name - The name of the portfolio
    @param {string} owner_uuid - The UUID of the user
    @param {string} prefered_currency - The preferred currency of the portfolio
    @param {boolean} isDefault - Whether the portfolio is the default portfolio
    @returns {Promise<Object>} - The created portfolio
*/
async function createPortfolio(name, owner_uuid, prefered_currency, isDefault) {
    try {
        const portfolios = await getPortfolioUUID(owner_uuid);
        //Check if they have any other portfolios set to default, clear it
        //if this one is to be made default
        if(isDefault && portfolios.length > 0)
        {
            try {
                await (sql.Portfolio).update(
                    { isDefault: false },
                    { where: { owner_uuid: owner_uuid } }
                );
            }
            catch (err) {
                console.error("Error clearing default portfolio:", err);
                return;
            }
        }
        //Set this one to default if there are no other
        else if(portfolios.length == 0 && !isDefault){
            isDefault = true;
        }

        //If isDefault is null, set it to false
        if(isDefault == "" || isDefault == null || isDefault == undefined){
            isDefault = false;
        }

        //Create new portfolio
        const newPortfolio = {
            owner_uuid: owner_uuid,
            name: name,
            prefered_currency: prefered_currency,
            is_default: isDefault
        };
        try {
            return await (sql.Portfolio).create(newPortfolio);
        } catch (err) {
            console.error("Error creating portfolio:", err);
            return;
        }
    } catch(err) {
        console.error("Error finding user:", err);
        return;
    }
}

/*
    Update an existing portfolio
    @param {string} name - The new name of the portfolio
    @param {boolean} isDefault - Whether the portfolio is the default portfolio
    @param {string} portfolio_uuid - The UUID of the portfolio
    @param {string} owner_uuid - The UUID of the user
    @returns {Promise<Object>} - The updated portfolio
*/
async function updatePortfolio(name, isDefault, portfolio_uuid, owner_uuid) {
    try {
        //If they want to change the name
        if(name) {
            try {
                await (sql.Portfolio).update(
                    { name: name },
                    { where: [{ uuid: portfolio_uuid }, {owner_uuid: owner_uuid}] }
                );
            } catch (err) {
                console.error("Error updating portfolio name:", err);
                return;
            }
        }
        //If they want to change the default portfolio
        if(isDefault) {
            //Clear any existing default portfolio
            const clear = await clearDefaultPortfolio(owner_uuid);
            try {
                await (sql.Portfolio).update(
                    { is_default: isDefault },
                    { where: [{ uuid: portfolio_uuid }, {owner_uuid: owner_uuid}] }
                );
            } catch (err) {
                console.error("Error updating portfolio default:", err);
                return;
            }
        }
        return 1;
    }
    catch (err) {
        console.error("Error updating portfolio:", err);
        return;
    }
}  

/*
    Delete an existing portfolio
    @param {string} portfolio_uuid - The UUID of the portfolio
    @param {string} owner_uuid - The UUID of the user
    @returns {Promise<Object>} - The deleted portfolio
*/
async function deletePortfolio(portfolio_uuid, owner_uuid) {
    try {
        return await (sql.Portfolio).destroy({
            where: {owner_uuid: owner_uuid, uuid: portfolio_uuid}
        });
    } catch (err) {
        console.error("Error deleting portfolio:", err);
        return;
    }
}




///////////Portfolio Value Functions///////////

/*
    Get the total value of a portfolio
    @param {string} portfolio_uuid - The UUID of the portfolio
    @param {string} owner_uuid - The UUID of the user
    @returns {Promise<float(15,2)>} - The total value of the portfolio
*/
async function getPortfolioValue(portfolio_uuid, owner_uuid) {
    try {
        //Get all shares in the portfolio
        let share;
        try {
            share = await (sql.Shares).findAll({
                where: {owner_uuid: owner_uuid, portfolio_uuid: portfolio_uuid}
            });
        } catch (err) {
            console.error("Error getting shares:", err);
            return;
        }
        let totalValue = 0;
        let totalInvested = 0;
        //Total up value and invested value
        for(let i = 0; i < share.length; i++) {
            // Validate values before adding to prevent NaN
            const shareValue = share[i].total_value;
            const shareInvested = share[i].total_invested;
            
            if (shareValue && !isNaN(shareValue)) {
                totalValue += parseFloat(shareValue);
            }
            if (shareInvested && !isNaN(shareInvested)) {
                totalInvested += parseFloat(shareInvested);
            }
        };

        // Final validation to ensure no NaN values are passed to database
        if (isNaN(totalValue)) {
            totalValue = 0;
        }
        if (isNaN(totalInvested)) {
            totalInvested = 0;
        }
        //Update the portfolio
        try {
            await (sql.Portfolio).update(
                { value: totalValue, inputValue: totalInvested },
                { where: [{ uuid: portfolio_uuid }, {owner_uuid: owner_uuid}] }
            );
        } catch (err) {
            console.error("Error updating portfolio table: ", err);
            return;
        }
        return totalValue;
    } catch (err) {
        console.error("Error getting value:", err);
    }
}

/*
    Get the return of a portfolio
    @param {string} portfolio_uuid - The UUID of the portfolio
    @param {string} owner_uuid - The UUID of the user
    @returns {Promise<float(15,2)>} - The return of the portfolio
*/
async function getPortfolioReturn(portfolio_uuid, owner_uuid) {
    try {
        //Update and get portfolios value
        let value;
        try {
            value = await getPortfolioValue(portfolio_uuid, owner_uuid);
        } catch (err) {
            console.error("Error getting portfolio value:", err);
            return;
        }
        //Get the amount of money invested in total
        let portfolio;
        try {
            portfolio = await (sql.Portfolio).findOne({
                attributes: ['inputValue'],
                where: {uuid: portfolio_uuid, owner_uuid: owner_uuid}
            });
        } catch (err) {
            console.error("Error getting portfolio invested value:", err);
            return;
        }
        //Return the difference
        // Validate values to prevent NaN
        const validValue = (value && !isNaN(value)) ? parseFloat(value) : 0;
        const validInputValue = (portfolio.inputValue && !isNaN(portfolio.inputValue)) ? parseFloat(portfolio.inputValue) : 0;
        
        const difference = validValue - validInputValue;
        
        // Final validation to ensure result is not NaN
        if (isNaN(difference)) {
            return 0;
        }
        
        return difference;
    } catch (err) {
        console.error("Error getting value:", err);
    }
}

/*
    Get the return of a portfolio as a percentage
    @param {string} portfolio_uuid - The UUID of the portfolio
    @param {string} owner_uuid - The UUID of the user
    @returns {Promise<float(15,2)>} - The return of the portfolio as a percentage
*/
async function getPortfolioReturnPercentage(portfolio_uuid, owner_uuid) {
    try {
        //Update and get portfolios value
        let value;
        try {
            value = await getPortfolioValue(portfolio_uuid, owner_uuid);
        } catch (err) {
            console.error("Error getting portfolio value:", err);
            return;
        }
        //Get the amount of money invested in total
        let portfolio;
        try {
            portfolio = await (sql.Portfolio).findOne({
                attributes: ['inputValue'],
                where: {uuid: portfolio_uuid, owner_uuid: owner_uuid}
            });
        } catch (err) {
            console.error("Error getting portfolio invested value:", err);
            return;
        }
        //Return the difference as a percentage
        // Validate values to prevent division by zero or NaN
        const validValue = (value && !isNaN(value)) ? parseFloat(value) : 0;
        const validInputValue = (portfolio.inputValue && !isNaN(portfolio.inputValue)) ? parseFloat(portfolio.inputValue) : 0;
        
        if (validInputValue === 0) {
            // If no money was invested, return 1 (no change)
            return 1;
        }
        
        const percentage = 1 + ((validValue - validInputValue) / validInputValue);
        
        // Final validation to ensure result is not NaN
        if (isNaN(percentage)) {
            return 1;
        }
        
        return percentage;
    } catch (err) {
        console.error("Error getting value:", err);
    }
}

module.exports = {
    //Portfolio Checks//
    hasAPortfolio,
    checkIfPortfolioEmpty,

    //Portfolio GET Functions//
    getUserPreferedCurrency,    
    getDefaultPortfolio,

    //Portfolio Misc Functions//
    findStocksPortfolio,
    clearDefaultPortfolio,

    //Portfolio CRUD Functions//
    getPortfolio,
    getPortfolioUUID,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,

    //Portfolio Value Functions//
    getPortfolioValue,
    getPortfolioReturn,
    getPortfolioReturnPercentage,
}