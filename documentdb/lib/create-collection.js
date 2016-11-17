module.exports = function(client, dbName, collName, callback) {
    const querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [ {
            name: '@id',
            value: dbName
       } ]
    }

    client.queryDatabases(querySpec).toArray(function(err, results) {
        if (err) {
            callback(err);
            return;
        }

        db = results[0];
        if (!db) {
            callback(new Error('database not found: ' + dbName));
            return;
        }
        client.createCollection(db._self, { id: collName }, callback);
    });
}
