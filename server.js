var http = require('http');
var url = require("url");
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var urlDb = 'mongodb://localhost:27017/crawler';
var db;
MongoClient.connect(urlDb, function(err, database) {
    if (err) throw err;
    db = database;
    console.log("Connected correctly to server");
});

http.createServer(function (req, res) {
        var blogs = db.collection("Blogs");
        var halfHour = new Date(new Date() - new Date(30*60000));
        var jsonGet = {},
            jsonPut = {};
        var schema = {
            _id:["required", "string", "exist"],
            domain: ["required", "string"],
            originDomain: ["required", "string"],
            engine: ["required", "string"],
            pr: ["required", "number"],
            trustflow: ["required", "number"],
            keywords: ["required", "string"],
            metaKeywords: ["required", "string"],
            status: ["required", "string"]
        };
        var dataToSave = [];
        function Validator () {
            this["requiredValidate"] = function (el) {
                return (el)||(el === 0)? true:false;
            };

            this["stringValidate"] = function (el) {
                return typeof el === "string";
            };

            this["numberValidate"] = function (el) {
                return typeof el === "number";
            };
            this["existValidate"] = function(el){
                //collection.count({_id: ObjectId("5601201ba7b8dbdf6aaa970c")}, function(err,count){
                //     //matches = count>0;
                //     console.log(count);
                // });
                var matches;
                blogs.count({_id: ObjectId(el)},function(err,count){
                    matches = count>0;
                    console.log(matches);
                });
                return matches;
            };
            this.validate = function(elem) {
                var errArr = [];

                //blogs.count({status:"new"}, function(err,count){
                //    //matches = count>0;
                //    console.log(count);
                //});
                for (var j=0;j<elem.length;j++) {
                    var toggle=0;
                    for (var key in schema) {
                        for (var i = 0; i < schema[key].length; i++) {
                            var isTrue = this[schema[key][i] + "Validate"](elem[j][key]);

                            if (!isTrue) {
                                errArr.push("recordId:" + elem[j]["_id"] + ":" + key + ":" + elem[j][key] + ":" + schema[key][i] + "(" + isTrue + ")");
                                toggle = 1;
                            }

                            console.log(elem[j][key] + ":" + schema[key][i]+"("+isTrue+")");
                        }
                    }
                    if (!toggle) dataToSave.push(elem[j]);
                }
                console.log(errArr);
                //console.log(dataToSave);
            };
        }

        //function idValidate(id){
        //    var matches;
        //    blogs.count({_id: ObjectId(id)}, function(err,count){
        //         matches = count>0;
        //        console.log(count);
        //     });
        //    //blogs.find({status: "new"}).toArray(function(err,res) {
        //    //    //        //matches = count>0;
        //    //    console.log(res);
        //    //    //    });
        //    //    //return matches;
        //    //});
        //}

        function writeTo() {
            blogs.insert(dataToSave);
        }

        switch(req.method) {
            case 'GET':
                var y =false;
                var str= "5601201ba7b8dbdf6aaa970c";
                    blogs.count({_id: ObjectId(str)},function(err, count){
                    y= count>0;
                        console.log(str, y, count);
                });
                //blogs.find({_id: ObjectId("5601201ba7b8dbdf6aaa970c")})
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
                    var valid = new Validator();
                    //valid["existValidate"] = idValidate;
                    valid.validate(jsonPut);
                    //console.log(jsonPut);
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


        //db.close();

    //});


}).listen(2000);
console.log('Server running at http://127.0.0.1:2000/');