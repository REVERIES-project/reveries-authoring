module.exports = function (app, logger) {
    var Folia = require('../../models/folia.js')
    var CommonHelper = require('./commonHelper.js')

    //Put operation allow to chhane the metadata
    // limited to share status for the moment 
    app.put('/folia/:id/share', function (req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: 'Please authenticate'
            })
            return
        }
        CommonHelper.switchStatus(Folia, req, res)

    })

    app.post('/folia', function (req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: 'Please authenticate'
            })
            return
        }
        var folia = new Folia()
        folia.label = req.body.label
        folia.owner = req.user._id
        folia.status = req.body.status
        folia.targetSpecies = req.body.targetSpecies
        folia.correctMessage = req.body.correctMessage
        folia.wrongMessage = req.body.wrongMessage
        folia.question = req.body.question
        folia.score = req.body.score
        var now = new Date()
        folia.creationDate = now

        //save if no itemId
        if (!req.body.itemId) {
            folia.save(function (err, resource) {
                if (err) {
                    logger.log('error', 'Error while saving static myoutube media %s', err.message)
                    res.send({
                        success: false
                    })
                } else {
                    logger.log('info', 'Youtube media created %s', JSON.stringify(resource))
                    res.send({
                        success: true,
                        resource: resource,
                        operation: 'create'
                    })

                }
            })
        }

         //update existing folia if itemId already exists
         if (req.body.itemId && req.body.itemId.length > 0) {
            Folia.findById(req.body.itemId, function (err, toUpdate) {
                if (!toUpdate) {
                    logger.log('error', 'Err, folia with id ' + req.body.itemId + ' does not exists')
                } else {
                    toUpdate.label = req.body.label
                    toUpdate.owner = req.user._id
                    toUpdate.status = req.body.status
                    toUpdate.targetSpecies = req.body.targetSpecies
                    toUpdate.correctMessage = req.body.correctMessage
                    toUpdate.wrongMessage = req.body.wrongMessage
                    toUpdate.question = req.body.question
                    toUpdate.score = req.body.score
                    logger.log('info', 'Updating folia ', JSON.stringify(toUpdate))

                    toUpdate.save(function (err) {
                        if (err) {
                            logger.log('error', 'Error while updating folia %s', err.message)
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

    // Return the list of folias owned by current user
    app.get('/folia', function (req, res) {
        if (!req.user) {
            res.send({
                success: false,
                'message': 'please authenticate'
            })
            return
        }


        Folia.find({
                $or: [{
                    owner: req.user._id
                }, {
                    status: 'Public'
                }]
            })
            .sort({
                creationDate: -1
            })

            .exec(function (err, ressources) {
                for (var i = 0; i < ressources.length; i++) {
                    var ressource = ressources[i]
                    if (ressource.owner == req.user._id) {
                        ressource.readonly = 'readwrite'
                    } else {
                        ressource.readonly = 'readonly'
                    }
                }
                res.send(ressources)
            })
    })

    

    app.delete('/folia/:id', function (req, res) {
        if (!req.user._id) {
            res.send({
                success: false,
                message: 'user not authenticated'
            })
        }
        Folia.findOneAndRemove({
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