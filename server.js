const express = require('express')
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const appstorage = require("./app/utils/nodepersist");

const cron = require('node-cron');

let mongoose = require('mongoose'); // for working w/ our database
let config = require('./config');

mongoose.Promise = global.Promise;
mongoose.connect(config.database, { useUnifiedTopology: true, useFindAndModify: false, useNewUrlParser: true });

let conn = mongoose.connection;
conn.on('error', function(err){
    console.log('mongoose connection error:', err.message);
});

if(!appstorage.get("blacklist")) { //for setting the stage for storing expired tokens.
    appstorage.set("blacklist", []);
}

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.raw({limit: '5mb'}) );

// configure our app to handle CORS requests
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'x-access-token,X-Requested-With,Content-Type,Authorization');
    res.setHeader('X-Powered-By', 'Lucky Lucciano');
    next();
});

let marketPlaceRoutes = require('./app/routes/MarketPlaceRoutes');

app.use(function(req, res, next) {
    console.log(req.method, req.url);
    next(); 
});

app.use("/api/marketplace", marketPlaceRoutes);

app.use(express.static(path.join(__dirname, 'build')));
app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.use(function(req, res) {
    return res.status(404).send({ message: 'The url you visited does not exist' });
});

app.listen(config.port, () => console.log(`Listening on port ${config.port}!`))