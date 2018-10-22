module.exports = {

     switchStatus : function (model, req, res) {
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
}