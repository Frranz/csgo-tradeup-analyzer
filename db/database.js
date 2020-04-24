const dotenv = require('dotenv').config();
const mariadb = require('mariadb');
const pool = mariadb.createPool({
    database: 'csgo',
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PW,
    port:process.env.DB_PORT,
    connectionLimit: 5,
});

module.exports = pool;
