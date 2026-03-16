const authModel = require("../models/authModels");
const jwt = require('jsonwebtoken');
require('dotenv').config({ quiet: true });

////////////////////////////////////////////////////////////////////////
//These handle all controller functions related to user authentication//
////////////////////////////////////////////////////////////////////////

/*
    Registers a new user
    POST /auth/register
    @body {string} username - The username of the new user
    @body {string} password - The password of the new user
    @body {string} fname - The first name of the new user
    @body {string} lname - The last name of the new user
    @return {object} - The newly created user object
*/
async function createUser(req, res) {
    const user = req.body;      //User info from body
    try {
        const newUser = await authModel.createUser(user);
        res.status(201).json({message: "User created"});
        return;
    }
    catch (err) {  
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error creating new user:", err);
        return;
    }
}

/*
    Gets all users
    GET /auth/users
    Auth: Required (Admin)
    @return {array} - Array of all user objects
*/
async function getAllUsers(req, res) {
    try {
        const users = await authModel.getAllUsers();    //Retrieve from database
        res.status(200).json(users);
        return
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error returning users:", err);
        return;
    }
}

/*
    Login for user
    POST /auth/login
    @body {string} username - The username of the user
    @body {string} password - The password of the user
    @return {object} - Success message and JWT token if successful, error message if not
*/
async function loginUser(req, res) {
    const user = req.body;
    try {
        const uuid = await authModel.verifyLogin(user);     //Verify
        if(!uuid)  return res.status(401).json({error: "Invalid Credentials"});

        //Create token
        const payload = {id: uuid, username: user.username};
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "24h"});
        res.status(200).json({message: "success", token: token});
        return;
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
        console.error("Error logging in users:", err);
        return;
    }
}

module.exports = {
    createUser,
    getAllUsers,
    loginUser
}