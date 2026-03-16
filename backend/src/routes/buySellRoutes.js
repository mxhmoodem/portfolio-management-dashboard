const express = require("express");
const router = express.Router();
const controller = require("../controllers/buySellControllers");
const authenticationToken = require('../middleware/validation');

////////////////////////////////////////////////////////////
///////////These handle the buy and sell endpoints//////////
////////////////////////////////////////////////////////////

router.post("/buy/:tag", authenticationToken.authenticateToken, controller.buyStocks);      //Endpoint to buy a stock
router.post("/sell/:tag", authenticationToken.authenticateToken, controller.sellStocks);    //Endpoint to sell a stock

module.exports = router;