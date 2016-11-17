const findCollection = require('../lib/find-collection.js');

module.exports = function(client, dbName, collName, spName, args, callback) {
    findCollection(client, dbName, collName, function(err, results) {
        if (err) {
            callback(err);
            return;
        }
        const collection = results[0];
        if (!collection) {
            callback(new Error('collection not found: ' + collName));
            return;
        }
        const querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [ {
                name: '@id',
                value: spName
           } ]
        }
        client.queryStoredProcedures(collection._self, querySpec).toArray(function(err, results) {
            if (err) {
                callback(err);
                return;
            }
            sproc = results[0];
            if (!sproc) {
                callback(new Error('stored procedure not found: ' + spName));
                return;
            }
            client.executeStoredProcedure(sproc._self, args, callback);
        })
    })
}
