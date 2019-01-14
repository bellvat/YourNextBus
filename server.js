
const express = require('express');
const hbs = require('hbs');
const mongoose = require('mongoose');
const {Bus} = require('./model/bus-store.js');
const request = require('request');
const requestPromise = require('request-promise');
const bodyParser = require('body-parser');
const convert = require('xml-js');
const NodeCache = require('node-cache');
const myCache = new NodeCache();

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
app.get('/next-stops',(req,res)=>{
	var stopSelected = req.query.stop_selected
	var routeSelected;
	myCache.get('routeKey',(err,value)=>{
		if(!err){
			routeSelected = value;
		}
	})
	requestPromise({
		url: "http://api.metro.net/agencies/lametro/routes/" + routeSelected + "/stops/" + stopSelected +"/predictions/"
	})
	.then((resp)=>{
		res.render('next-stops.hbs',{
			routeSelected: routeSelected,
			stopSelected: stopSelected,
			displayedTimes: JSON.parse(resp).items
		})
	})
	.catch((err)=>{
		res.send(err);
	})
})

function parseReq(req,key){
	return req.query[key];
}

function buildStopsObj(routeDetailsJs){
	//map the stop tag number to the stop name
	var allStops = routeDetailsJs.body.route.stop;
	var stopsObj = {};
	for(var i = 0;i < allStops.length;i++){
		stopsObj[allStops[i]._attributes.tag] = allStops[i];
	}
	return stopsObj;
}
function buildStopArray(routeDetailsJs,tagStopArray){
	var stopsTagToNameObj = buildStopsObj(routeDetailsJs);
	var arr = [];
	for(var i = 0;i < tagStopArray.length;i++){
		//make a list of stop names and ids here, instead of doing that in the views
		var each = {
		'stopId' : stopsTagToNameObj[tagStopsArray[i]._attributes.tag]._attributes.stopId,
		 'stopTitle' : stopsTagToNameObj[tagStopsArray[i]._attributes.tag]._attributes.title
		}
		arr.push(each);
	}
	return arr;
}
app.get('/stops',(req,res)=>{

	var routeSelected = parseReq(req,"route_selected");
	var directionSelected = parseInt(parseReq(req,"direction_selected"));
	var submitDirection = parseReq(req,"submitDirection");

	myCache.set('routeKey',routeSelected);

	requestPromise({
		uri: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=lametro&r=" + routeSelected + "&terse"})
		.then((resp)=>{
			var routeStopDetailJs = JSON.parse(convert.xml2json(resp,{compact:true}));
			var directionArray = routeStopDetailJs.body.route.direction;
			var tagStopsArray = routeStopDetailJs.body.route.direction[directionSelected].stop;
			var stopsList = buildStopArray(routeStopDetailsJs,tagStopsArray);
			Bus.find().then((routes)=>{
				res.render('stops.hbs',{
					route: routes,
					routeSelected: routeSelected,
					directions:directionArray, 
					stopsAvailable: tagStopsArray,
					stopsList:stopsList 
				})
			})
		})
		.catch((err)=>{
			res.send(err);
		})
});

app.listen(3000, () => {
	console.log('Listening on port 3000');
});

