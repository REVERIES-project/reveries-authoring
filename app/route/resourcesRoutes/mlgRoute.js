
module.exports = function (app, logger) {
    var MLG = require('../../models/mlg.js')
    var CommonHelper = require('./commonHelper.js')

app.post('/mlg', function (req, res) {
    var mlg = new MLG()

    mlg.label = req.body.label
    mlg.startpage = req.body.startpage
    mlg.endPage = req.body.endPage
    mlg.owner = req.user._id
    mlg.status = req.body.status
    mlg.difficulty = req.body.difficulty
    mlg.duration = req.body.duration
    mlg.unitgameActivities = req.body.unitgameActivities
    mlg.description = req.body.description
    mlg.badge = req.body.badge
    var now = new Date()
    mlg.creationDate = now
    if (!req.body.itemId) {
        mlg.save(function (err) {
            if (err) {
                logger.log('error', 'Error while saving MLG %s', err.message)
                return 500
            }

            res.send({
                success: true,
                resource: mlg,
                operation: 'create'
            })
        })
    }

    if (req.body.itemId && req.body.itemId.length > 0) {
        MLG.findById(req.body.itemId, function (err, toUpdate) {
            if (!toUpdate) {
                logger.log('error', 'Err, MLG with id ' + req.body.itemId + ' does not exists')
            } else {
                logger.log('info', 'Updating MLG %s', JSON.stringify(toUpdate))
                toUpdate.label = req.body.label
                toUpdate.startpage = req.body.startpage
                toUpdate.endPage = req.body.endPage
                toUpdate.owner = req.user._id
                toUpdate.status = req.body.status
                toUpdate.difficulty = req.body.difficulty
                toUpdate.duration = req.body.duration
                toUpdate.unitgameActivities = req.body.unitgameActivities
                toUpdate.description = req.body.description
                toUpdate.badge = req.body.badge
                toUpdate.save(function (err) {
                    if (err) {
                        logger.log('error', 'Error while updating MLG %s', err.message)
                        res.send({
                            success: false
                        })
                    } else res.send({
                        success: true,
                        resource: toUpdate,
                        operation: 'update'
                    })

                })

            }

        })
    }
})









//handle reception lgof a complete game
app.get('/mlg', function (req, res) {
    if (!req.isAuthenticated()) {
        res.send({
            success: false,
            message: 'Please authenticate'
        })
        return
    }

    // MLG.find({ owner: req.user._id })
    MLG.find({
            $or: [{
                owner: req.user._id
            }, {
                status: 'Public'
            }]
        })
        .sort({
            creationDate: -1
        })
        .deepPopulate(['startpage','endPage', 'badge', 'unitgameActivities', 'unitgameActivities.startMedia', 'unitgameActivities.feedbackMedia', 'unitgameActivities.freetextActivities', 'unitgameActivities.mcqActivities', 'unitgameActivities.mcqActivities.media', 'unitgameActivities.inventoryItem', 'unitgameActivities.inventoryItem.media', 'unitgameActivities.inventoryItem.inventoryDoc', 'unitgameActivities.POI'])
        .exec(function (err, mlgs) {
            for (var i = 0; i < mlgs.length; i++) {
                var mlg = mlgs[i]
                if (mlg.owner == req.user._id) {
                    mlg.readonly = 'readwrite'
                } else {
                    mlg.readonly = 'readonly'
                }
            }
            res.send(mlgs)
        })
})

app.put('/mlg/:id/share', function (req, res) {
    if (!req.isAuthenticated()) {
        res.send({
            success: false,
            message: 'Please authenticate'
        })
        return
    }
    CommonHelper.switchStatus(MLG, req, res)

})

app.delete('/mlg/:id', function (req, res) {
    MLG.findOneAndRemove({
            '_id': req.params.id,
            owner: req.user._id
        },
        function (err, doc) {
            res.send({
                success: true,
                resource: doc,
                operation: 'delete'
            })
        })

})

}