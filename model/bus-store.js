var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/YourNextBus');
mongoose.Promise = global.Promise;
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('connection established');
})
var busSchema = new mongoose.Schema({
	route_name: String,
	route_number: String
})

var Bus = mongoose.model('busRoute',busSchema,'busRoutes');

module.exports = {Bus};
