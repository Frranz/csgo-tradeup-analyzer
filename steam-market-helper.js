/**
 * fetches and structures data from steam market web page
 */

/**
 * Collections Data Structure:
 *  [
 *    {
 *      key: set_community_1,
 *      name: the phoenix collection,
 *      items: [
 *        {
 *             skin: case-hardened
 *             weapon: ak47 
 *             conditions: {
 *                 factory_new: {
 *                     price:2.50
 *                     amount: 2
 *                 },
 *                 battle_scared: {
 *                     price:1,30
 *                     amount: 2
 *                 },
 *                 minimal_wear:{
 *                     price:1,30
 *                     amount: 2
 *                 }, 
 *        },
 *      ]
 *    }
 * ]
 */

const DelayedFetch = require('./DelayedFetch');
const Parser = require('node-html-parser');
const fs = require('fs');

const Rarity = require('./cs-weapon-rarity');
const Condition = require('./cs-weapon-condition');

const STEAM_CSGO_URL = 'https://steamcommunity.com/market/search?appid=730';
const STEAM_CSGO_ONLY_DATA_URL = 'https://steamcommunity.com/market/search/render/?query=&start=0&count=10000&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=730&norender=1';

const PARAM_UPGRADABLE_WEAPONS = 'category_730_Weapon%5B%5D=any&category_730_Type%5B%5D=tag_CSGO_Type_Pistol&category_730_Type%5B%5D=tag_CSGO_Type_SMG&category_730_Type%5B%5D=tag_CSGO_Type_Rifle&category_730_Type%5B%5D=tag_CSGO_Type_SniperRifle&category_730_Type%5B%5D=tag_CSGO_Type_Shotgun&category_730_Type%5B%5D=tag_CSGO_Type_Machinegun'; 
const PARAM_COLLECTION = 'category_730_ItemSet%5B%5D=tag_';
const PARAM_ONLY_NORMAL_SKINS = 'category_730_Quality%5B%5D=tag_normal';
const PARAM_WEAR_QUALITY = 'category_730_Exterior%5B%5D=tag_WearCategory';
const PARAM_RARITY = 'category_730_Rarity%5B%5D=tag_Rarity_';

const delayedFetch = new DelayedFetch();

class SteamMarketHelper {
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

    // shorten for test purposes
    const collectionsOld = this.collections;
    this.collections = {};
    this.collections[Object.keys(collectionsOld)[0]] = Object.values(collectionsOld)[0];    
  }

  async getAllCollectionsMetadata() {
      const collections = [];
      for (let collection of Object.entries(this.collections)) {
        console.log(`getting collection ${collection[1]}`);
        const coll = await this.getCollectionMetadata(collection[0]);
        collections.push(...coll);
        console.log('got collection');
      }

      return collections;
  }

  async getCollectionMetadata(collectionName) {

    const collection = [];

    for (let index = 0; index < Rarity.length; ++index) {
        console.log(`getting rarity ${Rarity[index]}`);
        try {
            const skins = await this.getWeaponsByCollectionAndByRarity(collectionName, index);
            collection.push(...skins);
        } catch(e) {
            console.error(`failed getWeaponsByCollectionAndByRarit(${collectionName},${index})`);
            console.error(e);
            collection.push({});
        }
    }

    return collection;
  }

  async getWeaponsByCollectionAndByRarity(collectionName,rarity) {
      const collection = {};
    const url = `${STEAM_CSGO_ONLY_DATA_URL}&${PARAM_COLLECTION}${collectionName}&${PARAM_UPGRADABLE_WEAPONS}&${PARAM_ONLY_NORMAL_SKINS}&${PARAM_RARITY}${Rarity[rarity]}`;//&${PARAM_WEAR_QUALITY}0`;

    const getCollectionData = await delayedFetch.queue(url);
    if (getCollectionData.status !== 200) {
      throw new Error(`Could not get Items from Collection ${collectionName}, got statusCode ${getCollectionData.status}`);
    }

    const colllectionJson = await getCollectionData.json();
    
    return colllectionJson.results.map((result) => {
      const weaponData = this.extractWeaponData(result.hash_name);
      return {
        weapon: weaponData.weapon,
        skin: weaponData.skin,
        condition: Condition.indexOf(weaponData.condition),
        price: result.sale_price_text.substr(1),
        amount: result.sell_listings,
        rarity: rarity,
      }
    });

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
}

module.exports = SteamMarketHelper;
