const express = require("express");
const router = express.Router();
const controller = require("../controllers/portfolioControllers");
const authenticationToken = require('../middleware/validation');

////////////////////////////////////////////////////////////
//////These handle ednpoints related to user portfolios/////
////////////////////////////////////////////////////////////

//Portfolio Basics//
router.get("/user/portfolio", authenticationToken.authenticateToken, controller.getUsersPortfolio);                                                 //Gets the current users portfolios
router.post("/user/portfolio/create", authenticationToken.authenticateToken, controller.createPortfolio);                                                  //Creates a new portfolio for the user
router.patch("/user/portfolio/update", authenticationToken.authenticateToken, controller.modifyPortfolio);                                          //Updates a users portfolio
router.delete("/user/portfolio/:portfolio_uuid", authenticationToken.authenticateToken, controller.deletePortfolio)                                 //Deletes a users portfolio (must be empty)

//Portfolio Value//
router.get("/user/portfolio/value/:portfolio_uuid", authenticationToken.authenticateToken, controller.getPortfolioValue)                            //Gets the current value of the portfolio
router.get("/user/portfolio/return/:portfolio_uuid", authenticationToken.authenticateToken, controller.getPortfolioReturn)                          //Gets the current return of the portfolio
router.get("/user/portfolio/return/percentage/:portfolio_uuid", authenticationToken.authenticateToken, controller.getPortfolioReturnPercentage)     //Gets the current return percentage of the portfolio

module.exports = router;