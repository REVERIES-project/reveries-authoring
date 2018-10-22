module.exports = function(app,logger) {
    var InventoryItem = require('../../models/inventoryItem.js')
    var CommonHelper = require('./commonHelper.js')

    app.put('/inventory/:id/share', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		CommonHelper.switchStatus(InventoryItem, req, res)

	})


	app.get('/inventory', function (req, res) {
		if (!req.user) {
			res.send({
				success: false,
				'message': 'please authenticate'
			})
			return
		}

		if (req.query && req.query.search) {
			InventoryItem.find({
					$text: {
						$search: req.query.search
					}
				})
				.populate('media')
				.populate('inventoryDoc')
				.exec(function (err, results) {
					res.send(results)

				})
			return
		}




		//   InventoryItem.find({ owner: req.user._id })
		InventoryItem.find({
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
			.populate('inventoryDoc')
			.exec(function (err, inventorys) {
				for (var i = 0; i < inventorys.length; i++) {
					var inventory = inventorys[i]
					if (inventory.owner == req.user._id) {
						inventory.readonly = 'readwrite'
					} else {
						inventory.readonly = 'readonly'
					}
				}
				res.send(inventorys)
			})
	})

	app.get('/inventory/:id', function (req, res) {
		InventoryItem.findOne({
				'_id': req.params.id
			})
			.populate('media')
			.populate('inventoryDoc')

			.exec(function (err, item) {
				res.send(item)
			})
	})

	app.delete('/inventory/:id', function (req, res) {
		if (!req.user._id) {
			res.send({
				success: false,
				message: 'user not authenticated'
			})
		}
		InventoryItem.findOneAndRemove({
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
	app.post('/inventory', function (req, res) {
		if (!req.isAuthenticated()) {
			res.send({
				success: false,
				message: 'Please authenticate'
			})
			return
		}
		var inventory = new InventoryItem()
		inventory.label = req.body.label
		inventory.itemText = req.body.itemText
		inventory.owner = req.user._id
		inventory.status = req.body.status
		inventory.media = req.body.itemPageId
		inventory.inventoryDoc = req.body.itemDocPageId
		var now = new Date()
		inventory.creationDate = now

		if (!req.body.itemId) {
			inventory.save(function (err) {
				if (err) {
					logger.log('error', 'Error while saving inventory %s', err.message)
					res.send({
						success: false
					})
				} else res.send({
					success: true,
					resource: inventory,
					operation: 'create'
				})
			})
		}
		if (req.body.itemId && req.body.itemId.length > 0) {
			InventoryItem.findById(req.body.itemId, function (err, toUpdate) {
				if (!toUpdate) {
					logger.log('error', 'Err, inventory item with id ' + req.body.itemId + ' does not exists')
				} else {
					logger.log('info', 'Updating inventory item %s', JSON.stringify(toUpdate))
					toUpdate.label = req.body.label
					toUpdate.itemText = req.body.itemText
					toUpdate.owner = req.user._id
					toUpdate.status = req.body.status
					toUpdate.media = req.body.itemPageId
					toUpdate.inventoryDoc = req.body.itemDocPageId
					toUpdate.save(function (err) {
						if (err) {
							logger.log('error', 'Error while updating inventory item %s', err.message)
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