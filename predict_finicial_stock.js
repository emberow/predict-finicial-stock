var request = require("request");
const express = require('express');
const { time } = require("console");
var app = express();
app.use(express.static("public"));

var stockTransfer = {
    "2880": "華南金",
    "2884": "玉山金"
}
var  quarterTransfer = {
    "03": "Q1",
    "06": "Q2",
    "09": "Q3",
    "12": "Q4"
}

function parseDividentData(originalData){
    result = {};
    originalData.forEach(element =>{
        let year = element["year"];
        let divident = element["totalDividend"];
        result[year] = divident;
    })
    return result;
}

function getDividend(stockNum){
    return new Promise((resolve, reject) => {
        request({
            url: `https://tw.stock.yahoo.com/_td-stock/api/resource/StockServices.dividends;action=combineCashAndStock;date=;limit=100;showUpcoming=true;sortBy=-date;symbol=${stockNum}.TW?bkt=&device=desktop&ecma=modern&feature=ecmaModern%2CuseVersionSwitch%2CuseNewQuoteTabColor&intl=tw&lang=zh-Hant-TW&partner=none&prid=bh99p55h9grem&region=TW&site=finance&tz=Asia%2FTaipei&ver=1.2.1308&returnMeta=true`,
            method: "GET"
            }, function(error, response, data) {
            if (error || !data) {
                reject(null);
            }else{
                data = JSON.parse(data); 
                data = data["data"]["dividends"];
                data = parseDividentData(data);
                console.log(data);
                resolve(data);
            }
        });
    })
}

function parseEpsData(originalData){
    result = {};
    originalData.forEach(element => {
        let year = element['date'].substr(0,4);
        let month = element['date'].substr(5,2);
        let qualter = quarterTransfer[month];
        let eps = element['eps'];
        if(result[year]){
            result[year][qualter] = eps;
        }
        else{
            let temp = {};
            temp[qualter] = eps;
            result[year] = temp;
        }
    });
    return result;
}

function getEPS(stockNum){
    return new Promise((resolve, reject) => {
        request({
            url: `https://tw.stock.yahoo.com/_td-stock/api/resource/StockServices.revenues;includedFields=priceAssessment;period=quarter;symbol=${stockNum}.TW?bkt=&device=desktop&ecma=modern&feature=ecmaModern%2CuseVersionSwitch%2CuseNewQuoteTabColor&intl=tw&lang=zh-Hant-TW&partner=none&prid=1cgut1dh9gj0b&region=TW&site=finance&tz=Asia%2FTaipei&ver=1.2.1308&returnMeta=true`,
            method: "GET"
            }, function(error, response, data) {
            if (error || !data) {
                reject(null);
            }else{
                data = JSON.parse(data); 
                data = data["data"]["data"]["result"]["revenues"];
                data = parseEpsData(data);
                console.log(data)
                resolve(data);
            }
        });
    })
}

function getCurrentPrice(stockNum){
    return new Promise((resolve, reject) => {
        request({
            url: `https://tw.stock.yahoo.com/_td-stock/api/resource/FinanceChartService.ApacLibraCharts;symbols=%5B%22${stockNum}.TW%22%5D;type=tick?bkt=&device=desktop&ecma=modern&feature=ecmaModern%2CuseVersionSwitch%2CuseNewQuoteTabColor&intl=tw&lang=zh-Hant-TW&partner=none&prid=akpqtehh9gr85&region=TW&site=finance&tz=Asia%2FTaipei&ver=1.2.1308&returnMeta=true`,
            method: "GET"
            }, function(error, response, data) {
            if (error || !data) {
                reject(null);
            }else{
                data = JSON.parse(data); 
                data = data["data"][0]["chart"]["meta"]["chartPreviousClose"];
                console.log(data)
                resolve(data);
            }
        });
    })
}

app.get('/predict-finicial-stock',async function(req, res){
    let stockNum = req.query.stockNum;
    let stockName = stockTransfer[stockNum];
    let epsData = await getEPS(stockNum);
    let dividendData = await getDividend(stockNum);
    let currentPrice = await getCurrentPrice(stockNum);
    res.send({"stockName": stockName, "currentPrice": currentPrice, "eps": epsData, "dividend": dividendData});
});   

// check running enviroment
var port = process.env.PORT || 3000;

// create
app.listen(port);

// only print hint link for local enviroment
if (port === 3000) {
    console.log('RUN http://localhost:3000/predict-finicial-stock');
}