# csgo-tradeup-analyzer
Finds profitable tradeups for csgo weapons based on steam market values

## Connecting to a database

Create a database.js file under /db
The file should look like this:

const mariadb = require('mariadb');
const pool = mariadb.createPool({
    database: 'csgo',
    host: 'a',
    user: 'a',
    password: 'a',
    connectionLimit: 5,
});

module.exports = pool;

