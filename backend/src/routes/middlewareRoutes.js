const express = require("express");
const router = express.Router();
const controller = require("../controllers/middlewareControllers");
const authenticationToken = require('../middleware/validation');

////////////////////////////////////////////////////////////
////////////These handle all middleware endpoints///////////
////////////////////////////////////////////////////////////

router.post("/convert", controller.convertCurrency);                                       //Endpoint used to convert currencies
router.get("/clean", authenticationToken.authenticateTokenAdmin, controller.cleanDB);     //Endpoint to clear all tables (!!WARNING!! Admin Use Only, Can Result In Severe Legal Consequenes If Used Incorrectly)
router.get("/sync", controller.updateAll);                                                //Syncs database to current financial data

module.exports = router;