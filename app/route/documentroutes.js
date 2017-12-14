module.exports = function(app, gfs) {
    var spawn = require('child_process').spawn;

    var mongoose = require('mongoose');

    // normal routes ===============================================================
    var User = require('../models/user.js');
    var Game = require('../models/game.js');
    var Badge = require('../models/badge.js');
    var InventoryItem = require('../models/inventoryItem.js');
    var dateFormat = require('dateformat');
    var Tutorial = require('../models/tutorial.js');
    var MLG = require('../models/mlg.js');
    var POI = require('../models/poi.js')
    var FreeText = require('../models/freetext.js')
    var MCQ = require('../models/mcq.js')
    var StaticMedia = require('../models/staticmedia.js')

    // Handle reception of a new static media
    app.post('/staticmedia', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        var staticmedia = new StaticMedia()
        staticmedia.label = req.body.label;
        var now = new Date()
        staticmedia.creationDate = now
        staticmedia.owner = req.user._id
        staticmedia.status = req.body.status;
        staticmedia.mkdown = req.body.mkdown;
        if (!req.body.itemId) {

            staticmedia.save(function(err) {
                if (err) {
                    console.log(err)
                    res.send({ success: false })
                } else res.send({ success: true, resource: staticmedia, operation: 'create' })
            })
        }
        if (req.body.itemId && req.body.itemId.length > 0) {
            StaticMedia.findById(req.body.itemId, function(err, toUpdate) {
                if (!toUpdate) {
                    console.log("Err, Freetext with id " + req.body.itemId + " does not exists")
                } else {
                    toUpdate.label = req.body.label;
                    toUpdate.owner = req.user._id
                    toUpdate.status = req.body.status;
                    toUpdate.mkdown = req.body.mkdown;
                    toUpdate.save(function(err) {
                        if (err) {
                            console.log(err)
                            res.send({ success: false })
                        } else res.send({ success: true, resource: toUpdate, operation: 'update' })

                    })

                }

            })
        }

    });
    app.post('/tutorial', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        var tutorial = new Tutorial()
        tutorial.label = req.body.label;
        var now = new Date()
        tutorial.creationDate = now
        tutorial.owner = req.user._id
        tutorial.status = req.body.status;
        tutorial.reference = req.body.reference
        tutorial.order = req.body.order
        tutorial.mkdown = req.body.mkdown;

        if (!req.body.itemId) {
            if (tutorial.order || tutorial.order == 0) {
                Tutorial.find({ reference: tutorial.reference })
                    .sort({ order: 1 })
                    .exec(function(err, tutorials) {
                        if (tutorial.order >= 0 && tutorial.order < tutorials.length) {
                            tutorials.splice(tutorial.order, 0, tutorial)
                            for (var i = 0; i < tutorials.length; i++) {
                                tutorials[i].order = i
                                tutorials[i].save()
                                res.send({ success: true, resource: tutorial, operation: 'create' })
                            }
                        }
                    })
            } else {
                Tutorial.find({ reference: tutorial.reference })
                    .exec(function(err, tutorials) {
                        tutorial.order = tutorials.length
                        tutorial.save(function() {
                            res.send({ success: true, resource: tutorial, operation: 'create' })

                        })
                    })


            }

        }
        if (req.body.itemId && req.body.itemId.length > 0) {
            Tutorial.findById(req.body.itemId, function(err, toUpdate) {
                if (!toUpdate) {
                    console.log("Err, tutorial with id " + req.body.itemId + " does not exists")
                } else {
                    console.log("Updating question " + req.body.itemId)
                    toUpdate.label = req.body.label;
                    toUpdate.owner = req.user._id
                    toUpdate.status = req.body.status;
                    toUpdate.mkdown = req.body.mkdown;
                    toUpdate.reference = req.body.reference
                    toUpdate.order = req.body.order

                    toUpdate.save(function(err) {
                        if (err) {
                            console.log(err)
                            res.send({ success: false })
                        } else res.send({ success: true, resource: toUpdate, operation: 'update' })

                    })

                }

            })
        }

    });

    app.post('/badge', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        var badge = new Badge()
        badge.label = req.body.label;
        badge.badgeText = req.body.badgeText;
        badge.owner = req.user._id
        badge.status = req.body.status;
        badge.media = req.body.badgePageId;
        var now = new Date()
        badge.creationDate = now

        if (!req.body.itemId) {
            badge.save(function(err) {
                if (err) {
                    console.log(err)
                    res.send({ success: false })
                } else res.send({ success: true, resource: badge, operation: 'create' })
            })
        }
        if (req.body.itemId && req.body.itemId.length > 0) {
            Badge.findById(req.body.itemId, function(err, toUpdate) {
                if (!toUpdate) {
                    console.log("Err, Badge with id " + req.body.itemId + " does not exists")
                } else {
                    console.log("Updating badge " + req.body.itemId)
                    toUpdate.label = req.body.label;
                    toUpdate.badgeText = req.body.badgeText;

                    toUpdate.owner = req.user._id
                    toUpdate.status = req.body.status;
                    toUpdate.media = req.body.badgePageId;
                    toUpdate.save(function(err) {
                        if (err) {
                            console.log(err)
                            res.send({ success: false })
                        } else res.send({ success: true, resource: toUpdate, operation: 'update' })

                    })

                }

            })
        }

    });

    app.get('/badge', function(req, res) {
        if (!req.user) {
            res.send({ success: false, 'message': 'please authenticate' })
            return
        }

        if (req.query && req.query.search) {
            Badge.find({ $text: { $search: req.query.search } })
                .populate('media')
                .exec(function(err, results) {
                    res.send(results)

                })
            return
        }



        //        Badge.find({ owner: req.user._id })
        Badge.find({ $or: [{ owner: req.user._id }, { status: 'Public' }] })
            .sort({ creationDate: -1 })
            .populate('media')
            .exec(function(err, badges) {
                for (var i = 0; i < badges.length; i++) {
                    var badge = badges[i]
                    if (badge.owner == req.user._id) {
                        badge.readonly = "readwrite"
                    } else {
                        badge.readonly = "readonly"
                    }
                }
                res.send(badges)
            })
    })
    app.delete('/badge/:id', function(req, res) {
        if (!req.user._id) { res.send({ success: false, message: 'user not authenticated' }) }
        Badge.findOneAndRemove({ '_id': req.params.id, owner: req.user._id },
            function(err, doc) {
                res.send({ success: true, resource: doc, operation: 'delete' });
            })
    });
    app.get('/inventory', function(req, res) {
        if (!req.user) {
            res.send({ success: false, 'message': 'please authenticate' })
            return
        }

        if (req.query && req.query.search) {
            InventoryItem.find({ $text: { $search: req.query.search } })
                .populate('media')
                .populate('inventoryDoc')
                .exec(function(err, results) {
                    res.send(results)

                })
            return
        }




        //   InventoryItem.find({ owner: req.user._id })
        InventoryItem.find({ $or: [{ owner: req.user._id }, { status: 'Public' }] })
            .sort({ creationDate: -1 })
            .populate('media')
            .populate('inventoryDoc')
            .exec(function(err, inventorys) {
                for (var i = 0; i < inventorys.length; i++) {
                    var inventory = inventorys[i]
                    if (inventory.owner == req.user._id) {
                        inventory.readonly = "readwrite"
                    } else {
                        inventory.readonly = "readonly"
                    }
                }
                res.send(inventorys)
            })
    })

    app.get('/inventory/:id', function(req, res) {
        InventoryItem.findOne({
                '_id': req.params.id
            })
            .populate('media')
            .populate('inventoryDoc')

            .exec(function(err, item) {
                res.send(item)
            })
    })

    app.delete('/inventory/:id', function(req, res) {
        if (!req.user._id) { res.send({ success: false, message: 'user not authenticated' }) }
        InventoryItem.findOneAndRemove({ '_id': req.params.id, owner: req.user._id },
            function(err, doc) {
                res.send({ success: true, resource: doc, operation: 'delete' });
            })
    });
    app.post('/inventory', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        var inventory = new InventoryItem()
        inventory.label = req.body.label;
        inventory.itemText = req.body.itemText;
        inventory.owner = req.user._id
        inventory.status = req.body.status;
        inventory.media = req.body.itemPageId;
        inventory.inventoryDoc = req.body.itemDocPageId;
        var now = new Date()
        inventory.creationDate = now

        if (!req.body.itemId) {
            inventory.save(function(err) {
                if (err) {
                    console.log(err)
                    res.send({ success: false })
                } else res.send({ success: true, resource: inventory, operation: 'create' })
            })
        }
        if (req.body.itemId && req.body.itemId.length > 0) {
            InventoryItem.findById(req.body.itemId, function(err, toUpdate) {
                if (!toUpdate) {
                    console.log("Err, Badge with id " + req.body.itemId + " does not exists")
                } else {
                    console.log("Updating badge " + req.body.itemId)
                    toUpdate.label = req.body.label;
                    toUpdate.itemText = req.body.itemText;
                    toUpdate.owner = req.user._id
                    toUpdate.status = req.body.status;
                    toUpdate.media = req.body.itemPageId;
                    toUpdate.inventoryDoc = req.body.itemDocPageId;
                    toUpdate.save(function(err) {
                        if (err) {
                            console.log(err)
                            res.send({ success: false })
                        } else res.send({ success: true, resource: toUpdate, operation: 'update' })

                    })

                }

            })
        }

    });



    app.get('/staticmedia', function(req, res) {
        if (!req.user) {
            res.send({ success: false, 'message': 'please authenticate' })
            return
        }
        if (req.query && req.query.search) {
            StaticMedia.find({ $text: { $search: req.query.search } }, function(err, results) {
                res.send(results)

            })
            return
        }

        //   StaticMedia.find({ owner: req.user._id })
        StaticMedia.find({ $or: [{ owner: req.user._id }, { status: 'Public' }] })
            .sort({ creationDate: -1 })
            .exec(function(err, staticmedias) {
                for (var i = 0; i < staticmedias.length; i++) {
                    var staticmedia = staticmedias[i]
                    if (staticmedia.owner == req.user._id) {
                        staticmedia.readonly = "readwrite"
                    } else {
                        staticmedia.readonly = "readonly"
                    }
                }

                res.send(staticmedias)
            })


    })

    app.get('/tutorial', function(req, res) {
        if (!req.user) {
            res.send({ success: false, 'message': 'please authenticate' })
            return
        }
        if (req.query && req.query.search) {
            Tutorial.find({ $text: { $search: req.query.search } }, function(err, results) {
                res.send(results)

            })
            return
        }

        //   StaticMedia.find({ owner: req.user._id })
        Tutorial.find({})
            .sort({ reference: 1, order: 1 })
            .exec(function(err, tutorials) {
                for (var i = 0; i < tutorials.length; i++) {
                    var tutorial = tutorials[i]
                    if (tutorial.owner == req.user._id) {
                        tutorial.readonly = "readwrite"
                    } else {
                        tutorial.readonly = "readonly"
                    }
                }

                res.send(tutorials)
            })


    })
    app.get('/setup_tutorial', function(req, res) {
            if (!req.user) {
                res.send({ success: false, 'message': 'please authenticate' })
                return
            }
            User.findOne({ name: 'tutorial' })
                .exec(function(err, tutorialUser) {
                    if (tutorialUser == null) {
                        return
                    }
                    gfs.files.find({ contentType: /.*image.*/, 'metadata.owner': tutorialUser._id.toString() }).toArray(function(err, images) {
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
                            });
                            var readstream = gfs.createReadStream({ _id: images[i]._id }).pipe(writestream);


                            writestream.on('close', function() {

                            })
                            // writestream.end();
                        }

                    })
                    Badge.find({ owner: tutorialUser._id })
                        .exec(function(err, badges) {
                            for (var i = 0; i < badges.length; i++) {
                                badges[i].owner = req.user._id
                                badges[i]._id = mongoose.Types.ObjectId();
                                badges[i].isNew = true
                                badges[i].save()
                            }
                        })

                    StaticMedia.find({ owner: tutorialUser._id })
                        .exec(function(err, StaticMedias) {
                            for (var i = 0; i < StaticMedias.length; i++) {
                                StaticMedias[i].owner = req.user._id
                                StaticMedias[i]._id = mongoose.Types.ObjectId();
                                StaticMedias[i].isNew = true
                                StaticMedias[i].save()
                            }
                        })
                    res.send({ success: true, operation: 'import', resource: null })




                })
        }),
        app.get('/tutorialByReference', function(req, res) {
            if (!req.user) {
                res.send({ success: false, 'message': 'please authenticate' })
                return
            }

            //   StaticMedia.find({ owner: req.user._id })
            Tutorial.aggregate([{ $group: { _id: "$reference", tuto: { $push: "$$ROOT" } } }, { $sort: { "order": 1 } }])
                .exec(function(err, tutorials) {
                    console.log(tutorials)
                    for (var i = 0; i < tutorials.length; i++) {
                        tutorials[i].tuto = tutorials[i].tuto.sort(function(a, b) {
                            if (a.order < b.order)
                                return -1
                            else
                                return 1
                        })
                    }
                    res.send(tutorials)
                })


        })

    app.get('/staticmedia/:id', function(req, res) {
        if (!req.user) {
            res.send({ success: false, 'message': 'please authenticate' })
        } else
            StaticMedia.findOne({ '_id': req.params.id },
                function(err, doc) {
                    res.send(doc);
                })
    })


    app.delete('/staticmedia/:id', function(req, res) {
        if (!req.user._id) { res.send({ success: false, message: 'user not authenticated' }) }
        StaticMedia.findOneAndRemove({ '_id': req.params.id, owner: req.user._id },
            function(err, doc) {
                res.send({ success: true, resource: doc, operation: 'delete' });
            })
    });

    app.delete('/tutorial/:id', function(req, res) {
        if (!req.user._id) { res.send({ success: false, message: 'user not authenticated' }) }
        Tutorial.findOneAndRemove({ '_id': req.params.id },
            function(err, doc) {
                res.send({ success: true, resource: doc, operation: 'delete' });
            })
    });

    // Handle reception of a new free text activity designed by conceptor
    app.post('/freetextactivity', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        var newFreeText = new FreeText()
        newFreeText.question = req.body.question;
        newFreeText.label = req.body.label;
        newFreeText.response = req.body.response;
        newFreeText.wrongMessage = req.body.wrongMessage;
        newFreeText.correctMessage = req.body.correctMessage;
        newFreeText.media = req.body.mediaId;
        newFreeText.owner = req.user._id
        newFreeText.status = req.body.status;
        newFreeText.responseLabel = req.body.responseLabel;
        var now = new Date()
        newFreeText.creationDate = now

        if (!req.body.itemId) {
            newFreeText.save(function(err) {
                if (err) {
                    console.log(err)
                    res.send({ success: false })
                } else res.send({ success: true, resource: newFreeText, operation: 'create' })
            })
        }

        if (req.body.itemId && req.body.itemId.length > 0) {
            FreeText.findById(req.body.itemId, function(err, toUpdate) {
                if (!toUpdate) {
                    console.log("Err, Freetext with id " + req.body.itemId + " does not exists")
                } else {
                    console.log("Updating question " + req.body.itemId)
                    toUpdate.question = req.body.question;
                    toUpdate.label = req.body.label;
                    toUpdate.response = req.body.response;
                    toUpdate.wrongMessage = req.body.wrongMessage;
                    toUpdate.correctMessage = req.body.correctMessage;
                    toUpdate.media = req.body.mediaId;
                    toUpdate.owner = req.user._id
                    toUpdate.status = req.body.status;
                    toUpdate.save(function(err) {
                        if (err) {
                            console.log(err)
                            res.send({ success: false })
                        } else res.send({ success: true, resource: toUpdate, operation: 'update' })

                    })

                }

            })
        }

    });



    app.get('/freetextactivity', function(req, res) {
        if (!req.user) {
            res.send({ success: false, 'message': 'please authenticate' })
            return
        }

        if (req.query && req.query.search) {
            FreeText.find({ $text: { $search: req.query.search } })
                .populate('media')
                .exec(function(err, results) {
                    res.send(results)

                })
            return
        }



        // FreeText.find({ owner: req.user._id })
        FreeText.find({ $or: [{ owner: req.user._id }, { status: 'Public' }] })
            .sort({ creationDate: -1 })
            .populate('media')
            .exec(function(err, freetexts) {
                for (var i = 0; i < freetexts.length; i++) {
                    var freetext = freetexts[i]
                    if (freetext.owner == req.user._id) {
                        freetext.readonly = "readwrite"
                    } else {
                        freetext.readonly = "readonly"
                    }

                }
                res.send(freetexts)
            })
    })


    app.get('/freetext/:id', function(req, res) {

        FreeText.findOne({ '_id': req.params.id }, function(err, freetext) {
            res.send(freetext)
        })
    })

    app.delete('/freetextactivity/:id', function(req, res) {
        if (!req.user._id) { res.send({ success: false, message: 'user not authenticated' }) }
        FreeText.findOneAndRemove({ '_id': req.params.id, owner: req.user._id },
            function(err, doc) {
                res.send({ success: true, resource: doc, operation: 'delete' });
            })
    });

    // Handle reception of a new mcq activity designed by conceptor
    app.post('/mcq', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        var Mcq = new MCQ();
        Mcq.owner = req.user._id
        Mcq.status = req.body.status
        Mcq.label = req.body.label
        Mcq.question = req.body.question;
        Mcq.distractor1 = req.body.distractor1;
        Mcq.distractor2 = req.body.distractor2;
        Mcq.response = req.body.response;
        Mcq.wrongMessage = req.body.wrongMessage;
        Mcq.correctMessage = req.body.correctMessage;
        Mcq.media = req.body.mediaId;
        var now = new Date()
        Mcq.creationDate = now

        //save if no mediaId
        if (!req.body.itemId) {
            Mcq.save(function(err) {
                if (err) {
                    console.log(err)
                    res.send({ success: false })
                } else res.send({ success: true, resource: Mcq, operation: 'create' })

            })
        }
        //update existing MCQ if mediaId
        if (req.body.itemId && req.body.itemId.length > 0) {
            MCQ.findById(req.body.itemId, function(err, toUpdate) {
                if (!toUpdate) {
                    console.log("Err, MCQ with id " + req.body.itemId + " does not exists")
                } else {
                    console.log("Updating question " + req.body.itemId)
                    toUpdate.owner = req.user._id
                    toUpdate.status = req.body.status
                    toUpdate.label = req.body.label
                    toUpdate.question = req.body.question;
                    toUpdate.distractor1 = req.body.distractor1;
                    toUpdate.distractor2 = req.body.distractor2;
                    toUpdate.response = req.body.response;
                    toUpdate.wrongMessage = req.body.wrongMessage;
                    toUpdate.correctMessage = req.body.correctMessage;
                    toUpdate.media = req.body.mediaId;
                    toUpdate.save(function(err) {
                        if (err) {
                            console.log(err)
                            res.send({ success: false })
                        } else res.send({ success: true, resource: toUpdate, operation: 'update' })

                    })

                }

            })
        }
    });


    // Return the list of mcq owned by current user
    app.get('/mcq', function(req, res) {
        if (!req.user) {
            res.send({ success: false, 'message': 'please authenticate' })
            return
        }


        if (req.query && req.query.search) {
            MCQ.find({ $text: { $search: req.query.search } })
                .populate('media')
                .exec(function(err, results) {
                    res.send(results)

                })
            return
        }



        //        MCQ.find({ owner: req.user._id })
        MCQ.find({ $or: [{ owner: req.user._id }, { status: 'Public' }] })
            .sort({ creationDate: -1 })
            .populate('media')
            .exec(function(err, mcqs) {
                for (var i = 0; i < mcqs.length; i++) {
                    var mcq = mcqs[i]
                    if (mcq.owner == req.user._id) {
                        mcq.readonly = "readwrite"
                    } else {
                        mcq.readonly = "readonly"
                    }
                }
                res.send(mcqs)
            })

    });


    app.get('/mcq/:id', function(req, res) {
        MCQ.findOne({ '_id': req.params.id, })
            .populate('media')
            .exec(function(err, mcq) {
                res.send(mcq);
            })


    });

    app.delete('/mcq/:id', function(req, res) {
        if (!req.user._id) { res.send({ success: false, message: 'user not authenticated' }) }
        MCQ.findOneAndRemove({ '_id': req.params.id, owner: req.user._id },
            function(err, doc) {
                res.send({ success: true, resource: doc, operation: 'delete' });
            })

    })

    app.post('/mlg', function(req, res) {
        var mlg = new MLG();

        mlg.label = req.body.label
        mlg.startpage = req.body.startpage
        if (req.body.multi && req.body.multi === 'on') {
            mlg.isCompetition = true
            mlg.playerNbr = req.body.playerNbr
        }
        mlg.owner = req.user._id
        mlg.status = req.body.status
        mlg.gameDifficulty = req.body.gameDifficulty
        mlg.gameDuration = req.body.gameDuration
        mlg.gameProximity = req.body.gameProximity
        mlg.unitGames = req.body.unitGames
        mlg.badge = req.body.badge
        var now = new Date()
        mlg.creationDate = now

        mlg.save(function(err) {
            if (err) {
                console.log(err)
                return 500;
            }

            res.send({ success: true, resource: mlg, operation: 'create' })
        });


    })

    //return a given game by idin
    app.get('/unitgame/:id', function(req, res) {
        Game.find({ '_id': req.params.id, })
            .populate('startMedia')
            .populate('feedbackMedia')
            .populate('POI')
            .populate('inventoryItem')
            .exec(function(err, game) {
                res.send(game);
            })


    })


    // Return the list of freeTextActivities owned by current user


    //Return the list of Game (user independant)
    app.get('/unitgame', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }

        //Game.find({ owner: req.user._id })
        Game.find({ $or: [{ owner: req.user._id }, { status: 'Public' }] })
            .sort({ creationDate: -1 })
            .populate('startMedia')
            .populate('feedbackMedia')
            .populate('POI')
            .populate('freetextActivities')
            .populate('mcqActivities')
            .populate('inventoryItem')
            .exec(function(err, games) {

                for (var i = 0; i < games.length; i++) {
                    var game = games[i]
                    if (game.owner == req.user._id) {
                        game.readonly = "readwrite"
                    } else {
                        game.readonly = "readonly"
                    }
                }


                res.send(games);
            })

    })

    // Self explaining
    app.delete('/unitgame/:id', function(req, res) {
        if (!req.user._id) { res.send({ success: false, message: 'user not authenticated' }) }
        Game.findOneAndRemove({ '_id': req.params.id },
            function(err, doc) {
                res.send({ success: true, resource: doc, operation: 'delete' });
            })

    })


    //Handle reception of a whole game unit, quite a lot of parameters
    // The game unit are saved in database mongodb://localhost/game to be accessible
    //from the game server

    app.post('/unitgame', function(req, res) {
        var startMedia = null
        var poi = null
        var freetextActivities = []
        var mcqActivities = []
        var activityOrder
        var feedbackMedia

        var poiPAId
        var poiGuidFolia
        var poiGuidType
        var poiGuidMap
        var poiGuidClue
        var inventoryItem


        var poiGPSValidation
        var poiQRValidation
        var poiIncorrectMessage
        var poiReachedMessage
        var clueGuidance
        var activity1Success
        var activity1Fail
        var activity2Success
        var activity2Fail
        var activity3Success
        var activity3Fail

        var situatedAct1;
        var situatedAct2;
        var situatedAct3;
        if (req.body.gps) {
            poiGPSValidation = true
        }
        if (req.body.act1success) {
            activity1Success = req.body.act1success
        }
        if (req.body.act1fail) {
            activity1Fail = req.body.act1fail
        }
        if (req.body.act2success) {
            activity2Success = req.body.act2success
        }
        if (req.body.act2fail) {
            activity2Fail = req.body.act2fail
        }
        if (req.body.act3success) {
            activity3Success = req.body.act3success
        }
        if (req.body.act3fail) {
            activity3Fail = req.body.act3fail
        }

        if (req.body.poiIncorrectMessage) {
            poiIncorrectMessage = req.body.poiIncorrectMessage
        }
        if (req.body.poiReachedMessage) {
            poiReachedMessage = req.body.poiReachedMessage
        }
        if (req.body.inventoryItem) {
            inventoryItem = req.body.inventoryItem
        }
        if (req.body.QR) {
            poiQRValidation = true
        }

        if (req.body.map || req.body.compass || req.body.ping) {
            poiGuidMap = true
            if (req.body.map) {
                poiGuidType = "map"
            } else if (req.body.compass) {
                poiGuidType = "compass"
            } else if (req.body.ping) {
                poiGuidType = "ping"
            }
        }
        if (req.body.folia) {
            poiGuidFolia = true
        }
        if (req.body.cluePoiMedia) {
            poiGuidClue = true
        }

        if (req.body.clueGuidance) {
            clueGuidance = req.body.clueGuidance
        }

        if (req.body.poiPAId) {
            poiPAId = req.body.poiPAId
        }
        if (req.body.startMedia)
            startMedia = req.body.startMedia;
        if (req.body.feedbackMedia)
            feedbackMedia = req.body.feedbackMedia;
        if (req.body.poi)
            poi = req.body.poi
        if (req.body.freetextActivities) {
            freetextActivities = req.body.freetextActivities
        }
        if (req.body.mcqActivities) {
            mcqActivities = req.body.mcqActivities
        }



        var game = new Game();

        if (req.isAuthenticated()) {
            game.owner = req.user._id
        }

        game.inventoryPage = req.body.inventoryStep
        game.activity1Success = activity1Success
        game.activity1Fail = activity1Fail
        game.activity2Success = activity2Success
        game.activity2Fail = activity2Fail
        var now = new Date()
        game.creationDate = now
        game.activity3Success = activity3Success
        game.activity3Fail = activity3Fail
        game.activityOrder = req.body.activityOrder
        game.poiIncorrectMessage = poiIncorrectMessage
        game.poiReachedMessage = poiReachedMessage
        game.inventoryItem = inventoryItem
        game.poiGPSValidation = poiGPSValidation
        game.poiQRValidation = poiQRValidation
        game.poiGuidMap = poiGuidMap
        game.poiGuidClue = poiGuidClue
        game.poiGuidFolia = poiGuidFolia
        game.label = req.body.label;
        game.startMedia = startMedia;
        game.feedbackMedia = feedbackMedia;
        game.POI = poi
        game.poiGuidType = poiGuidType
        game.poiPAId = poiPAId
        game.clueGuidance = clueGuidance
        game.freetextActivities = freetextActivities;
        game.mcqActivities = mcqActivities
        game.poiScorePA = req.body.poiScorePA
        game.poiPA = req.body.poiPA;
        game.act1successScore = req.body.act1successScore
        game.act1successMed = req.body.act1successMed
        game.act2successScore = req.body.act2successScore
        game.act2successMed = req.body.act2successMed


        if (!req.body.itemId) {
            game.save(function(err) {
                if (err) {
                    console.log(err)
                    return 500;
                }

                res.send({ success: true, resource: game, operation: 'create' })
            });
            return
        }
        if (req.body.itemId && req.body.itemId.length > 0) {
            Game.findById(req.body.itemId, function(err, toUpdate) {
                if (!toUpdate) {
                    console.log("Err, unitGame with id " + req.body.itemId + " does not exists")
                } else {
                    toUpdate.inventoryPage = req.body.inventoryStep
                    toUpdate.activity1Success = activity1Success
                    toUpdate.activity1Fail = activity1Fail
                    toUpdate.activity2Success = activity2Success
                    toUpdate.activity2Fail = activity2Fail
                    toUpdate.activity3Success = activity3Success
                    toUpdate.activity3Fail = activity3Fail
                    toUpdate.activityOrder = req.body.activityOrder
                    toUpdate.poiIncorrectMessage = poiIncorrectMessage
                    toUpdate.poiReachedMessage = poiReachedMessage
                    toUpdate.inventoryItem = inventoryItem
                    toUpdate.poiGPSValidation = poiGPSValidation
                    toUpdate.poiQRValidation = poiQRValidation
                    toUpdate.poiGuidMap = poiGuidMap
                    toUpdate.poiGuidClue = poiGuidClue
                    toUpdate.poiGuidFolia = poiGuidFolia
                    toUpdate.label = req.body.label;
                    toUpdate.startMedia = startMedia;
                    toUpdate.feedbackMedia = feedbackMedia;
                    toUpdate.POI = poi
                    toUpdate.poiGuidType = poiGuidType
                    toUpdate.poiPAId = poiPAId
                    toUpdate.clueGuidance = clueGuidance
                    toUpdate.freetextActivities = freetextActivities;
                    toUpdate.mcqActivities = mcqActivities
                    toUpdate.poiScorePA = req.body.poiScorePA
                    toUpdate.poiPA = req.body.poiPA;
                    toUpdate.act1successScore = req.body.act1successScore
                    toUpdate.act1successMed = req.body.act1successMed
                    toUpdate.act2successScore = req.body.act2successScore
                    toUpdate.act2successMed = req.body.act2successMed
                    toUpdate.save(function(err) {
                        if (err) {
                            console.log(err)
                            res.send({ success: false })
                        } else res.send({ success: true, resource: toUpdate, operation: 'update' })

                    })

                }

            })
        }

    })
    //handle reception lgof a complete game
    app.get('/mlg', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }

        // MLG.find({ owner: req.user._id })
        MLG.find({ $or: [{ owner: req.user._id }, { status: 'Public' }] })
            .sort({ creationDate: -1 })            
            .deepPopulate(['startpage', 'badge', 'unitGames', 'unitGames.startMedia', 'unitGames.feedbackMedia', 'unitGames.freetextActivities', 'unitGames.mcqActivities', 'unitGames.mcqActivities.media', 'unitGames.inventoryItem', 'unitGames.inventoryItem.media', 'unitGames.inventoryItem.inventoryDoc', 'unitGames.POI'])
            .exec(function(err, mlgs) {
                for (var i = 0; i < mlgs.length; i++) {
                    var mlg = mlgs[i]
                    if (mlg.owner == req.user._id) {
                        mlg.readonly = "readwrite"
                    } else {
                        mlg.readonly = "readonly"
                    }
                }
                res.send(mlgs)
            })
    })
    app.put('/unitgame/:id/share', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        switchStatus(Game, req, res);

    })


    app.put('/mlg/:id/share', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        switchStatus(MLG, req, res);

    })


    app.put('/freetext/:id/share', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        switchStatus(FreeText, req, res);

    })
    app.put('/inventory/:id/share', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        switchStatus(InventoryItem, req, res);

    })



    //Put operation allow to chhane the metadata
    // limited to share status for the moment 
    app.put('/mcq/:id/share', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        switchStatus(MCQ, req, res);

    })
    app.put('/badge/:id/share', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        switchStatus(Badge, req, res);

    })

    app.put('/poi/:id/share', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        switchStatus(POI, req, res);

    })


    //Put operation allow to chhane the metadata
    // limited to share status for the moment 
    app.put('/staticmedia/:id/share', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        switchStatus(StaticMedia, req, res);

    })



    var switchStatus = function(model, req, res) {
        model.findById(req.params.id, function(err, resp) {
            if (!err) {
                if (resp && req.user._id == resp.owner) {
                    if (resp.status == "Public") { resp.status = "Private" } else {
                        resp.status = "Public"
                    }
                    resp.save(function(err) {
                            if (err) {
                                res.send({ success: false })
                            } else {
                                res.send({ success: true })
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



    //handle reception of a POI posted from a map,
    // with possible trigger area

    app.post('/poimap', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        var now = new Date()

        var condition = {
            '_id': req.user._id
        };
        var poi = {
            owner: req.user._id,
            status: req.body.status,
            comment: req.body.comment,
            label: req.body.label,
            creationDate: now,
            label: req.body.label,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            photo: req.body.imageId,
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
        Poi.save(function(err) {
            if (err) {
                console.log(err)
                return 500;
            }
            res.send({ success: true, resource: Poi, operation: 'create' })
        });


    })
    app.get('/poi/:id', function(req, res) {
        POI.findOne({ '_id': req.params.id, }, function(err, poi) {
            res.send(poi);
        })

    })

    app.get('/qrcode/:id', function(req, res) {
        //res.header('Content-Type', 'image/png');

        tail = spawn('qrencode', ['-o', '-', '[' + req.params.id + ']', '-s', 30]);
        tail.stdout.on('data', function(data) {
            console.log('stdout: ' + data);
            res.write(data, 'utf-8');
        });
        tail.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
            res.write(data, 'utf-8');
        });
        tail.on('exit', function(code) {
            console.log('child process exited with code ' + code);
            res.end(code);
        });
    });


    app.get('/listUsers', function(req, res) {
        var userPromises = []
        User.find()
            .exec(function(err, users) {
                for (i = 0; i < users.length; i++) {
                    userPromises.push(populateUsersPOI(users[i]))
                    userPromises.push(populateUsersMCQ(users[i]))
                    userPromises.push(populateUsersFreetext(users[i]))
                    userPromises.push(populateUsersStaticMedia(users[i]))
                    userPromises.push(populateUsersUnitGames(users[i]))
                    userPromises.push(populateUsersBadges(users[i]))
                    userPromises.push(populateUsersInventory(users[i]))
                    userPromises.push(populateUsersMLG(users[i]))

                }
            }).then(function(users) {
                Promise.all(userPromises).then(function() {
                    res.send(users)
                })

            })

    })
    // Self explaining
    app.get('/poi', function(req, res) {
        if (!req.user) {
            res.send({ success: false, 'message': 'please authenticate' })
        } else
            //POI.find({ owner: req.user._id }) 
            POI.find({ $or: [{ owner: req.user._id }, { status: 'Public' }] })
            .sort({ creationDate: -1 })
            .exec(function(err, pois) {
                for (var i = 0; i < pois.length; i++) {
                    var poi = pois[i]
                    if (poi.owner == req.user._id) {
                        poi.readonly = "readwrite"
                    } else {
                        poi.readonly = "readonly"
                    }
                }

                res.send(pois)
            })
    })



    var populateUsersPOI = function(user) {
        return POI.find({ owner: user._id })
            .exec(function(err, pois) {
                user.POI = pois
            })
    }

    var populateUsersMCQ = function(user) {
        return MCQ.find({ owner: user._id })
            .exec(function(err, mcqs) {
                user.MCQ = mcqs
            })
    }


    var populateUsersFreetext = function(user) {
        return FreeText.find({ owner: user._id })
            .exec(function(err, freetexts) {
                user.Freetexts = freetexts
            })
    }

    var populateUsersStaticMedia = function(user) {
        return StaticMedia.find({ owner: user._id })
            .exec(function(err, staticmedias) {
                user.staticMedias = staticmedias
            })
    }
    var populateUsersUnitGames = function(user) {
        return Game.find({ owner: user._id })
            .exec(function(err, unitGames) {
                user.unitGames = unitGames
            })
    }

    var populateUsersBadges = function(user) {
        return Badge.find({ owner: user._id })
            .exec(function(err, badges) {
                user.Badges = badges
            })
    }
    var populateUsersInventory = function(user) {
        return InventoryItem.find({ owner: user._id })
            .exec(function(err, items) {
                user.inventoryItems = items
            })
    }

    var populateUsersMLG = function(user) {
        return MLG.find({ owner: user._id })
            .exec(function(err, mlgs) {
                user.MLG = mlgs
            })
    }


    app.get('/userImages', function(req, res) {
        var targetUser = req.param('userId')
        gfs.files.find({ contentType: /.*image.*/, 'metadata.owner': targetUser }).toArray(function(err, images) {
            res.send(images)
        })
    })



    // Self explaining
    app.delete('/poi/:id', function(req, res) {
        if (!req.user) { res.send({ success: false, message: 'user not authenticated' }) }
        POI.findOneAndRemove({ '_id': req.params.id, owner: req.user._id },
            function(err, doc) {
                res.send({ success: true, resource: doc, operation: 'delete' })
            })
    });


    app.delete('/user/:id', function(req, res) {
        if (!req.user) { res.send({ success: false, message: 'user not authenticated' }) }
        if (!req.user.isadmin) { res.send({ success: false, message: 'Only admin can suppress acount' }) }

        User.findOneAndRemove({ '_id': req.params.id },
            function(err, doc) {
                res.send({ success: true, resource: doc, operation: 'delete' })
            })
    });


    app.delete('/userResources', function(req, res) {
        if (!req.user) {
            res.send({ success: false, message: 'user not authenticated' })
        }

        if (!req.user.isadmin) {
            res.send({ success: false, message: 'Only admin can suppress resources' })
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
    });


    var removeUserPOIs = function(userTarget, res) {
        return POI.remove({ owner: userTarget })
            .exec(function(err, pois) {
                res.send({ success: true, resourceType: 'POI', operation: 'bulkDelete' })

            })
    }

    var removeUserMCQs = function(userTarget, res) {
        return MCQ.remove({ owner: userTarget })
            .exec(function(err, mcqs) {
                res.send({ success: true, resourceType: 'MCQ', operation: 'bulkDelete' })
            })
    }


    var removeUserFreetexts = function(userTarget, res) {
        return FreeText.remove({ owner: userTarget })
            .exec(function(err, freetexts) {
                res.send({ success: true, resourceType: 'FreeText', operation: 'bulkDelete' })
            })
    }

    var removeUserStaticMedias = function(userTarget, res) {
        return StaticMedia.remove({ owner: userTarget })
            .exec(function(err, staticmedias) {
                res.send({ success: true, resourceType: 'multimedia documents', operation: 'bulkDelete' })
            })
    }
    var removeUserUnitgames = function(userTarget, res) {
        return Game.remove({ owner: userTarget })
            .exec(function(err, unitGames) {
                res.send({ success: true, resourceType: 'unité de jeux', operation: 'bulkDelete' })
            })
    }

    var removeUserBadges = function(userTarget, res) {
        return Badge.remove({ owner: userTarget })
            .exec(function(err, badges) {
                res.send({ success: true, resourceType: 'badges', operation: 'bulkDelete' })
            })
    }
    var removeUserInventory = function(userTarget, res) {
        return InventoryItem.remove({ owner: userTarget })
            .exec(function(err, items) {
                res.send({ success: true, resourceType: 'inventaire', operation: 'bulkDelete' })
            })
    }

    var removeUserMLGs = function(userTarget, res) {
        return MLG.remove({ owner: userTarget })
            .exec(function(err, mlgs) {
                res.send({ success: true, resourceType: 'MLG', operation: 'bulkDelete' })
            })
    }


    var removeUserImages = function(userTarget, res) {
        return MLG.remove({ owner: userTarget })
            .exec(function(err, mlgs) {
                res.send({ success: true, resourceType: 'MLG', operation: 'bulkDelete' })
            })
    }

    var removeUserImages = function(userTarget, res) {
        gfs.files.remove({ contentType: /.*image.*/, 'metadata.owner': userTarget }, function() {
            res.send({ success: true, resourceType: 'Images', operation: 'bulkDelete' })
        })
    }

    app.delete('/mlg/:id', function(req, res) {
        var callback = function(err, numberAffected) {
            if (err) {
                res.send({
                    success: false
                })
            } else res.send({
                success: true,
                number: numberAffected
            });
        };
        MLG.find({ _id: req.params.id }).remove(callback)

    })
    //self explaining





}