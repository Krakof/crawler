var http = require('http');

http.createServer(function (req, res) {

    var MongoClient = require('mongodb').MongoClient
        , assert = require('assert');
    // Connection URL
    var url = 'mongodb://localhost:27017/crawler';

    // Use connect method to connect to the Server
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var blogs = db.collection("Blogs");
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
        var halfHour = new Date(new Date() - new Date(30*60000));
        console.log(halfHour);
        var json ={};
        blogs.find({$or: [{status: "new"},{$and: [{status:"queued"}, {queuedTime: {$lt: halfHour}}]}]})
            .toArray(function (err,results) {
                //console.dir(results);
                json = JSON.stringify(results);
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(json);
                db.close();
            });
        //});

        console.log("Connected correctly to server");

    });


}).listen(2000);
console.log('Server running at http://127.0.0.1:2000/');