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
        }
    }

}

module.exports = DbHandler;