
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
			"stop_num" : stopsTagToNameObj[tagStopArray[i]._attributes.tag]._attributes.stopId,
			 "stop_name" : stopsTagToNameObj[tagStopArray[i]._attributes.tag]._attributes.title
			}
			var stopsJson = {};
			stopsJson.json = JSON.stringify(each);
			stopsJson.name = stopsTagToNameObj[tagStopArray[i]._attributes.tag]._attributes.title;
			arr.push(stopsJson);
		//}
	}
	return arr;
}
function buildDirectionJson(directionArray){
	var directionArr = [];
	for(var i = 0;i< directionArray.length;i++){
		var b = {
			"direction_num": i.toString(),
			"direction_name": directionArray[i]._attributes.title
		}
		var directionJson = {};
		directionJson.json = JSON.stringify(b);
		directionJson.name = directionArray[i]._attributes.title;
		directionArr.push(directionJson);
	}
	return directionArr;
}

module.exports = {
	parseReq,
	buildStopArray,
	buildDirectionJson
}
