const { Sequelize, DataTypes } = require("sequelize");
require('dotenv').config({ quiet: true });
const bcrypt = require("bcrypt");

////////////////////////////////////////////////////////////
/////////////All SQL database stuff stored here/////////////
////////////////////////////////////////////////////////////

//Initialise Sequelize
let seq;
if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        logging: false
    });
} else if (process.env.DATABASE_URL) {
    seq = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });
} else {
    seq = new Sequelize(process.env.DB_NAME || 'database', process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        logging: false //Tell sequelize to **** (aka be quiet)
    });
}

//Users table
const Users = seq.define('user', {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        foreignKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    money: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    prefered_currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "usd"
    }
},
{
    tableName: 'user',
    timestamps: false
});
Users.addHook(
    "beforeCreate",
    user => (user.password = bcrypt.hashSync(user.password, 10))
);

//Portfolio Table
const Portfolio = seq.define('portfolio', {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        foreignKey: true
    },
    owner_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        foreignKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
    },
    inputValue: {
        type: DataTypes.DOUBLE,
        allowedNull: false,
        defaultValue: 0
    },
    prefered_currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "usd"
    },
    is_default: {
        type: DataTypes.BOOLEAN,
        allowedNull: false,
        defaultValue: false
    }
},
{
    tableName: 'portfolio',
    timestamps: false
});

//Shares table
const Shares = seq.define('shares', {
    id: {
        type: DataTypes.INTEGER,
        allowedNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    tag: {
        type: DataTypes.STRING,
        allowedNull: false
    },
    portfolio_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        foreignKey: true
    },
    owner_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        foreignKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    current_ask: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    current_bid: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    amount_owned: {
        type: DataTypes.FLOAT,
        allowedNull: false
    },
    total_invested: {
        type: DataTypes.DOUBLE,
        allowedNull: false
    },
    total_value: {
        type: DataTypes.DOUBLE,
        allowedNull: false
    },
    currency: {
        type: DataTypes.STRING,
        allowedNull: false,
        defaultValue: "usd"
    },
    closed: {
        type: DataTypes.BOOLEAN,
        allowedNull: false,
        defaultValue: false
    }
},
{
    tableName: 'shares',
    timestamps: false
});

//Transaction log table
const TransactionLog = seq.define('transaction_log', {
    id: {
        type: DataTypes.INTEGER,
        allowedNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    timestamp: {
        type: DataTypes.DATE,
        allowedNull: false,
        defaultValue: DataTypes.NOW
    },
    buy_sell: {
        type: DataTypes.ENUM('buy', 'sell'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    stock_traded: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    price_per: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false
    },
    stock_tag: {
        type: DataTypes.STRING,
        allowNull: false
    },
    portfolio_uuid: {
        type: DataTypes.UUID,
        allowedNull: false,
        foreignKey: true
    },
    owner_uuid: {
        type: DataTypes.UUID,
        allowedNull: false,
        foreignKey: true
    }
},
{
    tableName: 'transaction_log',
    timestamps: true
});

seq.sync({ alter: true });

module.exports = {
    seq,
    Users,
    Portfolio,
    Shares,
    TransactionLog
}
