var http = require('http');
var url = require("url");
//var async = require("async");
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var Promise = require('promise');
var monk = require('monk');
//var urlDb = 'mongodb://localhost:27017/crawler';
var db= monk('localhost:27017/crawler');
//MongoClient.connect(urlDb, function(err, database) {
//    if (err) throw err;
//    db = database;
//    console.log("Connected correctly to server");
//});

http.createServer(function (req, res) {
        var blogs = db.get("Blogs");
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
        var countDocs=[];
        function Validator () {
            this["requiredValidate"] = function (el) {
                //return (el)||(el === 0)? true:false;
                return new Promise(function(resolve,reject){
                    var value = (el)||(el === 0)? true:false;
                    resolve(objWrap(el,value,"required"));
                })
            };

            this["stringValidate"] = function (el) {
                return new Promise(function(resolve,reject){
                    var value = (typeof el === "string");
                    resolve(objWrap(el,value,"string"));
                })
            };

            this["numberValidate"] = function (el,key) {
                return new Promise(function(resolve,reject){
                    var value = (typeof el === "number");
                   resolve(objWrap(el,key,value,"number"))
                });
            };

            this["existValidate"] = function(el){

                        return blogs.count({_id: ObjectId(el)}).then(function(count){
                            var value = count>0;
                            return objWrap(el,value,"exist");
                        });

                        //countDocs.push(count>0);

            };
            function objWrap(el,key,value,name) {
                var obj = {};
                obj[elkey+"("+name+")"] = value;
                return obj;
            }
            this.validate = function(elem,num, callback) {
                var isTrue = [];
                for (var key in schema) {
                    for (var i = 0; i < schema[key].length; i++) {
                        isTrue.push(this[schema[key][i] + "Validate"](elem[key],key));
                    }
                }
                Promise.all(isTrue).then(function(results){

                    var errArr = [];
                    for (var t=0; t<results.length; t++) {
                        for (var k in results[t]) {
                            if (!results[t][k]) {
                                errArr.push(results[t]);
                            }
                        }
                    }
                    console.log(errArr);
                    if (errArr.length > 0) {
                        callback(false,errArr);
                    } else {
                        //console.log(k);
                        callback(true,num);
                    }
                });
            };
        }

        function writeTo() {
            blogs.insert(dataToSave);
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
                    var valid = new Validator();
                    //valid["existValidate"] = idValidate;
                    for(var j=0; j<jsonPut.length; j++){
                        valid.validate(jsonPut[j],j, function(toggle,num){
                            if (toggle) {
                                //console.log(jsonPut[num]);
                                //blogs.insert(jsonPut[j]);
                            } else {
                                //console.log("This document has errors")
                            }

                        });

                    }

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