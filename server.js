'use strict';

//to run the server
//1- npm start
//2- node server.js
//3- nodemon

//Application Depandancies
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');

//Application Setup
const server = express();
const PORT = process.env.PORT || 5000;
server.use(cors());
//Routes
server.get('/location', locationHandelr);
server.get('/weather', weatherHandler);
server.get('*', generalHandler);

//Routes Handlers

function locationHandelr(req, res) {
  let cityName = req.query.city;

  let key = process.env.LOCATION_KEY;
  let locURL = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
  
  superagent.get(locURL)
    .then(geoData => {
      let gData = geoData.body;
      let locationData = new Locations(cityName, gData);
      res.send(locationData);
    })
    .catch(error => {
      console.log(error);
      res.send(error);
    });
}
//edit weatherHandler using map instedof forEach//
///e06e07c9309b411398eaf67df1959be8//
function weatherHandler(req, res) {
  let cityName = req.query.city;
  let key = process.env.Weather_KEY;
  let whtURL = `https://api.weatherbit.io/v2.0/current?lat=35.7796&lon=-78.6382&key=${key}&include=${cityName}`;
  superagent.get(whtURL)
    .then(geoDataa => {
      let wData = geoDataa.body;
      let mapDefaultArray = wData.data.map((element,item) => {
        let var1 = element.weather.description;
        let var2 = element.valid_date;
        return new Weathers(var1, var2);
      });
      res.send(mapDefaultArray);

    });
}

function generalHandler(req, res) {
  let errObj = {
    status: 500,
    resText: 'Sorry, something is wrong'
  };
  res.status(500).send(errObj);
}

//constructors
function Locations(cityyName, locData) {
  this.search_query = cityyName;
  this.formatted_query = locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;
}

function Weathers(cityyName, weatherData) {
  this.search_query = cityyName;
  this.forecast = weatherData.weather.description;
  this.time = weatherData.valid_date;
}

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
