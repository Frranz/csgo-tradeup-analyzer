const express = require('express');
const Market = require('./steam-market-helper');
const Rarity = require('./cs-weapon-rarity');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const PORT = 3003;

const steamMarket = new Market();
const mongodb = new MongoClient('mongodb://localhost:27017', {
  useUnifiedTopology: true,
});

const DROP_TABLES_FIRST = false;

mongodb.connect(async (err) => {
  if (err) throw Error('error when connecting to db');
  console.log('connected to mongodb');

  main();
});

async function main() {
  try {

    const weaponsTable = mongodb.db('csgo').collection('weapons');
    if (DROP_TABLES_FIRST) {
      mongodb.db('csgo').dropCollection('weapons', (err,delOk) => {
        if (err){ 
          console.error('couldnt drop weapons table');
          console.error(err)
        } else {
          console.log('dropped weapons table');
        }
      });
    }
    
    await steamMarket.updateCollections();
    
    console.log(`getting data for all collections`);

    const allCollections = await steamMarket.getAllCollectionsMetadata();

    const writeThis = Object.entries(allCollections).map(entry => {
      return {
      	collection:entry[0],
	skins: entry[1],
      };
    });

    const query = await weaponsTable.insertMany(writeThis); 

    console.log(query);

    /*const collectionData = await steamMarket.getCollectionMetadata(Object.keys(steamMarket.collections)[0]);


    const weaponsTable = mongodb.db('csgo').collection('weapons');

    const writeThis = {};
    writeThis[Object.values(steamMarket.collections)[0]] = collectionData;

    const query = await weaponsTable.insertOne(writeThis);*/
  } catch(e) {
    console.error('error when getting data from steam');
    console.error(e);
  }
}

setTimeout(async () => {

}, 50);


app.get('/test', async (req, res) => {
  await steamMarket.updateCollections();
  await steamMarket.getCollectionMetadata(Object.keys(steamMarket.collections)[2]);
  res.send(steamMarket.collections);
});

app.listen(PORT);
