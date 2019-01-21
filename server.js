
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
hbs.registerHelper('json',(index)=>{
	var obj = { keyOne: index + 1, keyTwo: this._attributes.title };
	return JSON.stringify(obj);
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
		//if('stopId' in stopsTagToNameObj[tagStopsArray[i]._attributes.tag]._attributes){ 
			var each = {
			'stopId' : stopsTagToNameObj[tagStopArray[i]._attributes.tag]._attributes.stopId,
			 'stopTitle' : stopsTagToNameObj[tagStopArray[i]._attributes.tag]._attributes.title
			}
			arr.push(each);
		//}
	}
	return arr;
}

//home i want to be able to submit the route and direction, then send the user to the /stops page
app.get('/home',(req,res)=>{

			Bus.find().then((routes)=>{
				res.render('home.hbs',{
					route: routes,
				})
			})
});
app.get('/direction',(req,res)=>{
	var routeSelected = parseReq(req,'route_selected');

	myCache.set('routeKey',routeSelected);
	requestPromise({
		uri: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=lametro&r=" + routeSelected + "&terse"})
		.then((resp)=>{
			var routeStopDetailJs = JSON.parse(convert.xml2json(resp,{compact:true}));
			var directionArray = routeStopDetailJs.body.route.direction;
			var directionJson = [];
			for(var i = 0;i< directionArray.length;i++){
				var b = {
					"direction_num": i.toString(),
					"direction_name": directionArray[i]._attributes.title
				}
				var directionArr = {};
				directionArr.json = JSON.stringify(b);
				directionArr.name = directionArray[i]._attributes.title;
				directionJson.push(directionArr);
				
			}
			
			res.render('direction.hbs',{
				routeSelected: routeSelected,
				directions:directionJson, 
				directionArray: directionArray
			})
		})
		.catch((err)=>{
			res.send(err);
		})
});


app.get('/stops',(req,res)=>{

	var routeSelected = myCache.get('routeKey',(err,value)=>{
		if (!err){
			return value;
		}
	});
	var directionSelectedNum = parseInt(JSON.parse(parseReq(req,"direction_selected")).direction_num);
	var directionSelectedName = JSON.parse(parseReq(req,"direction_selected")).direction_name;

	requestPromise({
		uri: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=lametro&r=" + routeSelected + "&terse"})
		.then((resp)=>{
			var routeStopDetailJs = JSON.parse(convert.xml2json(resp,{compact:true}));
			var tagStopsArray = routeStopDetailJs.body.route.direction[directionSelectedNum].stop;
			var stopsList = buildStopArray(routeStopDetailJs,tagStopsArray);
			var stopsArray = [];
			for(var i = 0;i< stopsList.length;i++){
				var b = {
					"stop_num": stopsList[i].stopId,
					"stop_name": stopsList[i].stopTitle
				}
				var stopsJson = {};
				stopsJson.json = JSON.stringify(b);
				stopsJson.name = stopsList[i].stopTitle;
				stopsArray.push(stopsJson);
				
			}
			res.render('stops.hbs',{
				routeSelected: routeSelected,
				directionSelected: directionSelectedName,
				stopsList:stopsArray 
			})
		})
		.catch((err)=>{
			res.send(err);
		})
});

app.get('/show-next-stops',(req,res)=>{
	var stopSelected = parseReq(req,"stop_selected");
	var routeSelected = myCache.get('routeKey',(err,value)=>{
		if(!err){
			return value;
		}
	})
	requestPromise({
		url: "http://api.metro.net/agencies/lametro/routes/" + routeSelected + "/stops/" + stopSelected +"/predictions/"
	})
	.then((resp)=>{
		res.render('show-next-stops.hbs',{
			routeSelected: routeSelected,
			stopSelected: stopSelected,
			displayedTimes: JSON.parse(resp).items
		})
	})
	.catch((err)=>{
		res.send(err);
	})
})

app.listen(3000, () => {
	console.log('Listening on port 3000');
});

