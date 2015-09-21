var http = require('http');
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');



http.createServer(function (req, res) {
    // Connection URL
    var url = 'mongodb://localhost:27017/myproject';
// Use connect method to connect to the Server
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        console.log("Connected correctly to server");

        db.close();
    });
    res.writeHead(200, {"Content-Type": "application/json"});

    res.end("Hello World");

}).listen(2000);
console.log('Server running at http://127.0.0.1:2000/');