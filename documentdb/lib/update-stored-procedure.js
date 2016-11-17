/*
 TODO: deal with case when server does not accept query?
 TODO: break code down into smaller functions
 */
module.exports = function(client, dbName, collName, sproc, callback) {
    const querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [ { name: '@id', value: dbName } ]
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
        client.queryCollections(db._self, querySpec).toArray(function(err, results) { 
            if (err) {
                callback(err);
                return;
            }
            const collection = results[0];
            if (!collection) {
                callback(new Error('collection not found: ' + collName));
                return;
            }
            querySpec.parameters[0].value = sproc.id;
            client.queryStoredProcedures(collection._self, querySpec).toArray(function(err, results) {
                if (err) {
                    callback(err);
                    return;
                }
                if (!results[0]) {
                    client.createStoredProcedure(collection._self, sproc, callback);
                }
                else {
                    const body = results[0].body;
                    // crude way to detet if procedure has changed
                    if (results[0].body.toString() == sproc.body.toString()) {
                        console.log('Stored procedure is up to date');
                        callback(err, results);
                    }
                    else {
                        client.replaceStoredProcedure(results[0]._self, sproc, callback);
                    }
                }
            })
        }) 
    })
}
