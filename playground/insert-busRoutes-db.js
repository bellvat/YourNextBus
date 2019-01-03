const {MongoClient} = require('mongodb');
const fs = require('fs');

MongoClient.connect("mongodb://localhost:27017/YourNextBus", (err,client) =>{
	if(err){
		return console.log('Unable to connect');
	}
	console.log('Connected to database');
	//creating an instance of the database?
	const db = client.db('YourNextBus'); 
	db.collection('busRoutes').deleteMany({});

	//read from .json file and insert
	fs.readFile('bus3.json', (err,data) =>{
		if (err){
			return console.log(err)
		}
		console.log('Successfully connected to database');
		var dataObj = JSON.parse(data);
		for (num in dataObj.items){
			db.collection('busRoutes').insertOne({
				route_name: dataObj.items[num].display_name,
				route_number: dataObj.items[num].id,
			}).catch((err)=>{
				return console.log(err);
			})
		}
	});
	//client.close();
})
