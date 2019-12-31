const fetch = require('node-fetch');

class SteamMarketHelper {

  constructor() {
    this.steamUrl = 'https://steamcommunity.com/market/search?appid=730';
  }

  async getCollectionNames() {
    const marketPageReq = await fetch(this.steamUrl);

    if (marketPageReq.status !== 200) {
      throw new Error('Could not get Steam Market Page');
    }

    const marketPage = await marketPageReq.text();
    const marketFilterJson = JSON.parse(marketPage.match(/(?<=(g_rgFilterData\s=\s)).*(?=;)/g));

    const categoriesJson = marketFilterJson['730_ItemSet']['tags'];

    const collections = Object.values(categoriesJson).map((entry) => entry.localized_name).filter((collectionName) => collectionName.indexOf('Collection') > -1);

    return collections;
  }
}

module.exports = SteamMarketHelper;
