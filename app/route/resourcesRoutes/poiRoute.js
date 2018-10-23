module.exports = function(app,logger) {
    var POI = require('../../models/poi.js')
    var CommonHelper = require('./commonHelper.js')

	//Put operation allow to chhane the metadata
	// limited to share status for the moment 

	app.put('/poi/:id/share', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		CommonHelper.switchStatus(POI, req, res)

	})


	//handle reception of a POI posted from a map,
	// with possible trigger area

	app.post('/poimap', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		var now = new Date()

		var condition = {
			'_id': req.user._id
		}
		var poi = {
			owner: req.user._id,
			status: req.body.status,
			comment: req.body.comment,
			label: req.body.label,
			creationDate: now,
			latitude: req.body.latitude,
			longitude: req.body.longitude,
			map: {
				marker: req.body.marker,
				mapLatitude: req.body.mapLatitude,
				mapLongitude: req.body.mapLongitude,
				mapZoom: req.body.mapZoom,
				areaLat: req.body.areaLat,
				areaLong: req.body.areaLong,
				areaRadius: req.body.radius,
			}
		}
		var Poi = new POI(poi)
		Poi.save(function (err) {
			if (err) {
				logger.log('error', 'Error while saving POI %s', err.message)
				return 500
			}
			res.send({
				success: true,
				resource: Poi,
				operation: 'create'
			})
		})
	})
	app.get('/poi/:id', function (req, res) {
		POI.findOne({
			'_id': req.params.id,
		}, function (err, poi) {
			res.send(poi)
		})

	})
	// Self explaining
	app.get('/poi', function (req, res) {
		if (!req.user) {
			res.send({
				success: false,
				'message': 'please authenticate'
			})
		} else
			//POI.find({ owner: req.user._id }) 
			POI.find({
				$or: [{
					owner: req.user._id
				}, {
					status: 'Public'
				}]
			})
			.sort({
				creationDate: -1
			})
			.exec(function (err, pois) {
				for (var i = 0; i < pois.length; i++) {
					var poi = pois[i]
					if (poi.owner == req.user._id) {
						poi.readonly = 'readwrite'
					} else {
						poi.readonly = 'readonly'
					}
				}

				res.send(pois)
			})
	})

	// Self explaining
	app.delete('/poi/:id', function (req, res) {
		if (!req.user) {
			res.send({
				success: false,
				message: 'user not authenticated'
			})
		}
		POI.findOneAndRemove({
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