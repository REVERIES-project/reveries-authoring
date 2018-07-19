
// set up ======================================================================
// this file start the configuration service to set the value of 
// mongoURL (required)
// the configuration service also expose a REST API to start, stop, restart and monitor log
// ======================================================================

let PORT = process.env.PORT
let configPath=__dirname+'/config/config.json' // to avoid manipulating folder hierarchy in setupRoutes

var morgan=require('morgan')
var express = require('express')
var bodyParser = require('body-parser')

var app = express()

app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

require('./app/route/setupRoutes.js')(app,configPath)
app.listen(PORT)