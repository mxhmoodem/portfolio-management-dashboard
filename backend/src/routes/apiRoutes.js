const express = require("express");
const router = express.Router();
const controller = require("../controllers/apiControllers");

////////////////////////////////////////////////////////////
///These handle all endpoints related to calling the API////
////////////////////////////////////////////////////////////

//Getting Direct Price//
router.get("/price/:tag", controller.getCurrentPrice);                  //Gets the price of a certain stock

//Searching//
router.get("/search/:query", controller.searchForCompany);              //Allows a general search for a company
router.get("/search/news/:query", controller.searchNews);               //Allows a search for news on a company
router.get("/search/financial/:query", controller.searchFincancials);   //Allows you to search teh API for financial info on a company

module.exports = router;