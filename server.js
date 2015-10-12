var http = require('http');
var url = require("url");
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var Promise = require('promise');
var monk = require('monk');
var db= monk('localhost:27017/crawler');

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
                return errArr;
            };
        }

        function writeTo() {
            blogs.insert(dataToSave);
        }

        switch(req.method) {
            case 'GET':
                blogs.find({$or: [{status: "new"},{$and: [{status:"queued"}, {queuedTime: {$lt: halfHour}}]}]})
                    .toArray(function (err,results) {
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
                        console.log(uptadeArr[a]._id);
                            blogs.update(uptadeArr[a]._id, uptadeArr[a].params, function (err, result) {
                            console.log(result);
                            console.log(err);
                        });
                    }
                });
        }
}).listen(2000);
console.log('Server running at http://127.0.0.1:2000/');