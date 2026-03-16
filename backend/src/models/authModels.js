const sql = require("../config/sql");
const bcrypt = require("bcrypt");

/////////////////////////////////////////////////////////////
//These handle all model functions related to authenticaion//
/////////////////////////////////////////////////////////////

/*
    Creates a new user in the Users table
    @param {object} user - The user object containing username, password, email, preferedCurrency
    @return {object} - The created user object
*/
async function createUser(user) {
    try {
        //Verify that the username is unique
        let userCheck = await (sql.Users).findAll({
            attributes: ['uuid'],
            where: {username: user.username}
        });
        if(userCheck.length == 0) {
            return await (sql.Users).create(user);
        }
        else{
            console.error("User of that username already exists");
            return;
        }
    } catch(err) {
        console.error("Error registering user: ", err);
        return;
    }
}

/*
    Gets all users in the Users table
    @return {object} - An array of all user objects
*/
async function getAllUsers() {
    try {
        return await (sql.Users).findAll();
    } catch(err) {
        console.error("Error getting all users: ", err);
        return;
    }
}

/*
    Verifies a user's login credentials
    @param {object} user - The user object containing username and password
    @return {object} - An array containing the user object if found, empty array if not
*/
async function verifyLogin(user) {
    try {
        //Get user with username
        const userFind = await (sql.Users).findOne({
            where: {username: user.username}
        });
        try {
            //Verify unhased password
            const isMatch = await bcrypt.compare(user.password, userFind.password);
            if (!isMatch) {
                return;
            }
        } catch(err) {
            console.error("Error checking password: ", err);
            return;
        }
        return userFind.uuid;
    } catch(err) {
        console.error("Error verifying user: ", err);
        return;
    }
}

module.exports = {
    createUser,
    getAllUsers,
    verifyLogin
};