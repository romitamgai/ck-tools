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

        const db = results[0];
        if (!db) {
            callback(new Error('database not found: ' + dbName));
            return;
        }
        querySpec.parameters[0].value = collName;
        client.queryCollections(db._self, querySpec).toArray(callback);
    })
}
