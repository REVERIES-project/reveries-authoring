module.exports = function (app, logger) {
    var Badge = require('../../models/badge.js')
    var CommonHelper = require('./commonHelper.js')
    app.put('/badge/:id/share', function (req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: 'Please authenticate'
            })
            return
        }
        CommonHelper.switchStatus(Badge, req, res)

    })

    app.post('/badge', function (req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: 'Please authenticate'
            })
            return
        }
        var badge = new Badge()
        badge.label = req.body.label
        badge.badgeText = req.body.badgeText
        badge.owner = req.user._id
        badge.status = req.body.status
        badge.media = req.body.badgePageId
        var now = new Date()
        badge.creationDate = now

        if (!req.body.itemId) {
            badge.save(function (err) {
                if (err) {
                    logger.log('error', 'Error while saving badge %s', err.message)
                    res.send({
                        success: false
                    })
                } else res.send({
                    success: true,
                    resource: badge,
                    operation: 'create'
                })
            })
        }
        if (req.body.itemId && req.body.itemId.length > 0) {
            Badge.findById(req.body.itemId, function (err, toUpdate) {
                if (!toUpdate) {
                    logger.log('error', 'Err, Badge with id ' + req.body.itemId + ' does not exists')
                } else {
                    logger.log('info', 'Updating badge %s', JSON.stringify(toUpdate))
                    toUpdate.label = req.body.label
                    toUpdate.badgeText = req.body.badgeText

                    toUpdate.owner = req.user._id
                    toUpdate.status = req.body.status
                    toUpdate.media = req.body.badgePageId
                    toUpdate.save(function (err) {
                        if (err) {
                            logger.log('error', 'Error while updating badge %s', err.message)
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

    app.get('/badge', function (req, res) {
        if (!req.user) {
            res.send({
                success: false,
                'message': 'please authenticate'
            })
            return
        }

        if (req.query && req.query.search) {
            Badge.find({
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

        Badge.find({
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
            .exec(function (err, badges) {
                for (var i = 0; i < badges.length; i++) {
                    var badge = badges[i]
                    if (badge.owner == req.user._id) {
                        badge.readonly = 'readwrite'
                    } else {
                        badge.readonly = 'readonly'
                    }
                }
                res.send(badges)
            })
    })
    app.delete('/badge/:id', function (req, res) {
        if (!req.user._id) {
            res.send({
                success: false,
                message: 'user not authenticated'
            })
        }
        Badge.findOneAndRemove({
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