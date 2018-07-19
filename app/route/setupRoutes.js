module.exports = function (app, configPath) {
    let ENV = process.env.NODE_ENV
    const editJsonFile = require('edit-json-file')
    const mongoose = require('mongoose')
    const pm2 = require('pm2')
    const configPM2 = require('../../ecosystem.config')

    //params: mongoURL, the mongodb connection string to be saved in config/config.js mongoURL value
    app.post('/setupMongo', function (req, res) {
        let file = editJsonFile(configPath, {
            autosave: true
        })
        let result = file.set(ENV + '.mongoURL', req.body.mongoURL)
        res.send(result.data)
    })


    app.get('/testMongo', function (req, res) {
        let configFile = editJsonFile(configPath)
        mongoose.connect(configFile.get(ENV + '.mongoURL'), function (err) {
            if (err)
                return res.status(500).send(err)
            res.send({
                mongodb: true
            })
            mongoose.disconnect()
        })

    })


    app.get('/serverInfo', function (req, res) {
        pm2.describe('authoring-server', function (err, processDescription) {
            if (err) {
                res.send(err)
                console.error(err)
                process.exit(2)
            }
            res.send(processDescription)
        })
    })

    app.get('/stopServer', function (req, res) {
        pm2.stop('authoring-server', function (err, processDescription) {
            if (err) {
                res.send(err)
                console.error(err)
                process.exit(2)
            }
            res.send(processDescription)
        })
    })

    app.get('/restartServer', function (req, res) {
        pm2.restart('authoring-server', function (err, processDescription) {
            if (err) {
                res.send(err)
                console.error(err)
                process.exit(2)
            }
            res.send(processDescription)
        })
    })


    app.get('/startServer', function (req, res) {
        pm2.start('authoring-server', function (err, apps) {
            if (err) {
                res.send(err)
                throw err
                return
            }
            res.send(apps)

        });

    })
}