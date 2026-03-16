const YahooFinance = require("yahoo-finance2").default;

////////////////////////////////////////////////////////////
//These handle all controller functions related to the api//
////////////////////////////////////////////////////////////

//////////Getting Direct Price//////////

/*
    Gets the current ask and bid price of a company
    GET /price/:tag
    @param {string} tag - The stock tag of the company
    @return {object} - The current ask and bid price of the company
*/
async function getCurrentPrice(req, res) {
    const {tag} = req.params;       //Get tag from params
    try {
        const result = await YahooFinance.quote(tag);   //Get info from Yahoo
        res.status(200).json({ask: result.ask, bid: result.bid, currency: result.currency});
        return;
    } catch (error) {
        console.error("Error fetching stock price: ", error);
        res.status(500).json({error: "Internal Server Error"});
        return;
    }
}



//////////Searching//////////

/*
    Searches Yahoo for info related to the search query
    GET /search/:query
    @param {string} query - The search query
    @return {object} - The results from the search query
*/
async function searchForCompany(req, res) {
    const search = req.params.query;                    //Get query from params
    try {
        const result = await YahooFinance.search(search);   //Search Yahoo
        res.status(200).json(result.quotes);
        return;
    } catch (error) {
        console.error("Error fetching search results: ", error);
        res.status(500).json({error: "Internal Server Error"});
        return;
    }
}

/*
    Searches Yahoo for news articles related to the search query
    GET /search/news/:query
    @param {string} query - The search query
    @return {object} - The news articles from the search query
*/
async function searchNews(req, res) {
    const search = req.params.query;    //Get query from params
    try {
        const result = await YahooFinance.search(search);   //Search Yahoo
        res.status(200).json(result.news);
        return;
    } catch (error) {
        console.error("Error fetching news articles: ", error);
        res.status(500).json({error: "Internal Server Error"});
        return;
    }
}

/*
    Searches Yahoo for financial information related to the search query
    GET /search/financial/:query
    @param {string} query - The search query
    @return {object} - The financial information from the search query
*/
async function searchFincancials(req, res) {
    const {query} = req.params;                         //Get query from params
    let result;
    try {
        result = await YahooFinance.search(query);    //Search Yahoo
    } catch (error) {
        console.error("Error fetching financial data: ", error);
        res.status(500).json({error: "Internal Server Error"});
        return;
    }
    const quotes = [];                                  //Final output
    //For each result from query
    for(let i = 0; i< (result.quotes).length; i++) {
        //Some results will come back as duds so we ignore them
        if(!(result.quotes)[i].symbol){
            continue;
        }
        try {
            //We then get financial info for each result
            let quote = await YahooFinance.quote((result.quotes)[i].symbol);
            quotes.push(quote);
        } catch (err) {
            console.error("Unable to get quote: ", err);
            res.status(500).json({error: "Internal Server Error "});
            return;
        }
    }
    res.status(200).json(quotes);
    return;
}

module.exports = {
    //Getting Direct Price//
    getCurrentPrice,

    //Searching//
    searchForCompany,
    searchNews,
    searchFincancials
}