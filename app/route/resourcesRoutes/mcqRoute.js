module.exports = function (app, logger) {
    var MCQ = require('../../models/mcq.js')
    var CommonHelper = require('./commonHelper.js')

    // Handle reception of a new mcq activity designed by conceptor
    app.post('/mcq', function (req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: 'Please authenticate'
            })
            return
        }
        var Mcq = new MCQ()
        Mcq.owner = req.user._id
        Mcq.imageMode = req.body.imageMode
        Mcq.status = req.body.status
        Mcq.label = req.body.label
        Mcq.question = req.body.question
        if (req.body.distractors) {
            Mcq.distractor = []
            for (var i = 0; i < req.body.distractors.length; i++) {
                Mcq.distractors.push({
                    value: req.body.distractors[i]
                })
            }
        }
        Mcq.response = req.body.response
        Mcq.wrongMessage = req.body.wrongMessage
        Mcq.correctMessage = req.body.correctMessage
        Mcq.score = req.body.score
        Mcq.media = req.body.mediaId
        var now = new Date()
        Mcq.creationDate = now

        //save if no mediaId
        if (!req.body.itemId) {
            Mcq.save(function (err) {
                if (err) {
                    logger.log('error', 'Error while saving MCQ %s', err.message)
                    res.send({
                        success: false
                    })
                } else res.send({
                    success: true,
                    resource: Mcq,
                    operation: 'create'
                })

            })
        }
        //update existing MCQ if mediaId already exists
        if (req.body.itemId && req.body.itemId.length > 0) {
            MCQ.findById(req.body.itemId, function (err, toUpdate) {
                if (!toUpdate) {
                    logger.log('error', 'Err, MCQ with id ' + req.body.itemId + ' does not exists')
                } else {
                    toUpdate.owner = req.user._id
                    toUpdate.status = req.body.status
                    toUpdate.label = req.body.label
                    toUpdate.question = req.body.question
                    if (req.body.distractors) {
                        toUpdate.distractors = []
                        for (var i = 0; i < req.body.distractors.length; i++) {
                            toUpdate.distractors.push({
                                value: req.body.distractors[i]
                            })
                        }
                    }
                    toUpdate.response = req.body.response
                    toUpdate.wrongMessage = req.body.wrongMessage
                    toUpdate.correctMessage = req.body.correctMessage
                    toUpdate.score = req.body.score
                    toUpdate.media = req.body.mediaId
                    logger.log('info', 'Updating MCQ ', JSON.stringify(toUpdate))

                    toUpdate.save(function (err) {
                        if (err) {
                            logger.log('error', 'Error while updating MCQ %s', err.message)
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



    // Return the list of mcq owned by current user
    app.get('/mcq', function (req, res) {
        if (!req.user) {
            res.send({
                success: false,
                'message': 'please authenticate'
            })
            return
        }


        if (req.query && req.query.search) {
            MCQ.find({
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


        MCQ.find({
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
            .exec(function (err, mcqs) {
                for (var i = 0; i < mcqs.length; i++) {
                    var mcq = mcqs[i]
                    if (mcq.owner == req.user._id) {
                        mcq.readonly = 'readwrite'
                    } else {
                        mcq.readonly = 'readonly'
                    }
                }
                res.send(mcqs)
            })

    })
    // Return an unique MCQ

	app.get('/mcq/:id', function (req, res) {
		MCQ.findOne({
				'_id': req.params.id,
			})
			.populate('media')
			.exec(function (err, mcq) {
				res.send(mcq)
			})


	})


    //Put operation allow to chhane the metadata
	// limited to share status for the moment 
	app.put('/mcq/:id/share', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		CommonHelper.switchStatus(MCQ, req, res)

	})


    // Delete an existing MCQ
    app.delete('/mcq/:id', function (req, res) {
        if (!req.user._id) {
            res.send({
                success: false,
                message: 'user not authenticated'
            })
        }
        MCQ.findOneAndRemove({
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