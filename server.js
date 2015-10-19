var http = require('http');
var url = require("url");
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var urlDb = 'mongodb://localhost:27017/crawler';
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
            _id:["required", "string"],
            domain: ["required", "string"],
            originDomain: ["required", "string"],
            engine: ["required", "string"],
            pr: ["required", "number"],
            trustflow: ["required", "number"],
            keywords: ["string"],
            metaKeywords: ["string"],
            status: ["required", "string"]
        };
        function Validator () {
            this["requiredValidate"] = function (el) {
                var value = (el)||(el === 0)? true:false;
                return objWrap(value,"required")
            };

            this["stringValidate"] = function (el) {
                if (Array.isArray(el)) {
                    for(var b=0; b<el.length; b++) {
                        if (!stringEl(el[b])) {
                            return objWrap(false,"string")
                        }
                    }
                    return objWrap(true,"string")
                } else {
                    value = stringEl(el);
                    return objWrap(value,"string")
                }
            };

            this["numberValidate"] = function (el,key) {
                   var value = (typeof el === "number");
                   return objWrap(value,"number")
            };
            function objWrap(value,name) {
                var obj = {};
                obj[name] = value;
                return [obj, value];
            }
            function stringEl (elem) {
                var value = (typeof elem === "string");
                return value;
            }
            this.validate = function(elem) {
                var tempErr;
                var errArr = [];
                for (var key in schema) {
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
                return errArr;
            };
        }

        switch(req.method) {
            case 'GET':
                var n= parseInt(url.parse(req.url,true).query.n);
                var count = (n)?n:10;
                blogs.find({$or: [{status: "new"},{$and: [{status:"queued"}, {queuedTime: {$lt: halfHour}}]}]}).limit(count)
                    .toArray(function (err,results) {
                        jsonGet = JSON.stringify(results);
                        res.writeHead(200, {"Content-Type": "application/json"});
                        res.end(jsonGet);
                        console.log("GET");
                        if (results.length>0) {
                           for (var c = 0; c < results.length; c++) {
                               blogs.update({"_id": ObjectId(results[c]._id)}, {
                                   $set: {
                                       status: "queued",
                                       queuedTime: new Date()
                                   }
                               }, {fullresult: true}, function (err, result) {
                                   if (err) {
                                       console.log(err.message);
                                   }
                               });
                           }
                        }
                    });
                break;
            case 'PUT':
                console.log("PUT");
                req.on('data', function (chunk) {
                    try {
                        jsonPut = JSON.parse(chunk);
                    } catch (err) {
                        res.writeHead(422, {"Content-Type": "application/json"});
                        res.end(err.name);
                        return;
                    }
                    var valid = new Validator();
                    var docErrArr;
                    var uptadeArr = [];

                    for(var j=0; j<jsonPut.length; j++){
                        var tempObj = {};
                        docErrArr = valid.validate(jsonPut[j]);
                        console.log(jsonPut[j]);
                        if (docErrArr.length >0) {
                            docErrArr = JSON.stringify(docErrArr);
                            console.log(docErrArr);
                            res.writeHead(422, {"Content-Type": "application/json"});
                            res.end(docErrArr);
                            return;
                        }
                        tempObj._id = jsonPut[j]._id;
                        tempObj["params"] = {};
                        for(var k in jsonPut[j]) {
                            if (k != "_id"){
                                if (k === "status") {
                                    tempObj["params"][k] = "done";
                                } else {
                                    tempObj["params"][k] = jsonPut[j][k];
                                }
                            }
                        }
                        uptadeArr.push(tempObj);
                    }
                    console.log(uptadeArr.length);
                    for (var a=0;a<uptadeArr.length; a++){
                            blogs.update({"_id":ObjectId(uptadeArr[a]._id)}, {$set:uptadeArr[a].params}, {fullResult: true},function (err,r) {
                            if (err){
                                res.writeHead(422, {"Content-Type": "application/json"});
                                res.end(JSON.stringify(err.message));
                                return;
                            } else {
                                console.log(r.result.n);
                            }
                        });
                    }
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end("Input done");
                });
        }
}).listen(2000);
console.log('Server running at http://127.0.0.1:2000/');