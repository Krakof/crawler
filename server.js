var http = require('http');
var url = require("url");
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var fs = require('fs');
var ObjectId = require('mongodb').ObjectID;
    function Stats() {
        console.log("Stats request");
        //var blogs = db.collection("Blogs");
        var blogs = db.collection("BlogsDE");
        var stats = db.collection("dbStats");
        var halfHour = new Date(new Date() - new Date(30*60000));
        var statObj = {};
        blogs.count({status: "queued", queuedTime: {$lt: halfHour}},function(err, result){
            statObj["timeout"]=result;
            blogs.count({status: "queued"},function(err, result){
                statObj["queued"]=result;
                blogs.count({status: "done"},function(err, result){
                    statObj["done"]=result;
                    blogs.count({status: "new"},function(err, result) {
                        statObj["new"] = result;
                        console.log(statObj);
                        for (var key in statObj){
                            stats.updateOne({status:key},{$set:{qty:statObj[key]}}, function(){
                                if (err) throw err;
                            })
                        }
                    });
                });
            });
        });
    }
var urlDb = 'mongodb://localhost:27017/crawler';
MongoClient.connect(urlDb, function(err, database) {
    if (err) throw err;
    db = database;
    console.log("Connected correctly to server");
    setInterval(Stats, 600000);
});

http.createServer(function (req, res) {
    //var blogs = db.collection("Blogs");
    var blogs = db.collection("BlogsDE");
    var stats = db.collection("dbStats");
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
        //ot:["required", "number"]
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
            return (typeof elem === "string");
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
            console.log("GET");
            console.log(req.url);
            switch (req.url) {
                case '/favicon.ico':
                    res.writeHead(200, {'Content-Type': 'image/x-icon'});
                    res.end();
                    break;
                case "/reset":
                    blogs.deleteMany({},function(err, results) {
                        if (err) throw err;
                        console.log(results.deletedCount);
                        var sitesArr = [];
                        var counter = 0;
                        var rl = require('readline').createInterface({
                            input: require('fs').createReadStream('sitesDE.txt')
                        });
                        rl.on('line', function (line) {
                            var objDB = {};
                            objDB.status = "new";
                            objDB.domain = line.trim();

                            //Insert JSON

                            // var jsonPut = JSON.parse(line);
                            // for (var key in jsonPut) {
                            //     objDB[key] = jsonPut[key];
                            // }

                            sitesArr.push(objDB);
                            counter++;
                            if (counter === 10000) {
                                blogs.insertMany(sitesArr, function (err, r) {
                                    if (err) throw err;
                                });
                                sitesArr = [];
                                counter = 0;
                            }
                        });
                        rl.on('close', function(){
                            blogs.insertMany(sitesArr, function (err, r) {
                                if (err) throw err;
                                res.writeHead(200, {'Content-Type': 'image/x-icon'});
                                res.end("Insert DB Done");
                            });
                        });
                    });
                    break;
                case "/stats":
                    var statObj = {};
                    stats.find().toArray(function(err,items){
                        for (var i=0; i<items.length;i++){
                            delete items[i]._id;
                            statObj[items[i].status] = items[i].qty;
                        }
                        res.writeHead(200, {"Content-Type": "application/json"});
                        res.end(JSON.stringify(statObj));
                    });
                    break;
                default:
                    var n = parseInt(url.parse(req.url, true).query.n);
                    var count = (n) ? n : 10;
                    blogs.find({$or: [{status: "new"}, {$and: [{status: "queued"}, {queuedTime: {$lt: halfHour}}]}]}).limit(count)
                        .toArray(function (err, results) {
                            var qnty = 0;
                            console.log("Sent: " + results.length);

                            // For Organic traffic parse enable

                            // for (var m=0; m<results.length; m++) {
                            //     delete results[m].keywords;
                            //     delete results[m].metaKeywords;
                            //     delete results[m].engine;
                            //     delete results[m].originDomain;
                            // }

                            jsonGet = JSON.stringify(results);
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(jsonGet);
                            if (results.length > 0) {
                                for (var c = 0; c < results.length; c++) {
                                    blogs.updateOne({"_id": ObjectId(results[c]._id)},
                                        {$set: {
                                                status: "queued",
                                                queuedTime: new Date()
                                            }
                                        }, {fullresult: true}, function (err, r) {
                                            if (err) {
                                                console.log(err.message);
                                            }
                                    });
                                    if (results[c].status === "new") qnty++;
                                }
                                console.log("New documents sent: " + qnty);
                            }
                        });
            }
            break;
        case 'PUT':
            var data="";
            req.on('data', function(chunk){
                data+=chunk;
            });
            console.log("PUT");
            req.on('end', function () {
                try {
                    jsonPut = JSON.parse(data);
                    if (!jsonPut) {
                        res.writeHead(422, {"Content-Type": "application/json"});
                        res.end("JSON err: " + jsonPut);
                        return console.log(JSON.stringify(jsonPut));
                    }
                } catch (err) {
                    console.log(err);
                    fs.appendFile("parseError.log", data + "\n", function(err) {
                        if(err) {
                            return console.log(err);
                        }
                        console.log("The errlog file was saved!");
                    });
                    res.writeHead(422, {"Content-Type": "application/json"});
                    res.end(err.name);
                    return;
                }
                console.log("Update to validate: " + jsonPut.length);
                var valid = new Validator();
                var docErrArr;
                var uptadeArr = [];
                for(var j=0; j<jsonPut.length; j++){
                    var tempObj = {};
                    tempObj["params"] = {};
                    docErrArr = valid.validate(jsonPut[j]);
                    if (docErrArr.length >0) {
                        docErrArr = JSON.stringify(docErrArr);
                        console.log(docErrArr);
                        res.writeHead(422, {"Content-Type": "application/json"});
                        res.end(docErrArr);
                        return;
                    }
                    tempObj._id = jsonPut[j]._id;
                    delete jsonPut[j].domain;
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
                console.log("For DB Update: " + uptadeArr.length);
                for (var a=0;a<uptadeArr.length; a++){
                    blogs.updateOne({"_id":ObjectId(uptadeArr[a]._id)}, {$set:uptadeArr[a].params}, function (err,r) {
                        if (err){
                            console.log("DB update Error");
<<<<<<< HEAD
                            fs.writeFile("text.json", uptadeArr[a].params, function(err) {
=======
                            fs.appendFile("err.log", JSON.stringify(err) + "\n", function(err) {
>>>>>>> b48fdeb444ce1ee4d27ee751e15d5823c2b7b8d3
                                if(err) {
                                    return console.log(err);
                                }
                                console.log("The errlog file was saved!");
                            });
                            // stats.updateOne({"status":"errors"},{$inc:{"qty": 1}}, function(err,r){
                            //    if (err) throw err;
                            // });
                            res.writeHead(422, {"Content-Type": "application/json"});
                            res.end(JSON.stringify(err.message));
                        }
                    });
                }
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end("Input of " + uptadeArr.length + " documents: done");
            });
            break;

    }
}).listen(2000);
console.log('Server running at http://127.0.0.1:2000/');