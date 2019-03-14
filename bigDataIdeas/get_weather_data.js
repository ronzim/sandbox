const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs-extra');

// key : cb569301d8f82076b27107a0efaebd2a
// get ex: https://api.darksky.net/forecast/cb569301d8f82076b27107a0efaebd2a/37.8267,-122.4233

const apiRoot = "https://api.darksky.net/forecast/";
const apiKey  = "cb569301d8f82076b27107a0efaebd2a";
const homePos = {lat: 45.715226, lng: 9.580577};

function httpGetAsync(theUrl, callback){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

function getWeatherOnDate(date, cb){
  var ts = Math.floor(date.getTime()/1000);
  var url = apiRoot + apiKey + "/" + homePos.lat + "," + homePos.lng + "," + ts + "?units=si";
  console.log(url)
  httpGetAsync(url, cb);
}

var rainData = {};
var starting_date = new Date('2019-01-01');
console.log('starting from ', starting_date);

getWeatherOnDate(starting_date, function(data){
  logAndCAllNext(data, starting_date)
})

function logAndCAllNext(data, date){
  data = JSON.parse(data)
  console.log(date)
  console.log(data)
  rainData[date] = data;

  var nextDate = new Date(new Date(date).setDate(date.getDate()+1));
  console.log('nextDate', nextDate)

  if (nextDate.getTime() > Date.now()){
    console.log('done')
    writeJson()
    return
  }
  else{
    getWeatherOnDate(nextDate, function(data){
      logAndCAllNext(data, nextDate);
    });
  }

}

function writeJson(){
  fs.writeJSONSync('../material/rainData.json', rainData);
}
