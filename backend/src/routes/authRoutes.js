const express = require("express");
const router = express.Router();
const controller = require("../controllers/authControllers");
const authenticationToken = require('../middleware/validation');

////////////////////////////////////////////////////////////
///////These handle endpoints related to the user auth//////
////////////////////////////////////////////////////////////

router.post("/auth/register", controller.createUser);                                           //Allows registration of a user
router.get("/auth/users", authenticationToken.authenticateTokenAdmin, controller.getAllUsers);  //Gets all users (Admin Use Only)
router.post("/auth/login", controller.loginUser);                                               //Allows a user to login

module.exports = router;