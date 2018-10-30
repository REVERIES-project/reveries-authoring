module.exports = function(app,logger) {
    var Game = require('../../models/game.js')
    var CommonHelper = require('./commonHelper.js')

    // Sharing a unit game
	app.put('/unitgame/:id/share', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		CommonHelper.switchStatus(Game, req, res)

	})



    //Handle reception of a whole game unit, quite a lot of parameters
	// The game unit are saved in database mongodb://localhost/game to be accessible
	//from the game server
	app.post('/unitgame', function (req, res) {
		var game = new Game()

		if (req.isAuthenticated()) {
			game.owner = req.user._id
		}
		var now = new Date()
		game.creationDate = now
		game.label = req.body.label

        game.poiReachedMessage = req.body.poiReachedMessage
		game.inventoryItem = req.body.inventoryItem
		game.startMedia = req.body.startMedia
		game.feedbackMedia = req.body.feedbackMedia
		game.POI = req.body.poi
		game.poiMapGuidance = req.body.poiMapGuidance==="on" 

        game.freetextActivities = req.body.freetextActivities
		game.mcqActivities = req.body.mcqActivities
        game.foliaActivities=req.body.foliaActivities

		if (!req.body.itemId) {
			game.save(function (err) {
				if (err) {
					logger.log('error', 'Error while saving unit game %s', err.message)
					return 500
				}

				res.send({
					success: true,
					resource: game,
					operation: 'create'
				})
			})
			return
		}
		if (req.body.itemId && req.body.itemId.length > 0) {
			Game.findById(req.body.itemId, function (err, toUpdate) {
				if (!toUpdate) {
					logger.log('error', 'Err, unitGame with id ' + req.body.itemId + ' does not exists')
				} else {
					toUpdate.poiReachedMessage = req.body.poiReachedMessage
					toUpdate.inventoryItem = req.body.inventoryItem
                    
                    toUpdate.label = req.body.label
					toUpdate.startMedia = req.body.startMedia
					toUpdate.feedbackMedia = req.body.feedbackMedia
					toUpdate.POI = req.body.poi
					toUpdate.poiMapGuidance = req.body.poiMapGuidance==="on"

                    toUpdate.freetextActivities = req.body.freetextActivities
					toUpdate.mcqActivities = req.body.mcqActivities
					toUpdate.foliaActivities=req.body.foliaActivities

					toUpdate.save(function (err) {
						if (err) {
							logger.log('error', 'Error while updating unit game %s', err.message)
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

	//Return the list of Game (user independant)
	app.get('/unitgame', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}

		//Game.find({ owner: req.user._id })
		Game.find({
				$or: [{
					owner: req.user._id
				}, {
					status: 'Public'
				}]
			})
			.sort({
				creationDate: -1
			})
			.populate('startMedia')
			.populate('feedbackMedia')
			.populate('POI')
			.populate('foliaActivities')
			.deepPopulate(['inventoryItem','inventoryItem.media','freetextActivities','freetextactivities.media','mcqActivities','mcqActivities.media'])
			.exec(function (err, games) {

				for (var i = 0; i < games.length; i++) {
					var game = games[i]
					if (game.owner == req.user._id) {
						game.readonly = 'readwrite'
					} else {
						game.readonly = 'readonly'
					}
				}


				res.send(games)
			})

	})


    // Self explaining
	app.delete('/unitgame/:id', function (req, res) {
		if (!req.user._id) {
			res.send({
				success: false,
				message: 'user not authenticated'
			})
		}
		Game.findOneAndRemove({
				'_id': req.params.id
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