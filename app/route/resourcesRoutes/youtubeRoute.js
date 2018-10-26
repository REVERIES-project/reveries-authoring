module.exports = function(app,logger) {
    var YouTube = require('../../models/youtube.js')
    var CommonHelper = require('./commonHelper.js')

	//Put operation allow to chhane the metadata
	// limited to share status for the moment 

	app.put('/youtube/:id/share', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		CommonHelper.switchStatus(YouTube, req, res)

	})

    app.post('/youtube', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		var youtube = new YouTube()
		youtube.label = req.body.label
		youtube.owner = req.user._id
		youtube.status = req.body.status
		youtube.videoId = req.body.videoId
		youtube.startTime=req.body.startTime
		
		youtube.save(function (err, resource) {
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

	})

	app.get('/youtube', function (req, res) {
		if (!req.user) {
			res.send({
				success: false,
				'message': 'please authenticate'
			})
			return
		}


		YouTube.find({
				$or: [{
					owner: req.user._id
				}, {
					status: 'Public'
				}]
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
	app.delete('/youtube/:id', function (req, res) {
		if (!req.user._id) {
			res.send({
				success: false,
				message: 'user not authenticated'
			})
		}
		YouTube.findOneAndRemove({
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