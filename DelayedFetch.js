const nodeFetch = require('node-fetch');

const TIME_BETWEEN_REQUESTS = 5;

const TIME_FOR_WAIT_INTERVAL = 1;

class DelayedFetch{
    constructor() {
        this.wait = false;
    }

    async queue(url) {
        return new Promise(async (resolve,reject) => {
            if (!this.wait) {
                resolve(this.fetch(url));
            } else {
                console.log('warte bis queue frei');
                const waitInterval = await setInterval(async () => {
                    if(!this.wait) {
                        clearInterval(waitInterval);
                        resolve(await this.fetch(url))
                        //return ;
                    }
                }, TIME_FOR_WAIT_INTERVAL * 1000)
            }
        });
    }

    async fetch(url) {
        this.wait = true;
        setTimeout(() => {
            this.wait = false;
        }, TIME_BETWEEN_REQUESTS * 1000);
        const ret = await nodeFetch(url);
        return ret;
    }
}

module.exports = DelayedFetch;