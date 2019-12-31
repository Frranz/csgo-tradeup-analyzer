const express = require('express');
const Market = require('./steam-market-helper');
const Grades = require('./steam-market-helper');


const app = express();
const PORT = 3000;

const steamMarket = new Market();

app.get('/test', async (req, res) => {
  await steamMarket.updateCollections();
  await steamMarket.getCollectionMetadata(Object.keys(steamMarket.collections)[2]);
  res.send(steamMarket.collections);
});

app.listen(PORT);
