
const express = require('express');
const hbs = require('hbs');

const mongoose = require('mongoose');
const {Bus} = require('./model/bus-store.js');

const functions = require('./server-support/functions.js');

const request = require('request');
const requestPromise = require('request-promise');
const bodyParser = require('body-parser');
const convert = require('xml-js');

const NodeCache = require('node-cache');
const myCache = new NodeCache();
const path = require('path');

var app = express()

app.set('view engine','hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
hbs.registerPartials(__dirname + '/views/partials');

//home i want to be able to submit the route and direction, then send the user to the /stops page
app.get('/home',(req,res)=>{

			Bus.find().then((routes)=>{
				res.render('home.hbs',{
					route: routes,
				})
			})
});
app.get('/direction',(req,res)=>{
	var routeSelected = functions.parseReq(req,'route_selected');
	myCache.set('routeKey',routeSelected);
	requestPromise({
		uri: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=lametro&r=" + routeSelected + "&terse"})
		.then((resp)=>{
			var routeStopDetailJs = JSON.parse(convert.xml2json(resp,{compact:true}));
			var directionArray = routeStopDetailJs.body.route.direction;
			var directionArr = functions.buildDirectionJson(directionArray,routeStopDetailJs);
			
			res.render('direction.hbs',{
				routeSelected: routeSelected,
				directions:directionArr, 
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
	var directionSelectedNum = parseInt(JSON.parse(functions.parseReq(req,"direction_selected")).direction_num);
	var directionSelectedName = JSON.parse(functions.parseReq(req,"direction_selected")).direction_name;
	myCache.set('directionKey', directionSelectedName);

	requestPromise({
		uri: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=lametro&r=" + routeSelected + "&terse"})
		.then((resp)=>{
			var routeStopDetailJs = JSON.parse(convert.xml2json(resp,{compact:true}));
			var tagStopsArray = routeStopDetailJs.body.route.direction[directionSelectedNum].stop;
			var stopsList = functions.buildStopArray(routeStopDetailJs,tagStopsArray);
			res.render('stops.hbs',{
				routeSelected: routeSelected,
				directionSelected: directionSelectedName,
				stopsList:stopsList 
			})
		})
		.catch((err)=>{
			res.send(err);
		})
});

app.get('/show-next-stops',(req,res)=>{
	var stopSelected = JSON.parse(functions.parseReq(req,"stop_selected")).stop_num;
	var stopName = JSON.parse(functions.parseReq(req,"stop_selected")).stop_name;
	var routeSelected = myCache.get('routeKey',(err,value)=>{
		if(!err){
			return value;
		}
	})
	var directionSelected = myCache.get('directionKey',(err,value)=>{
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
			directionSelected: directionSelected,
			stopSelected: stopName,
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

