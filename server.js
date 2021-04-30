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
const pg = require('pg');

//Application Setup
const server = express();
const PORT = process.env.PORT || 5000;
server.use(cors());
let client;
let DATABASE_URL = process.env.DATABASE_URL;
// let ENV = process.env.ENV || '';
// if (ENV === 'DEV') {
//   client = new pg.Client({
//     connectionString: DATABASE_URL
//   });
// } else {
//   client = new pg.Client({
//     connectionString: DATABASE_URL,
//     ssl: {rejectUnauthorized: false}
//   });
// }

//Routes
server.get('/location', locationHandelr);
server.get('/weather', weatherHandler);
server.get('/parks', parkHandler);
server.get('*', generalHandler);

client = new pg.Client({
  connectionString: DATABASE_URL,
});
//Routes Handlers

function locationHandelr(req, res) {
  let cityName = req.query.city;
  let key = process.env.LOCATION_KEY;
  let locURL = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
  let safeValues = [cityName];
  let SQL = `SELECT DISTINCT search_query,formatted_query,latitude,longitude FROM locations WHERE search_query=$1;`;
  client.query(SQL, safeValues)
    .then(result => {
      res.send(result.rows);
    })
    .catch(error => {
      res.send(error);
    });

  superagent.get(locURL)
    .then(geoData => {
      let gData = geoData.body;
      let locationData = new Locations(cityName, gData);
      let safeValues = [locationData.search_query, locationData.formatted_query, locationData.latitude, locationData.longitude];
      let SQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1, $2, $3, $4) RETURNING *;`;
      console.log(SQL);
      client.query(SQL, safeValues)
        .then(result => {
          res.send(result);
        })
        .catch(error => {
          res.send(error);
        });
    });
  }

// edit weatherHandler using map instedof forEach//
// /e06e07c9309b411398eaf67df1959be8//
function weatherHandler(req, res) {
  let cityName = req.query.search_query;
  // console.log(cityName);
  let key = process.env.WEATHER_KEY;
  let whtURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`;
  superagent.get(whtURL)
    .then(wDataa => {
      let wData = wDataa.body;
      let mapDefaultArray = wData.data.map(element => {
        let var1 = element.weather.description;
        let var2 = element.valid_date;
        return new Weathers(var1, var2);
      });
      res.send(mapDefaultArray.slice(0, 8));
    })
    .catch(error => {
      console.log(error);
      res.send(error);
    });
}

function generalHandler(req, res) {
  let errObj = {
    status: 500,
    resText: 'Sorry, something is wrong'
  };
  res.status(500).send(errObj);
}
function parkHandler(req, res) {
  let cityName = req.query.search_query;
  // console.log(cityName);
  let key = process.env.PARKS_KEY;

  let parkURL = `https://developer.nps.gov/api/v1/parks?q=${cityName}&api_key=${key}&limit=10`;
  superagent.get(parkURL)
    .then(parkspar => {
      let pData = parkspar.body;
      let mapDefaultArray = pData.data.map(element => {
        return new Parks(element);
      });
      res.send(mapDefaultArray);
    })
    .catch (error => {
      console.log(error);
      res.send(error);
    });

}
//constructors
function Locations(cityyName, locData) {
  this.search_query = cityyName;
  this.formatted_query = locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;
}

function Weathers(des, times) {
  this.forecast = des;
  this.time = new Date(times).toDateString();
}

function Parks(obj) {
  this.name = obj.fullName;
  console.log(this.name);
  this.address = obj.addresses[0].line1;
  // console.log(this.address);
  this.fee = obj.entranceFees[0].cost;
  this.description = obj.description;
  this.url = obj.url;
}
client.connect()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`listening on port ${PORT}`);
    });

  });
