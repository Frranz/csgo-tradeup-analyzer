class DbHandler{
    constructor(db) {
        this.db = db;
    }

    /**
     * 
     * @param   {Array} entries - Entries is a two dimensional array. Subarrays have the collection_key as first value and the name as second
     * @returns {Integer}       - Number of entries that were new
     */
    async updateCollections(entries) {
        let conn;
        try {
            conn = await this.db.getConnection();


            const query = `INSERT IGNORE INTO collections (\`key\`,\`name\`) VALUES${'(?,?),'.repeat(entries.length).slice(0,-1)}`;
            
            const result = await conn.query(query,entries.flat());

            return result.affectedRows;
        } catch (e){
            console.error('failed to update collections in database');
            console.error(e);
            return 0;
        } finally {
            if(conn) conn.release();
        }
    }

    async saveSkins(someSkins){
        let conn;

        try {
            conn = await this.db.getConnection();

            const insertSkinsQuery = `INSERT IGNORE INTO skins(\`name\`,\`weapon\`,\`collection_key\`,\`rarity\`) VALUES${'(?,?,?,?),'.repeat(someSkins.length).slice(0,-1)}`;
            const insertSkins = await conn.query(insertSkinsQuery,someSkins.map(skin => [skin.skin,skin.weapon,skin.collection,skin.rarity]).flat());

            return insertSkins.affectedRows;
        } catch(e) {
            console.error('failed to insert skins into db');
            console.error(e);
            return 0;
        }finally {
            if(conn) conn.release();
        }
    }

    async saveSkinCoinditions(skinConditions){
        if (skinConditions.length === 0) {
            return 0;
        }

        let conn;
        let skinToId = {};
        try {
            conn = await this.db.getConnection();

            const uniqueSkins = [... new Set(skinConditions.map(entry => [entry.weapon,entry.skin]))];
            const getSkinsQuery = `SELECT id,weapon,name FROM skins WHERE weapon IN (${'?,'.repeat(uniqueSkins.length).slice(0,-1)}) AND name IN (${'?,'.repeat(uniqueSkins.length).slice(0,-1)})`;
            const getSkinKeys = await conn.query(getSkinsQuery, [skinConditions.map(entry => entry.weapon),skinConditions.map(entry => entry.skin)].flat());

            // this is so disgusting
            skinConditions.map(skinCondition => {
                for (const skinKey of getSkinKeys) {
                    if (skinKey.name === skinCondition.skin && skinKey.weapon === skinCondition.weapon) {
                        skinCondition['skinId'] = skinKey.id;
                        break;
                    }
                }
            });

            const query = `INSERT IGNORE INTO skin_conditions (\`skin_id\`,\`condition_id\`,\`price\`,\`amount\`) VALUES${'(?,?,?,?),'.repeat(skinConditions.length).slice(0,-1)}`;
            
            const result = await conn.query(query,skinConditions.map(cond => [cond.skinId,cond.condition,cond.price,cond.amount]).flat());

            return result.affectedRows;
        } catch (e){
            console.error('failed to update collections in database');
            console.error(e);
            return 0;
        }finally {
            if(conn) conn.release();
        }
    }
}

module.exports = DbHandler;