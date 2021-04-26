
'use strict';

require('dotenv').config();
const cors = require("cors");
const express = require('express');
const server = express();
server.use(cors());

const PORT = process.env.PORT || 5000;

server.get('/', (request, response) => {



    response.status(200).json();
    response.send('try another rout');

});




let Location = function (locObj) {
    this.search_query = 'Lynnwood';
    this.formatted_query = locObj[0].display_name;
    this.latitude = locObj[0].lat;
    this.longitude = locObj[0].lon;
};




server.get('/location', (request, response) => {
    let loc = require('./location.json');
    let locas = new Location(loc)
    response.status(200).json(locas);
    response.send(locas);

});



let Weather = function (waetherObj) {

    this.forecast = waetherObj.weather.description;
    this.time = waetherObj.valid_date;

};


server.get('/weather', (request, response) => {
    let weatherArr = [];
    let weath = require('./weather.json');

    weath.data.forEach((item, i) => {
        let weathers = new Weather(item);
        weatherArr.push(weathers)

    })

    console.log(weatherArr);


    response.status(200).json(weatherArr);
    response.send(weatherArr);

});
server.get('*', generalHandler)
function generalHandler(req, res) {
    let errObj = {
        status: 500,
        resText: 'Sorry, something went wrong'
    }
    res.status(500).send(errObj);
}
server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
})