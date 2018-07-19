// server.js

// set up ======================================================================
// get all the tools we need

// To index :
// db.staticmedia.createIndex({label:'text',mkdown:'text',})
//db.freetexts.createIndex({label:'text',question:'text',response:'text',correctMessage:'text',wrongMessage:'text'})
//db.mcqs.createIndex({label:'text',correctMessage:'text',distractor1:'text',distractor2:'text',question:'text',response:'text',correctMessage:'text',wrongMessage:'text'})
// db.badges.createIndex({label:'text',badgeText:'text',})
// db.inventoryitems.createIndex({label:'text',itemText:'text',}



//setting the configuration variables with either ENV="production"
// or ENV="developpement" (see ecosystem.config.js for more info)
var config = require('./config/config.json')
let ENV = process.env.NODE_ENV
let PORT = process.env.PORT
let webdirectory = config[ENV].webDirectory
let secretString = config[ENV].secretString
let mongoURL=config[ENV].mongoURL

var express = require('express')
var app = express()
var https = require('https')
var fs = require('fs')

var mongoose = require('mongoose')
var passport = require('passport')
var Grid = require('gridfs-stream')

var winston = require('winston')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var session = require('express-session')
var busboyBodyParser = require('busboy-body-parser')
// configuration ===============================================================

//Logger used to track activity and error
var logger = new winston.Logger({
	transports: [
		new(winston.transports.File)({
			filename: 'problem.log'
		})
	]
})

Grid.mongo = mongoose.mongo
mongoose.connect(mongoURL) // connect to our database
require('./config/passport.js')(passport) // pass passport for configuration

app.use(cookieParser()) // read cookies (needed for auth)
app.use(bodyParser.json()) // get information from html forms
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(busboyBodyParser())

// required for passport
app.use(session({
	secret: secretString
}))
app.use(passport.initialize())
app.use(passport.session()) // persistent login sessions
var gfs = new Grid(mongoose.connection.db)

// routes ======================================================================
require('./app/route/routes.js')(app, passport, webdirectory) // load our routes and pass in our app and fully configured passport
require('./app/route/filesroutes.js')(app, passport, gfs)
require('./app/route/documentroutes.js')(app, gfs, logger)
//require('./app/route/imageAnalysisRoute.js')(app, gfs,passport); 

// start an https server for production
if (ENV === "production") {
	var secureServer = https.createServer({
			key: fs.readFileSync('/etc/letsencrypt/live/conception.reveries-project.fr/privkey.pem'),
			cert: fs.readFileSync('/etc/letsencrypt/live/conception.reveries-project.fr/cert.pem')
		}, app)
		.listen(PORT, function () {
			console.log('Secure Server listening on port ' + PORT)
		})
}

//start a simple server for developpement
if (ENV === "development") {
	app.listen(PORT)
}