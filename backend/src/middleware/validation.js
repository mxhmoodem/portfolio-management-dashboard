const jwt = require("jsonwebtoken");
require('dotenv').config({ quiet: true });

////////////////////////////////////////////////////////////
/////////////All Authentication Stuff Done Here/////////////
////////////////////////////////////////////////////////////


//Basic user authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: "Missing token" });
    const token = authHeader.split(" ")[1];

    if(!token) return res.status(401).json({error: "Missing token"});

    //Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if(err) return res.status(401).json({error: "Invalid token"});

        req.user = user;
        req.user.uuid = user.id    //Get the users uuid to make easier to use
        next();
    });
}

//Admin user authentication
function authenticateTokenAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: "Missing token" });
    
    const token = authHeader.split(" ")[1];

    if(!token) return res.status(401).json({error: "Missing token"});

    //Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if(err) return res.status(401).json({error: "Invalid token"});

        req.user = user;
        //Admin username is stored in .env
        if(user.username != process.env.ADMIN_USERNAME) {
            res.status(401).json({message: "Admin Only"});
        }
        req.user.uuid = user.id[0].uuid;    //Get the users uuid to make easier to use
        next();
    });
}

module.exports = {
    authenticateToken,
    authenticateTokenAdmin
}