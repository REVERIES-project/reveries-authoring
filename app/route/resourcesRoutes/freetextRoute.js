module.exports = function (app, logger) {
    var FreeText = require('../../models/freetext.js')
    var CommonHelper = require('./commonHelper.js')
    app.post('/freetextactivity', function (req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: 'Please authenticate'
            })
            return
        }
        var newFreeText = new FreeText()
        newFreeText.question = req.body.question
        newFreeText.label = req.body.label
        newFreeText.response = req.body.response
        newFreeText.wrongMessage = req.body.wrongMessage
        newFreeText.correctMessage = req.body.correctMessage
        newFreeText.media = req.body.mediaId
        newFreeText.owner = req.user._id
        newFreeText.status = req.body.status
        newFreeText.score = req.body.score
        newFreeText.responseLabel = req.body.responseLabel
        var now = new Date()
        newFreeText.creationDate = now

        if (!req.body.itemId) {
            newFreeText.save(function (err) {
                if (err) {
                    logger.log('error', 'Error while saving freetext %s', err.message)

                    res.send({
                        success: false
                    })
                } else res.send({
                    success: true,
                    resource: newFreeText,
                    operation: 'create'
                })
            })
        }

        if (req.body.itemId && req.body.itemId.length > 0) {
            FreeText.findById(req.body.itemId, function (err, toUpdate) {
                if (!toUpdate) {
                    logger.log('error', 'Err, Freetext with id ' + req.body.itemId + ' does not exists')
                } else {
                    logger.log('info', 'Updating question %s', JSON.stringify(toUpdate))
                    toUpdate.question = req.body.question
                    toUpdate.label = req.body.label
                    toUpdate.response = req.body.response
                    toUpdate.wrongMessage = req.body.wrongMessage
                    toUpdate.correctMessage = req.body.correctMessage
                    toUpdate.media = req.body.mediaId
                    toUpdate.owner = req.user._id
                    toUpdate.score = req.body.score
                    toUpdate.status = req.body.status
                    toUpdate.save(function (err) {
                        if (err) {
                            logger.log('error', 'Error while updating freetext %s', err.message)
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


    app.put('/freetextactivity/:id/share', function (req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: 'Please authenticate'
            })
            return
        }
        CommonHelper.switchStatus(FreeText, req, res)

    })

    app.get('/freetextactivity', function (req, res) {
        if (!req.user) {
            res.send({
                success: false,
                'message': 'please authenticate'
            })
            return
        }

        if (req.query && req.query.search) {
            FreeText.find({
                    $text: {
                        $search: req.query.search
                    }
                })
                .populate('media')
                .exec(function (err, results) {
                    res.send(results)

                })
            return
        }



        FreeText.find({
                $or: [{
                    owner: req.user._id
                }, {
                    status: 'Public'
                }]
            })
            .sort({
                creationDate: -1
            })
            .populate('media')
            .exec(function (err, freetexts) {
                for (var i = 0; i < freetexts.length; i++) {
                    var freetext = freetexts[i]
                    if (freetext.owner == req.user._id) {
                        freetext.readonly = 'readwrite'
                    } else {
                        freetext.readonly = 'readonly'
                    }

                }
                res.send(freetexts)
            })
    })


    app.get('/freetext/:id', function (req, res) {

        FreeText.findOne({
            '_id': req.params.id
        }, function (err, freetext) {
            res.send(freetext)
        })
    })

    app.delete('/freetextactivity/:id', function (req, res) {
        if (!req.user._id) {
            res.send({
                success: false,
                message: 'user not authenticated'
            })
        }
        FreeText.findOneAndRemove({
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