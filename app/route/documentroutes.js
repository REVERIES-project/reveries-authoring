module.exports = function (app, gfs, logger) {
	var spawn = require('child_process').spawn

	var mongoose = require('mongoose')

	// normal routes ===============================================================
	var User = require('../models/user.js')
	var Game = require('../models/game.js')
	var Badge = require('../models/badge.js')
	var InventoryItem = require('../models/inventoryItem.js')
	var Tutorial = require('../models/tutorial.js')
	var MLG = require('../models/mlg.js')
	var POI = require('../models/poi.js')
	var FreeText = require('../models/freetext.js')
	var MCQ = require('../models/mcq.js')
	var StaticMedia = require('../models/staticmedia.js')
	var YouTube = require('../models/youtube.js')
	var Folia = require('../models/folia.js')


	var staticMediaHandler=require('./resourcesRoutes/staticMediaRoute.js')(app,logger)
	var mcqHandler=require('./resourcesRoutes/mcqRoute.js')(app,logger)
	var freeTextHandler=require('./resourcesRoutes/freetextRoute.js')(app,logger)
	var inventoryHandler=require('./resourcesRoutes/inventoryRoute.js')(app,logger)
	var foliaHandler=require('./resourcesRoutes/foliaRoute.js')(app,logger)
	var badgeHandler=require('./resourcesRoutes/badgeRoute.js')(app,logger)
	var poiHandler=require('./resourcesRoutes/poiRoute.js')(app,logger)
	var youtubeHandler=require('./resourcesRoutes/youtubeRoute.js')(app,logger)
	var unitGameHandler=require('./resourcesRoutes/unitgameRoute.js')(app,logger)
	var mlgHandler=require('./resourcesRoutes/mlgRoute.js')(app,logger)

	

	// Handle reception of a new static media
	app.post('/tutorial', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		var tutorial = new Tutorial()
		tutorial.label = req.body.label
		var now = new Date()
		tutorial.creationDate = now
		tutorial.owner = req.user._id
		tutorial.status = req.body.status
		tutorial.reference = req.body.reference
		tutorial.order = req.body.order
		tutorial.mkdown = req.body.mkdown

		if (!req.body.itemId) {
			if (tutorial.order || tutorial.order == 0) {
				Tutorial.find({
						reference: tutorial.reference
					})
					.sort({
						order: 1
					})
					.exec(function (err, tutorials) {
						if (tutorial.order >= 0 && tutorial.order < tutorials.length) {
							tutorials.splice(tutorial.order, 0, tutorial)
							for (var i = 0; i < tutorials.length; i++) {
								tutorials[i].order = i
								tutorials[i].save()
								res.send({
									success: true,
									resource: tutorial,
									operation: 'create'
								})
							}
						}
					})
			} else {
				Tutorial.find({
						reference: tutorial.reference
					})
					.exec(function (err, tutorials) {
						tutorial.order = tutorials.length
						tutorial.save(function () {
							res.send({
								success: true,
								resource: tutorial,
								operation: 'create'
							})

						})
					})


			}

		}
		if (req.body.itemId && req.body.itemId.length > 0) {
			Tutorial.findById(req.body.itemId, function (err, toUpdate) {
				if (!toUpdate) {
					logger.log('error', 'Err, tutorial with id ' + req.body.itemId + ' does not exists')
				} else {
					logger.log('info', 'Updating tutorial %s', JSON.stringify(toUpdate))
					toUpdate.label = req.body.label
					toUpdate.owner = req.user._id
					toUpdate.status = req.body.status
					toUpdate.mkdown = req.body.mkdown
					toUpdate.reference = req.body.reference
					toUpdate.order = req.body.order

					toUpdate.save(function (err) {
						if (err) {
							logger.log('error', 'Error while saving tutorial %s', err.message)
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




	app.get('/tutorial', function (req, res) {
		if (!req.user) {
			res.send({
				success: false,
				'message': 'please authenticate'
			})
			return
		}
		if (req.query && req.query.search) {
			Tutorial.find({
				$text: {
					$search: req.query.search
				}
			}, function (err, results) {
				res.send(results)

			})
			return
		}

		//   StaticMedia.find({ owner: req.user._id })
		Tutorial.find({})
			.sort({
				reference: 1,
				order: 1
			})
			.exec(function (err, tutorials) {
				for (var i = 0; i < tutorials.length; i++) {
					var tutorial = tutorials[i]
					if (tutorial.owner == req.user._id) {
						tutorial.readonly = 'readwrite'
					} else {
						tutorial.readonly = 'readonly'
					}
				}

				res.send(tutorials)
			})


	})
	app.get('/setup_tutorial', function (req, res) {
			if (!req.user) {
				res.send({
					success: false,
					'message': 'please authenticate'
				})
				return
			}
			User.findOne({
					name: 'tutorial'
				})
				.exec(function (err, tutorialUser) {
					if (tutorialUser == null) {
						return
					}
					gfs.files.find({
						contentType: /.*image.*/,
						'metadata.owner': tutorialUser._id.toString()
					}).toArray(function (err, images) {
						for (var i = 0; i < images.length; i++) {
							var metadata = {
								owner: req.user._id.toString(),
								status: 'Private',
								typeLabel: 'Image',
								title: images[i].filename
							}

							var writestream = gfs.createWriteStream({
								filename: images[i].filename,
								mode: 'w',
								content_type: images[i].contentType,
								metadata: metadata,
							})
							var readstream = gfs.createReadStream({
								_id: images[i]._id
							}).pipe(writestream)


							writestream.on('close', function () {

							})
							// writestream.end();
						}

					})
					Badge.find({
							owner: tutorialUser._id
						})
						.exec(function (err, badges) {
							for (var i = 0; i < badges.length; i++) {
								badges[i].owner = req.user._id
								badges[i]._id = mongoose.Types.ObjectId()
								badges[i].isNew = true
								badges[i].save()
							}
						})

					StaticMedia.find({
							owner: tutorialUser._id
						})
						.exec(function (err, StaticMedias) {
							for (var i = 0; i < StaticMedias.length; i++) {
								StaticMedias[i].owner = req.user._id
								StaticMedias[i]._id = mongoose.Types.ObjectId()
								StaticMedias[i].isNew = true
								StaticMedias[i].save()
							}
						})
					MCQ.find({
							owner: tutorialUser._id
						})
						.exec(function (err, Mcqs) {
							for (var i = 0; i < Mcqs.length; i++) {
								Mcqs[i].owner = req.user._id
								Mcqs[i]._id = mongoose.Types.ObjectId()
								Mcqs[i].isNew = true
								Mcqs[i].save()
							}
						})
					POI.find({
							owner: tutorialUser._id
						})
						.exec(function (err, Pois) {
							for (var i = 0; i < Pois.length; i++) {
								Pois[i].owner = req.user._id
								Pois[i]._id = mongoose.Types.ObjectId()
								Pois[i].isNew = true
								Pois[i].save()
							}
						})


					Game.find({
							owner: tutorialUser._id
						})
						.exec(function (err, Games) {
							for (var i = 0; i < Games.length; i++) {
								Games[i].owner = req.user._id
								Games[i]._id = mongoose.Types.ObjectId()
								Games[i].isNew = true
								Games[i].save()
							}
						})

					MLG.find({
							owner: tutorialUser._id
						})
						.exec(function (err, Mlgs) {
							for (var i = 0; i < Mlgs.length; i++) {
								Mlgs[i].owner = req.user._id
								Mlgs[i]._id = mongoose.Types.ObjectId()
								Mlgs[i].isNew = true
								Mlgs[i].save()
							}
						})


					FreeText.find({
							owner: tutorialUser._id
						})
						.exec(function (err, Freetexts) {
							for (var i = 0; i < Freetexts.length; i++) {
								Freetexts[i].owner = req.user._id
								Freetexts[i]._id = mongoose.Types.ObjectId()
								Freetexts[i].isNew = true
								Freetexts[i].save()
							}
						})

					res.send({
						success: true,
						operation: 'import',
						resource: null
					})




				})
		}),
		app.get('/tutorialByReference', function (req, res) {
			//   StaticMedia.find({ owner: req.user._id })
			Tutorial.aggregate([{
					$group: {
						_id: '$reference',
						tuto: {
							$push: '$$ROOT'
						}
					}
				}, {
					$sort: {
						'order': 1
					}
				}])
				.exec(function (err, tutorials) {
					if (tutorials === undefined) {
						return res.send(err)
					}
					for (var i = 0; i < tutorials.length; i++) {
						tutorials[i].tuto = tutorials[i].tuto.sort(function (a, b) {
							if (a.order < b.order)
								return -1
							else
								return 1
						})
					}
					res.send(tutorials)
				})


		})




	app.delete('/tutorial/:id', function (req, res) {
		if (!req.user._id) {
			res.send({
				success: false,
				message: 'user not authenticated'
			})
		}
		Tutorial.findOneAndRemove({
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

	// Handle reception of a new free text activity designed by conceptor











	var switchStatus = function (model, req, res) {
		model.findById(req.params.id, function (err, resp) {
			if (!err) {
				if (resp && req.user._id == resp.owner) {
					if (resp.status == 'Public') {
						resp.status = 'Private'
					} else {
						resp.status = 'Public'
					}
					resp.save(function (err) {
							if (err) {
								res.send({
									success: false
								})
							} else {
								res.send({
									success: true
								})
							}

						}

					)
				} else {
					res.send({
						success: false,
						message: 'User not owner of resource'
					})
				}
			}
		})

	}





	app.get('/qrcode/:id', function (req, res) {
		//res.header('Content-Type', 'image/png');

		tail = spawn('qrencode', ['-o', '-', req.params.id, '-s', 30])
		tail.stdout.on('data', function (data) {
			console.log('stdout: ' + data)
			res.write(data, 'utf-8')
		})
		tail.stderr.on('data', function (data) {
			console.log('stderr: ' + data)
			res.write(data, 'utf-8')
		})
		tail.on('exit', function (code) {
			console.log('child process exited with code ' + code)
			res.end(code)
		})
	})


	app.get('/listUsers', function (req, res) {
		var userPromises = []
		User.find()
			.exec(function (err, users) {
				for (var i = 0; i < users.length; i++) {
					userPromises.push(populateUsersPOI(users[i]))
					userPromises.push(populateUsersMCQ(users[i]))
					userPromises.push(populateUsersFreetext(users[i]))
					userPromises.push(populateUsersStaticMedia(users[i]))
					userPromises.push(populateUsersUnitGames(users[i]))
					userPromises.push(populateUsersBadges(users[i]))
					userPromises.push(populateUsersInventory(users[i]))
					userPromises.push(populateUsersMLG(users[i]))

				}
			}).then(function (users) {
				Promise.all(userPromises).then(function () {
					res.send(users)
				})

			})

	})

	var populateUsersPOI = function (user) {
		return POI.find({
				owner: user._id
			})
			.exec(function (err, pois) {
				user.POI = pois
			})
	}

	var populateUsersMCQ = function (user) {
		return MCQ.find({
				owner: user._id
			})
			.exec(function (err, mcqs) {
				user.MCQ = mcqs
			})
	}


	var populateUsersFreetext = function (user) {
		return FreeText.find({
				owner: user._id
			})
			.exec(function (err, freetexts) {
				user.Freetexts = freetexts
			})
	}

	var populateUsersStaticMedia = function (user) {
		return StaticMedia.find({
				owner: user._id
			})
			.exec(function (err, staticmedias) {
				user.staticMedias = staticmedias
			})
	}
	var populateUsersUnitGames = function (user) {
		return Game.find({
				owner: user._id
			})
			.exec(function (err, unitGames) {
				user.unitGames = unitGames
			})
	}

	var populateUsersBadges = function (user) {
		return Badge.find({
				owner: user._id
			})
			.exec(function (err, badges) {
				user.Badges = badges
			})
	}
	var populateUsersInventory = function (user) {
		return InventoryItem.find({
				owner: user._id
			})
			.exec(function (err, items) {
				user.inventoryItems = items
			})
	}

	var populateUsersMLG = function (user) {
		return MLG.find({
				owner: user._id
			})
			.exec(function (err, mlgs) {
				user.MLG = mlgs
			})
	}


	app.get('/userImages', function (req, res) {
		var targetUser = req.param('userId')
		gfs.files.find({
			contentType: /.*image.*/,
			'metadata.owner': targetUser
		}).toArray(function (err, images) {
			res.send(images)
		})
	})





	app.delete('/user/:id', function (req, res) {
		if (!req.user) {
			res.send({
				success: false,
				message: 'user not authenticated'
			})
		}
		if (!req.user.isadmin) {
			res.send({
				success: false,
				message: 'Only admin can suppress acount'
			})
		}

		User.findOneAndRemove({
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


	app.delete('/userResources', function (req, res) {
		if (!req.user) {
			res.send({
				success: false,
				message: 'user not authenticated'
			})
		}

		if (!req.user.isadmin) {
			res.send({
				success: false,
				message: 'Only admin can suppress resources'
			})
		}

		var userTarget = req.param('targetUser')
		switch (req.param('resourceType')) {
			case 'POI':
				removeUserPOIs(userTarget, res)
				break
			case 'MCQ':
				removeUserMCQs(userTarget, res)
				break
			case 'FreeText':
				removeUserFreetexts(userTarget, res)
				break
			case 'StaticMedia':
				removeUserStaticMedias(userTarget, res)
				break
			case 'UnitGame':
				removeUserUnitgames(userTarget, res)
				break
			case 'Badge':
				removeUserBadges(userTarget, res)
				break
			case 'Inventory':
				removeUserInventory(userTarget, res)
				break
			case 'MLG':
				removeUserMLGs(userTarget, res)
				break
			case 'Image':
				removeUserImages(userTarget, res)

		}
	})


	var removeUserPOIs = function (userTarget, res) {
		return POI.remove({
				owner: userTarget
			})
			.exec(function (err, pois) {
				res.send({
					success: true,
					resourceType: 'POI',
					operation: 'bulkDelete',
					resource: pois
				})

			})
	}

	var removeUserMCQs = function (userTarget, res) {
		return MCQ.remove({
				owner: userTarget
			})
			.exec(function (err, mcqs) {
				res.send({
					success: true,
					resourceType: 'MCQ',
					operation: 'bulkDelete',
					resource: mcqs
				})
			})
	}


	var removeUserFreetexts = function (userTarget, res) {
		return FreeText.remove({
				owner: userTarget
			})
			.exec(function (err, freetexts) {
				res.send({
					success: true,
					resourceType: 'FreeText',
					operation: 'bulkDelete',
					resource: freetexts
				})
			})
	}

	var removeUserStaticMedias = function (userTarget, res) {
		return StaticMedia.remove({
				owner: userTarget
			})
			.exec(function (err, staticmedias) {
				res.send({
					success: true,
					resourceType: 'multimedia documents',
					operation: 'bulkDelete',
					resource: staticmedias
				})
			})
	}
	var removeUserUnitgames = function (userTarget, res) {
		return Game.remove({
				owner: userTarget
			})
			.exec(function (err, unitGames) {
				res.send({
					success: true,
					resourceType: 'unité de jeux',
					operation: 'bulkDelete',
					resource: unitGames
				})
			})
	}

	var removeUserBadges = function (userTarget, res) {
		return Badge.remove({
				owner: userTarget
			})
			.exec(function (err, badges) {
				res.send({
					success: true,
					resourceType: 'badges',
					operation: 'bulkDelete',
					resource: badges
				})
			})
	}
	var removeUserInventory = function (userTarget, res) {
		return InventoryItem.remove({
				owner: userTarget
			})
			.exec(function (err, items) {
				res.send({
					success: true,
					resourceType: 'inventaire',
					operation: 'bulkDelete',
					resource: items
				})
			})
	}

	var removeUserMLGs = function (userTarget, res) {
		return MLG.remove({
				owner: userTarget
			})
			.exec(function (err, mlgs) {
				res.send({
					success: true,
					resourceType: 'MLG',
					operation: 'bulkDelete',
					resource: mlgs
				})
			})
	}



	var removeUserImages = function (userTarget, res) {
		gfs.files.remove({
			contentType: /.*image.*/,
			'metadata.owner': userTarget
		}, function () {
			res.send({
				success: true,
				resourceType: 'Images',
				operation: 'bulkDelete'
			})
		})
	}

	//self explaining





}