const request = require('request');
const fs = require('fs');


console.log('here');
request
	.get("http://api.metro.net/agencies/lametro/routes/")
	.on('response',(resp) =>{
		console.log(resp.statusCode)
		console.log(resp.headers['content-type'])
	})
	.on('error',(err)=>{
		console.log(err);
	})
	.pipe(fs.createWriteStream('bus3.json'));
