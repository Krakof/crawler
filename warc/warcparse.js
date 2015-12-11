/**
 * Created by user on 10.12.2015.
 */
var http = require('http');
var https = require('https');
var url = require("url");
var fs = require('fs');
var request = require("request");
//http.createServer(function (req, res) {
    var filename = "./CCparts.txt";
var rl = require('readline').createInterface({
    input: require('fs').createReadStream('CCparts.txt')
});

var links = [];
rl.on('line', function (line) {
    links.push("https://aws-publicdatasets.s3.amazonaws.com/" + line);
});
rl.on('close', function(){
    console.log("Links loaded");
    while (links[0]){
        var archive = fs.createWriteStream("warc.gz");
        request
            .get(links[0])
            .on('error', function(err) {
                console.log(err)
            })
            .pipe(archive)
            .on('end',function(){
                console.log("End")
            })
    }
        });
//}).listen(2000);
//console.log('Server running at http://127.0.0.1:2000/');