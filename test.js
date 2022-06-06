var request = require("request");

request({
    url: `https://openapi.twse.com.tw//v1/opendata/t187ap14_L`,
    method: "GET"
    }, function(error, response, data) {
    if (error || !data) {
        console.log(error)
    }else{
        console.log(data)
    }
});