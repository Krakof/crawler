var http = require('http');
var url = require("url");
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

http.createServer(function (req, res) {

    // Connection URL
    var urlDb = 'mongodb://localhost:27017/crawler';
    //var parsedJson = JSON.parse(req); // true to get query as object

    // Use connect method to connect to the Server
    MongoClient.connect(urlDb, function(err, db) {
        if (err) throw err;
        var blogs = db.collection("Blogs");
        var halfHour = new Date(new Date() - new Date(30*60000));
        //console.log(halfHour);
        var jsonGet = {},
            jsonPut = {};
        var schema = {
            domain: ["required", "string"],
            originDomain: ["required", "string"],
            engine: ["required", "string"],
            pr: ["required", "integer"],
            trustflow: ["required", "integer"],
            keywords: ["required", "string"],
            metaKeywords: ["required", "string"],
            status: ["required", "string"]
        };
        function requiredValidate(elem) {
           return !elem;
        }
        function stringValidate (elem){
                return typeof elem === "string";
        }
        function integerValidate (elem){
            return typeof elem === "integer";
        }
        switch(req.method) {
            case 'GET':
                blogs.find({$or: [{status: "new"},{$and: [{status:"queued"}, {queuedTime: {$lt: halfHour}}]}]})
                    .toArray(function (err,results) {
                        //console.dir(results);
                        jsonGet = JSON.stringify(results);
                        res.writeHead(200, {"Content-Type": "application/json"});
                        res.end(jsonGet);
                        console.log("GET");
                        db.close();
                    });
                break;
            case 'PUT':
                console.log("PUT");
                req.on('data', function (chunk) {
                    jsonPut = JSON.parse(chunk);
                    for (var key in schema) {
                        for (var i= 0; i < schema[key].length; i++){
                            var isTrue = this[schema[key][i] + "Validate"](jsonPut[key]);
                        }
                    }
                    console.log(jsonPut);
                    db.close();
                });
                break;
        }

        //blogs.insert( {
        //    domain: "domain6.com/page",
        //    originDomain: "domain6.com",
        //    engine: "Presta",
        //    pr: 8,
        //    trustflow: 356,
        //    keywords: "key1 key2 key3",
        //    metaKeywords: "metakey1 metakey2 metakey3",
        //    status: "queued",
        //    queuedTime: new Date()
        //},function(err, results){
        //    if (err) throw err;
        //    {
        //        domain: "domain2.com/page",
        //        originDomain: "domain2.com",
        //        engine: "JM",
        //        pr: 4,
        //        trustflow: 16,
        //        keywords: "key1 key2 key3",
        //        metaKeywords: "metakey1 metakey2 metakey3",
        //        status: "done"
        //    },
        //    {
        //        domain: "domain3.com/page",
        //        originDomain: "domain3.com",
        //        engine: "Presta",
        //        pr: 5,
        //        trustflow: 625,
        //        keywords: "key1 key2 key3",
        //        metaKeywords: "metakey1 metakey2 metakey3",
        //        status: "queued",
        //        queuedTime: new Date()
        //    },
        //    {
        //        domain: "domain4.com/page",
        //        originDomain: "domain4.com",
        //        engine: "WP",
        //        pr: 0,
        //        trustflow: 356,
        //        keywords: "key1 key2 key3",
        //        metaKeywords: "metakey1 metakey2 metakey3",
        //        status: "processing"
        //    },
        //    {
        //        domain: "domain5.com/page",
        //        originDomain: "domain5.com",
        //        engine: "JM",
        //        pr: 6,
        //        trustflow: 35,
        //        keywords: "key1 key2 key3",
        //        metaKeywords: "metakey1 metakey2 metakey3",
        //        status: "queued",
        //        queuedTime: new Date()
        //    }]


        //if (!Object.keys(queryAsObject).length) console.log("Empty obj");
        //});

        console.log("Connected correctly to server");

    });


}).listen(2000);
console.log('Server running at http://127.0.0.1:2000/');