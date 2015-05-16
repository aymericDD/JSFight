"use strict";

var express = require('express'),
    router = express.Router(),
    passport = require("passport"),
    models = require('../models');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.sendStatus(401);
}

router.route('/:id')
    .all(ensureAuthenticated)
    .all(function (req, res, next) {
        var id = req.params.id;

        models.User.findById(id, function (err, user) {
            if (err) {
                throw err;
            }

            if (!user) {
                return res.sendStatus(404);
            }

            req.user = user;
            return next();
        });
    })
    .put(function (req, res, next) {

        if (req.body.username && req.body.username !== "") {
            req.user.username = req.body.username;
        }

        if (req.body.nbParts && req.body.nbParts !== "") {
            req.user.nbParts = req.body.nbParts;
        }

        if (req.body.nbLoss && req.body.nbLoss !== "") {
            req.user.nbLoss = req.body.nbLoss;
        }

        if (req.body.nbWins && req.body.nbWins !== "") {
            req.user.nbWins = req.body.nbWins;
        }

        req.user.save(function (err, user){
            if (err) {
                return next(err);
            }

            if(user) {
                return res.json({
                    username: user.username,
                    nbParts: user.nbParts,
                    nbWins: user.nbWins,
                    nbLoss: user.nbLoss,
                    id: user.id
                });
            }
        });

    });


module.exports = router;