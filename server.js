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
server.get('/main', mainHandelr);
server.get('/location', locationHandelr);
server.get('/weather', weatherHandler);
server.get('/parks', parkHandler);
server.get('/movies', moviesHandelr);
server.get('/yelp', yelpHandelr);
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
function mainHandelr(req, res) {
  let errObj = {
    status: 200,
    resText: 'server is working fine'
  };
  res.status(500).send(errObj);
}
function parkHandler(req, res) {
  let cityName = req.query.search_query;
 
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
function moviesHandelr(req, res) {
  let name = req.query.search_query;
  
  let key = process.env.MOVIES_KEY;

  let movieURL = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${name}`;
  superagent.get(movieURL)
    .then(movD => {
      // console.log(movD);
      let mData = movD.body;
      // console.log(mData);
      let mapDefaultArray = mData.results.map(element => {
        return new Movies(element);
      });
      res.send(mapDefaultArray);
    })
    .catch(error => {
      console.log(error);
      res.send(error);
    });

}
function yelpHandelr(req, res) {
  let cityName = req.query.search_query;
  
  let key = process.env.YELP_KEY;
  let page = req.query.page;
  const rP = 5;
  const s = ((page - 1) * rP + 1);

  let yelpURL = `https://api.yelp.com/v3/businesses/search?location=${cityName}&limit=${rP}&offset${s}`;
  superagent.get(yelpURL)
    .set('Authorization', `Bearer ${key}`)
    .then(yPar => {
      // console.log(mPar);
      let yData = yPar.body;
      console.log(yData);
      let mapDefaultArray = yData.businesses.map(element => {
        return new Yelp(element);
      });
      res.send(mapDefaultArray);
    })
    .catch(error => {
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
function Movies(obj) {
  this.title = obj.title;
  // console.log(this.name);
  this.overview = obj.overview;
  // console.log(this.address);
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = obj.poster_path;
  this.popularity = obj.popularity;
  this.released_on = obj.release_date;
}
function Yelp(obj) {
  this.name = obj.name;
  
  this.image_url = obj.image_url;

  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
}
client.connect()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`listening on port ${PORT}`);
    });

  });
