/**
 * fetches and structures data from steam market web page
 */

const fetch = require('node-fetch');
const Parser = require('node-html-parser');
const fs = require('fs');

class SteamMarketHelper {
  constructor() {
    this.steamUrl = 'https://steamcommunity.com/market/search?appid=730';
  }

  async updateCollections() {
    const marketPageReq = await fetch(this.steamUrl);

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
  }

  async getCollectionMetadata(collectionName) {

    // all weapons of given collection, without Statrak, field-tested (to minimize data fetch)
    const url = `${this.steamUrl}&category_730_Exterior%5B%5D=tag_WearCategory2&category_730_ItemSet%5B%5D=tag_${collectionName}&category_730_Quality%5B%5D=tag_normal`;

    const allItemsFetched = false;

    const firstMarketPageReq = await fetch(`${url}#p1_price_asc`);
    if (firstMarketPageReq.status !== 200) {
      throw new Error(`Could not get Items from Collection ${collectionName}, got statusCode ${firstMarketPageReq.status}`);
    }

    const firstMarketPage = await firstMarketPageReq.text();

    fs.writeFileSync('./tmp/log.txt', firstMarketPage, { flag: 'w+' });


    const pageRoot = Parser.parse(firstMarketPage);
    const resultAmount = parseInt(pageRoot.querySelectorAll('#searchResults_total')[0].text);
    const pageAmount = Math.ceil(resultAmount / 10);

    console.log(`amount of pages: ${pageAmount}`);


    // fetch all items of given collections

    /*
    while (!allItemsFetched) {
      const marketPage = await fetch(url);
    }; */
  }
}

module.exports = SteamMarketHelper;
