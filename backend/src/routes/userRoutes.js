const express = require("express");
const router = express.Router();
const controller = require("../controllers/userControllers");
const authenticationToken = require('../middleware/validation');

////////////////////////////////////////////////////////////
/////////These handle endpoints related to the user ////////
////////////////////////////////////////////////////////////

//User Info//
router.get("/user/fname", authenticationToken.authenticateToken, controller.getFirstName)
router.get("/user/lname", authenticationToken.authenticateToken, controller.getLastName)
router.get("/user/name", authenticationToken.authenticateToken, controller.getFullName)

//User Money//
router.post("/user/deposit", authenticationToken.authenticateToken, controller.depositMoney)                //Allows the user to depost money
router.post("/user/withdraw", authenticationToken.authenticateToken, controller.withdrawMoney)             //Allows the user to withdraw money
router.get("/user/balance", authenticationToken.authenticateToken, controller.getBalance)                   //Allows the user to get their current balance

//Shares and Logs//
router.get("/user/shares/:portfolio_uuid", authenticationToken.authenticateToken, controller.getShares)     //Gets the users current shares in a portfolio
router.get("/user/logs", authenticationToken.authenticateToken, controller.getLogs)                         //Gets the transaction log for the user

//Change Preferred Currency//
router.post("/user/currency", authenticationToken.authenticateToken, controller.changePreferredCurrency)     //Allows the user to change their preffered currency

//Portfolio Updates//
router.post("/user/update-portfolios", authenticationToken.authenticateToken, controller.updateUserPortfolios)  //Updates all user portfolios

module.exports = router;