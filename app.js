var racer = require('racer');
var express = require('express');

var app = express();
var http = require('http');
var server = http.createServer(app);
var liveDbMongo = require('livedb-mongo');

//Get Redis configuration
if (process.env.REDIS_HOST) {
  var redis = require('redis').createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
  redis.auth(process.env.REDIS_PASSWORD);
} else if (process.env.REDISCLOUD_URL) {
  var redisUrl = require('url').parse(process.env.REDISCLOUD_URL);
  var redis = require('redis').createClient(redisUrl.port, redisUrl.hostname);
  redis.auth(redisUrl.auth.split(":")[1]);
} else {
  var redis = require('redis').createClient();
}

var mongoUrl = process.env.MONGO_URL || process.env.MONGOHQ_URL ||
  'mongodb://localhost:27017/project';

var store = racer.createStore({
	server: server,
  db: liveDbMongo(mongoUrl + '?auto_reconnect', {safe: true}),
  redis: redis
});

app.use(express.static(__dirname + '/public'));
app.use(require('racer-browserchannel')(store));
app.use(express.bodyParser());

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.htm');
});

app.get('/model', function (req, res) {
	var model = store.createModel();
	model.subscribe('entries', function (err, entries) {
		if (err) {
			res.status(500);
			res.send(err);
		} else {
			model.bundle(function (err, bundle) {
				res.send(JSON.stringify(bundle));
			});
		}
	});
});

store.bundle(__dirname + '/client.js', function (err, js) {
	app.get('/script.js', function (req, res) {
		res.type('js');
		res.send(js);
	});
});



server.listen(process.env.PORT || 3001);
