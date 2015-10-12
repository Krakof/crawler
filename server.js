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
            _id:["required", "string"],
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
                var value = (el)||(el === 0)? true:false;
                return objWrap(value,"required")
            };

            this["stringValidate"] = function (el) {
                var value = (typeof el === "string");
                return objWrap(value,"string")
            };

            this["numberValidate"] = function (el,key) {
                   var value = (typeof el === "number");
                   return objWrap(value,"number")
            };

            //this["existValidate"] = function(el){
            //
            //            return blogs.count({_id: ObjectId(el)}).then(function(count){
            //                var value = count>0;
            //                return objWrap(el,value,"exist");
            //            });
            //
            //            //countDocs.push(count>0);
            //
            //};
            function objWrap(value,name) {
                var obj = {};
                obj[name] = value;
                return [obj, value];
            }
            this.validate = function(elem,num, callback) {
                var tempErr;
                var errArr = [];
                for (var key in schema) {
                    var isTrue = [];
                    var resObj ={};
                    for (var i = 0; i < schema[key].length; i++) {
                        tempErr = this[schema[key][i] + "Validate"](elem[key],key);
                        if (!tempErr[1]){
                            resObj.documentID =  elem["_id"];
                            resObj[key] = tempErr[0];
                            errArr.push(resObj);
                            break;
                        }
                    }
                }


<<<<<<< HEAD
                console.log(errArr);
=======
                //console.log(errArr);
>>>>>>> 688ab99a20037f97ba75b27d6acfb7ee15ff200a
                return errArr;
                //Promise.all(isTrue).then(function(results){
                //    console.log(results);
                //    var errArr = [];
                //    for (var t=0; t<results.length; t++) {
                //        for (var k in results[t]) {
                //            if (!results[t][k]) {
                //                errArr.push(results[t]);
                //            }
                //        }
                //    }
                //    //console.log(errArr);
                //    if (errArr.length > 0) {
                //        callback(false,errArr);
                //    } else {
                //        //console.log(k);
                //        callback(true,num);
                //    }
                //});
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
                    var docErrArr;
<<<<<<< HEAD
                    for(var j=0; j<jsonPut.length; j++){
                        docErrArr = valid.validate(jsonPut[j]);
                        if (docErrArr.length >0) {
                            res.end(docErrArr);
                            return;
                        }
                    }
                    for
                    blogs.update(jsonPut,{w:1, multi: true},function(err, result){
                        console.log(result);
                        console.log(err);
                    });
=======
                    var uptadeArr = [];

                    for(var j=0; j<jsonPut.length; j++){
                        var tempObj = {};
                        docErrArr = valid.validate(jsonPut[j]);
                        if (docErrArr.length >0) {
                            docErrArr = JSON.stringify(docErrArr);
                            res.end(docErrArr);
                            return;
                        }
                        tempObj._id = jsonPut[j]._id;
                        tempObj["params"] = {};
                        for(var k in jsonPut[j]) {
                            if (k != "_id"){
                                tempObj["params"][k] = jsonPut[j][k];
                            }
                        }
                        uptadeArr.push(tempObj);
                    }
                    for (var a=0;a<uptadeArr.length; a++){
                            blogs.update(uptadeArr[a]._id, uptadeArr[a].params, function (err, result) {
                            console.log(result);
                            console.log(err);
                        });
                    }
>>>>>>> 688ab99a20037f97ba75b27d6acfb7ee15ff200a
                    //console.log(jsonPut);
                });
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