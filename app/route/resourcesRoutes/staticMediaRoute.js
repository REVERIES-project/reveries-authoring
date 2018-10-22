module.exports = function(app,logger) {
	var StaticMedia = require('../../models/staticmedia.js')
	var CommonHelper = require('./commonHelper.js')

	app.get('/staticmedia', function (req, res) {
		if (!req.user) {
			res.send({
				success: false,
				'message': 'please authenticate'
			})
			return
		}
		if (req.query && req.query.search) {
			StaticMedia.find({
				$text: {
					$search: req.query.search
				}
			}, function (err, results) {
				res.send(results)

			})
			return
		}

		//   StaticMedia.find({ owner: req.user._id })
		StaticMedia.find({
				$or: [{
					owner: req.user._id
				}, {
					status: 'Public'
				}]
			})
			.sort({
				creationDate: -1
			})
			.exec(function (err, staticmedias) {
				for (var i = 0; i < staticmedias.length; i++) {
					var staticmedia = staticmedias[i]
					if (staticmedia.owner == req.user._id) {
						staticmedia.readonly = 'readwrite'
					} else {
						staticmedia.readonly = 'readonly'
					}
				}

				res.send(staticmedias)
			})


	})

	app.delete('/staticmedia/:id', function (req, res) {
		if (!req.user._id) {
			res.send({
				success: false,
				message: 'user not authenticated'
			})
		}
		StaticMedia.findOneAndRemove({
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
    
	//Put operation allow to chhane the metadata
	// limited to share status for the moment 
	app.put('/staticmedia/:id/share', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		CommonHelper.switchStatus(StaticMedia, req, res)

	})

    // Handle reception of a new static media
	app.post('/staticmedia', function (req, res) {

		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		var staticmedia = new StaticMedia()
		staticmedia.label = req.body.label
		var now = new Date()
		staticmedia.creationDate = now
		staticmedia.owner = req.user._id
		staticmedia.status = req.body.status
        staticmedia.mkdown = req.body.mkdown
		if (!req.body.itemId) {

			staticmedia.save(function (err, resource) {
				if (err) {
					logger.log('error', 'Error while saving static media %s', err.message)
					res.send({
						success: false
					})
				} else {
					logger.log('info', 'Static media created %s', JSON.stringify(resource))
					res.send({
						success: true,
						resource: staticmedia,
						operation: 'create'
					})

				}
			})
		}
		if (req.body.itemId && req.body.itemId.length > 0) {
			StaticMedia.findById(req.body.itemId, function (err, toUpdate) {
				if (!toUpdate) {
					logger.log('error', 'Err, Freetext with id ' + req.body.itemId + ' does not exists')
				} else {
					toUpdate.label = req.body.label
					toUpdate.owner = req.user._id
					toUpdate.status = req.body.status
					toUpdate.mkdown = req.body.mkdown
					toUpdate.save(function (err) {
						if (err) {
							logger.log('error', 'Error while updating static media %s', err.message)
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
    

}