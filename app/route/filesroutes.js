module.exports = function(app, passport, gfs) {

    // normal routes ===============================================================
    var mongoose = require('mongoose');
    var User = require('../models/user.js');


    //###################################################################
    //--------------- UTILITY FUNCTIONS
    //###################################################################






    // handle POI posted from app, since POI might contains a photo
    // we handle that case with if(req.files.file)


    // handle media posted by authenticated users
    app.post('/file', function(req, res) {
        if (req.isAuthenticated()) {
            var part = req.files;
            var metadata = {
                owner: req.user._id.toString(),
                status: 'Private',
                title: part.file.name,
                typeLabel: 'Image',
            }

            var writestream = gfs.createWriteStream({
                filename: part.file.name,
                mode: 'w',
                content_type: part.file.mimetype,
                metadata: metadata,
            });
            writestream.write(part.file.data);

            writestream.on('close', function() {
                res.send({
                    success: true,resource:metadata,operation:'create' 
                });

            })
            writestream.end();

        } else {
            res.send('Please authenticate first')
        }
    });





    app.delete('/file/:id', function(req, res) {
        var options = {
            _id: req.params.id
        };

        gfs.findOne(options, function(err, found) {
            if (found) {
                gfs.remove(options, function(err) {
                    if (err) {
                        res.send({
                            success: false
                        });
                    } else {
                        res.send({ success: true, resource: found.metadata, operation: 'delete' });

                    }

                });


            }
        });


    });


    // test function, not used in the web app
    app.get('/listAllFiles', function(req, res) {
        gfs.files.find({}).toArray(function(err, files) {
            res.send(files);
        })
    });


    // return all files owned by the user except photo associated
    // to POI and QRCode. The web client decides which files are media or not
    app.get('/listUserMediaFiles', function(req, res) {
        if (req.isAuthenticated()) {
            gfs.files.find({
                $or: [{ 'metadata.owner': req.user._id }, { 'metadata.status': 'Public' }]
            }).toArray(function(err, files) {
                for (var i = 0; i < files.length; i++) {
                    var filedata = files[i]
                    if (filedata.owner && filedata.owner == req.user._id) {
                        filedata.readonly = "readwrite"
                    } else {
                        filedata.readonly = "readonly"
                    }
                }

                res.send(files);
            })
        } else {
            res.send({
                success: false,
                message: 'User not authenticated'
            })
        }
    });

    app.get('/listUserQrcode', function(req, res) {
        if (req.isAuthenticated()) {
            gfs.files.find({
                'metadata.owner': req.user._id,
                'metadata.type': 'qrcode'
            }).toArray(function(err, files) {
                res.send(files);
            })
        } else {
            res.send({
                success: false,
                message: 'User not authenticated'
            })
        }
    });

    app.get('/listUserAudioVideo', function(req, res) {
        if (req.isAuthenticated()) {
            gfs.files.find({
                $and: [
                    { $or: [{ contentType: /.*audio.*/ }, { contentType: /.*video.*/ }] }, {
                        'metadata.owner': req.user._id.toString()
                    }
                ]
            }).toArray(function(err, files) {
                for (var i = 0; i < files.length; i++) {
                    var filedata = files[i]
                    filedata.typeLabel = 'video'
                    filedata.label = filedata.filename
                    filedata.status = filedata.metadata.status
                    if (filedata.metadata.owner && filedata.metadata.owner.toString() == req.user._id.toString()) {
                        filedata.readonly = "readwrite"
                    } else {
                        filedata.readonly = "readonly"
                    }
                }

                res.send(files);
            })
        } else {
            res.send({
                success: false,
                message: 'User not authenticated'
            })
        }
    });


    // return all images files owned by the user execpt qr code
    app.get('/listUserImages', function(req, res) {
        if (req.isAuthenticated()) {
            gfs.files.find({
                contentType: /.*image.*/,
                $or: [{ 'metadata.owner': req.user._id.toString() }, { 'metadata.status': 'Public' }],
                'metadata.poi': {
                    $exists: false
                }
            })
            .sort({ uploadDate: -1 })
            .toArray(function(err, files) {
                for (var i = 0; i < files.length; i++) {
                    var filedata = files[i]
                    filedata.typeLabel = 'Image'
                    filedata.label = filedata.filename
                    filedata.status = filedata.metadata.status
                    if (filedata.metadata.owner && filedata.metadata.owner.toString() == req.user._id.toString()) {
                        filedata.readonly = "readwrite"
                    } else {
                        filedata.readonly = "readonly"
                    }
                }

                res.send(files);
            })
        } else {
            res.send({
                success: false,
                message: 'User not authenticated'
            })
        }
    });


    /*
    Getting file by id, either the complete file (not a range request, in else), or 
    a partial content (for video/audio streaming)
    */
    app.get('/file/:id', function(req, res) {
        if (req.headers.range) {
            gfs.findOne({
                _id: req.params.id
            }, function(err, file) {
                if (!file) {
                    res.send({
                        success: false
                    });
                    return;
                }
                var parts = req.headers['range'].replace(/bytes=/, '').split('-');
                var partialstart = parts[0];
                var partialend = parts[1];

                var start = parseInt(partialstart, 10);
                var end = partialend ? parseInt(partialend, 10) : file.length - 1;
                var chunksize = (end - start) + 1;
                res.status(206)
                res.set({
                    'Content-Range': 'bytes ' + start + '-' + end + '/' + file.length,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': file.contentType,
                });

                var readstream = gfs.createReadStream({
                    _id: req.params.id,
                    range: {
                        startPos: start,
                        endPos: end
                    }
                });

                req.on('error', function(err) {
                    res.send(500, err);
                });
                readstream.on('error', function(err) {
                    res.send(500, err);
                });
                readstream.pipe(res);
            });

        } else {


            gfs.findOne({
                _id: req.params.id
            }, function(err, file) {
                if (!file) {
                    res.send({
                        success: false
                    });
                    return;
                }

                var readstream = gfs.createReadStream({
                    _id: req.params.id
                });
                res.set('Content-Type', file.contentType);
                res.set('Content-Length', file.length);

                req.on('error', function(err) {
                    res.send(500, err);
                });
                readstream.on('error', function(err) {
                    res.send(500, err);
                });
                readstream.pipe(res);
            });



        }
    });

    app.put('/file/:id/share', function(req, res) {
        if (!req.isAuthenticated()) {
            res.send({
                success: false,
                message: "Please authenticate"
            });
            return;
        }
        switchStatus(req, res);

    })


    var switchStatus = function(req, res) {
        var objectId = mongoose.Types.ObjectId(req.params.id)
        console.log(objectId)
        gfs.files.findOne({ _id: objectId }, function(err, resp) {
            if (!err) {
                if (req.user._id == resp.metadata.owner) {
                    if (resp.metadata.status == "Public") { resp.metadata.status = "Private" } else {
                        resp.metadata.status = "Public"
                    }
                    gfs.files.save(resp, function(err) {
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

}