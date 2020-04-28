/**
 * fetches and structures data from steam market web page
 */

const DelayedFetch = require('./DelayedFetch');
const Parser = require('node-html-parser');
const fs = require('fs');

const Rarity = require('./steam-helper/cs-weapon-rarity');
const Condition = require('./steam-helper/cs-weapon-condition');

const STEAM_CSGO_URL = 'https://steamcommunity.com/market/search?appid=730';
const STEAM_CSGO_ONLY_DATA_URL = 'https://steamcommunity.com/market/search/render/?query=&start=0&count=10000&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=730&norender=1';

const PARAM_UPGRADABLE_WEAPONS = 'category_730_Weapon%5B%5D=any&category_730_Type%5B%5D=tag_CSGO_Type_Pistol&category_730_Type%5B%5D=tag_CSGO_Type_SMG&category_730_Type%5B%5D=tag_CSGO_Type_Rifle&category_730_Type%5B%5D=tag_CSGO_Type_SniperRifle&category_730_Type%5B%5D=tag_CSGO_Type_Shotgun&category_730_Type%5B%5D=tag_CSGO_Type_Machinegun';
const PARAM_COLLECTION = 'category_730_ItemSet%5B%5D=tag_';
const PARAM_ONLY_NORMAL_SKINS = 'category_730_Quality%5B%5D=tag_normal';
const PARAM_WEAR_QUALITY = 'category_730_Exterior%5B%5D=tag_WearCategory';
const PARAM_RARITY = 'category_730_Rarity%5B%5D=tag_Rarity_';

const delayedFetch = new DelayedFetch();

class SteamMarketAgent {

  constructor(dbHandler) {
    this.dbHandler = dbHandler;
  }

  async test() {
    console.log(await this.getAllUpgradeProfits());
    console.log('test finished');
  }

  async updateCollections() {
    const marketPageReq = await delayedFetch.queue(STEAM_CSGO_URL);

    if (marketPageReq.status !== 200) {
      throw new Error('Could not get Steam Market Page');
    }

    const marketPage = await marketPageReq.text();
    const marketFilterJson = JSON.parse(marketPage.match(/(?<=(g_rgFilterData\s=\s)).*(?=;)/g));

    const categoriesJson = marketFilterJson['730_ItemSet']['tags'];

    this.collections = {};
    Object.entries(categoriesJson).forEach((entry) => {
      if (entry[1].localized_name.indexOf('Collection') > -1) {
        this.collections[entry[0]] = entry[1].localized_name;
      }
    });

    const newCollections = await this.dbHandler.updateCollections(Object.entries(this.collections));
    console.log(`${newCollections} new collections found`);
  }

  async getAllCollectionsMetadata() {
      const collections = [];

      // doable without counter, but would be ugly
      let counter = 0;
      for (let collection of Object.entries(this.collections)) {
        console.log(`getting collection ${collection[1]} (${counter + 1}/${Object.keys(this.collections).length})`);
        const coll = await this.getCollectionMetadata(collection[0]);
        collections.push(...coll);
        console.log('got collection');
        ++counter;
      }

      return collections;
  }

  async getCollectionMetadata(collectionName) {

    const collection = [];

    for (let index = 0; index < Rarity.length; ++index) {
        console.log(`getting rarity ${Rarity[index]} (${index + 1}/${Rarity.length})`);
        try {
            const addedSkins = await this.getWeaponsByCollectionAndByRarity(collectionName, index);
            console.log(`added ${addedSkins} new skins to db`);
        } catch(e) {
            console.error(`failed getWeaponsByCollectionAndByRarit(${collectionName},${index})`);
            console.error(e);
        }
    }

    return collection;
  }

  async getWeaponsByCollectionAndByRarity(collectionName,rarity) {
    if (await this.dbHandler.checkedCollectionRarityRecently(collectionName,rarity)) {
      console.log('not fetching again, because was checked recently');
      return 0;
    }
    const collection = {};
    const url = `${STEAM_CSGO_ONLY_DATA_URL}&${PARAM_COLLECTION}${collectionName}&${PARAM_UPGRADABLE_WEAPONS}&${PARAM_ONLY_NORMAL_SKINS}&${PARAM_RARITY}${Rarity[rarity]}`;//&${PARAM_WEAR_QUALITY}0`;

    const getCollectionData = await delayedFetch.queue(url);
    if (getCollectionData.status !== 200) {
      throw new Error(`Could not get Items from Collection ${collectionName}, got statusCode ${getCollectionData.status}`);
    }

    const colllectionJson = await getCollectionData.json();

    const someSkins = colllectionJson.results.map((result) => {
      const weaponData = this.extractWeaponData(result.hash_name);
      return {
        collection: collectionName,
        weapon: weaponData.weapon,
        skin: weaponData.skin,
        condition: Condition.indexOf(weaponData.condition),
        price: result.sale_price_text.substr(1),
        amount: result.sell_listings,
        rarity: rarity,
      }
    });

    await this.dbHandler.saveSkins(someSkins);
    const addedSkins = await this.dbHandler.saveSkinCoinditions(someSkins);
    return addedSkins;

    /*colllectionJson.results.forEach((entry) => {

        const skinKey = `${weaponData.weapon}#${weaponData.skin}`.replace('.','');
        if(!(skinKey in collection)) {
            collection[skinKey] = {
                weapon: weaponData.weapon,
                skin: weaponData.skin,
                condition: {},
            }
        }

        collection[skinKey].condition[weaponData.condition] = {
            price: entry.sale_price_text.substr(1),
            amount: entry.sell_listings,
        }
    });
    return collection;*/
  }

  /**
   * MAG-7 | Metallic DDPAT (Factory New) => {
   *    weapon: 'MAG-7',
   *    skin:   'Metallic DDPAT',
   *    condition: 'Factory New'
   * }
   * @param {String} text - text from steam market entry
   */
    extractWeaponData(text) {
        const weaponData = {};
        const indexPipe = text.indexOf(' | ');
        const indexOpeningBracket = text.indexOf(' (',indexPipe);

        weaponData.weapon = text.substr(0,indexPipe);
        weaponData.skin = text.substring(indexPipe + 3, indexOpeningBracket);
        weaponData.condition = text.substring(indexOpeningBracket + 2, text.length -1);

        return weaponData;
    }

    async getAllUpgradeProfits() {
      const weaponData = await this.dbHandler.getAllRawUpgradeData();

      const profits = [];
      for (let i = 0; i < weaponData.length- 2;++i) {
        const currentEntry = weaponData[i];
        const nextEntry = weaponData[i+1]

        // check if next entry is same condition and rarity + 1
        if (currentEntry.collection !== nextEntry.collection || currentEntry.condition_id !== nextEntry.condition_id || currentEntry.rarity!==nextEntry.rarity-1) {
          continue;
        }

        const profit = nextEntry.avg - (currentEntry.min * 10);
        const profitRound = Math.round(profit * 100) / 100;

        profits.push(`collection: ${currentEntry.collection_key} rarity: ${Rarity[currentEntry.rarity]} condition: ${Condition[currentEntry.condition_id]} ~price: ${currentEntry.min} upgrade avg profit: ${profitRound}`);
      }

      return profits;
    }
}

module.exports = SteamMarketAgent;
