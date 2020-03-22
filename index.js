const express = require('express');

const Market = require('./steam-market-helper');
const Rarity = require('./cs-weapon-rarity');
const Condition = require('./cs-weapon-condition');

const mariadb = require('mariadb');

const conn = mariadb.createConnection({
  host: '127.0.0.1',
  port: '3306',
  user: 'root',
  password: 'my-secret-pw',
  database: 'csgo'
});

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

  
});

setTimeout(async () => {
  await main();
}, 5000);

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

    const query = `insert into csgo values ${'(?,?,?,?,?,?),'.repeat(allCollections.length)}`.slice(0,-1);
    const params = [].concat(...allCollections.map(skin => [
      skin.skin,
      skin.weapon,
      skin.condition,
      skin.price,
      skin.amount,
      skin.rarity,
    ]));

    const storeData = await conn.query(query, params);
    console.log('hi');
  } catch(e) {
    console.error('error when getting data from steam');
    console.error(e);
  }

  //await getProfitabilityByCollection();
}

app.get('/test', async (req, res) => {
  await steamMarket.updateCollections();
  await steamMarket.getCollectionMetadata(Object.keys(steamMarket.collections)[2]);
  res.send(steamMarket.collections);
});

app.listen(PORT);

/*
async function getProfitabilityByCollection() {
  const weaponsTable = mongodb.db('csgo').collection('weapons');
  try {
    const collection = await weaponsTable.findOne({});

    // eliminate dollar signs => fixed on next crawl
    collection.skins.forEach(rarity => {
      Object.entries(rarity).forEach(skin => {
        Object.entries(skin[1].condition).forEach(condition => {
          condition[1].price = condition[1].price.substr(1);
        });
      });
    });
    
    collection.skins = collection.skins.map((raritySet,index) => {
      
      // iterate through skins in raritySets
      const blub = Object.entries(raritySet).reduce((acc,cur,ind) => {
        // iterate through condition of skin
        Object.entries(cur[1].condition).forEach((condition) => {
          const conditionIndex = Condition.indexOf(condition[0]);

          if (acc[conditionIndex] === undefined) {
            acc[conditionIndex] = {};
          }

          acc[conditionIndex][cur[0]] = condition[1].price;
        });
        return acc;
      }, []);
      console.log(`blub ${index}`);
      console.log(blub);
      return blub;
    });

    console.log(collection.skins);

    collection.skins.map((condition) => {
      const min = Math.min.apply(null,Object.values(condition).map(str => parseInt(str)));
      console.log(min);
      return min;
    });

    console.log();
  } catch(e) {
    console.error('error when analyzing collections');
    console.error(e);
  }
}
*/