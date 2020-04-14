const express = require('express');
const db = require('./db/database');
const DbHandler = require('./db/DatabaseHandler');
const MarketAgent = require('./SteamMarketAgent');

const app = express();
const PORT = 3003;

const dbHandler = new DbHandler(db);
const marketAgent = new MarketAgent(dbHandler);

setTimeout(async () => {
  await main();
}, 1);

async function main() {
  try {
    
    const newCollections = await marketAgent.updateCollections();
    const leel = await marketAgent.getAllCollectionsMetadata()
  } catch(e) {
    console.error('error when getting data from steam');
    console.error(e);
  }

  //await getProfitabilityByCollection();
}

app.get('/test', async (req, res) => {
  await marketAgent.updateCollections();
  await marketAgent.getCollectionMetadata(Object.keys(marketAgent.collections)[2]);
  res.send(marketAgent.collections);
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