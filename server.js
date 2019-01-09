
const express = require('express');
const hbs = require('hbs');
const mongoose = require('mongoose');
const {Bus} = require('./model/bus-store.js');
const request = require('request');
const requestPromise = require('request-promise');
const bodyParser = require('body-parser');
const convert = require('xml-js');

var app = express()

app.set('view engine','hbs');
app.use(bodyParser.json());

app.get('/',(req,res)=>{
	Bus.find().then((routes)=>{
		res.render('home.hbs',{
			route: routes
		})
	})
});

app.get('/stops',(req,res)=>{
	var routeSelected = req.query.route_selected;
	var directionSelected = parseInt(req.query.direction_selected);
	var stops = "";
	var directions = "";
	requestPromise({
		uri: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=lametro&r=" + routeSelected + "&terse"})
		.then((resp)=>{
			var data = convert.xml2json(resp,{compact:true});	
			var dataJson = JSON.parse(data);
			//xml
			var tagStopsArray = dataJson.body.route.direction[directionSelected].stop;
			var allRoutes = dataJson.body.route.stop;
			var tagObj = {};
			for(var i = 0;i < allRoutes.length;i++){
				tagObj[allRoutes[i]._attributes.tag] = allRoutes[i];
			}
			var stopsList = []; 
			for(stop in tagStopsArray){
				//make a list of stop names and ids here, instead of doing that in the views
				var each = {
				'stopId' : tagObj[tagStopsArray[stop]._attributes.tag]._attributes.stopId,
				 'stopTitle' : tagObj[tagStopsArray[stop]._attributes.tag]._attributes.title
				}
				stopsList.push(each);
			}
			//make request to LA metro api to get the names and match tagStopsArray stop tags -- would this be easier in Sql? -- is this a good idea to nest get requests?	I would need filter only the results that match tagStopArray


			//stops = JSON.parse(resp);
			Bus.find().then((routes)=>{
				res.render('stops.hbs',{
					route: routes,
					routeSelected: routeSelected,
					directions:dataJson.body.route.direction, 
					stopsAvailable: tagStopsArray,
					stopsList:stopsList 
				})
			})
		})
		.catch((err)=>{
			res.send(err);
		})
});
//app.get('/stops',(req,res)=>{
//	var routeSelected = req.query.route_selected;
//	var stops = "";
//	requestPromise({
//		uri: "http://api.metro.net/agencies/lametro/routes/" + routeSelected + "/sequence/"})
//		.then((resp)=>{
//			stops = JSON.parse(resp);
//			Bus.find().then((routes)=>{
//				res.render('stops.hbs',{
//					route: routes,
//					selected: routeSelected,
//					stops: stops.items
//				})
//			})
//		})
//		.catch((err)=>{
//			stops = err
//			//I still want the routes to show even if there is an error (need to find a better way to do this
//			Bus.find().then((routes)=>{
//				res.render('stops.hbs',{
//					route: routes,
//					selected: routeSelected,
//					stops: stops
//				})
//			})
//		})
//});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});

//get request for stops per route: http://api.metro.net/agencies/lametro/routes/704/stops/
//get request for all routes: 
//http://api.metro.net/agencies/lametro/routes/
//selected: req.query.route_selected
//run direction: http://api.metro.net/agencies/lametro/routes/704/runs/
//http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=<agency_tag>&stopId=<stop id>&routeTag=<route tag>
//will get me directions per route in XML: http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=lametro&r=152&terse
