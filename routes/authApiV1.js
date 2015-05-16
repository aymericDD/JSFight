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

router.route('/logout')
    .all(ensureAuthenticated)
    .get(function (req, res) {
        req.logout();
        return res.sendStatus(204);
    });

router.route('/login')
    .post(function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                return next(err);
            }

            if (!user) {
                return res.status(403).json(info);
            }

            req.login(user, function (err) {
                if (err) {
                    return next(err);
                }
                return res.json({
                    username: user.username,
                    nbParts: user.nbParts,
                    nbWins: user.nbWins,
                    nbLoss: user.nbLoss,
                    id: user.id
                });
            });
        })(req, res, next);
    });

router.route('/me')
    .all(ensureAuthenticated)
    .get(function (req, res) {
        return res.json({
            username: req.user.username,
            nbParts: req.user.nbParts,
            nbWins: req.user.nbWins,
            nbLoss: req.user.nbLoss,
            id: req.user.id
        });
    });

router.route('/register')
    .post(function (req, res, next) {
        var user = new models.User(req.body);

        if(user.password !== req.body.passwordCheck){
            return res.status(40).json({
                error: "PASSWORD_NOT_EQUALS"
            })
        }

        if(user.password === null || typeof user.password === 'undefined'){
            return res.status(40).json({
                error: "PASSWORD_CANT_BE_EMPTY"
            })
        }

        models.User.findOne({username: user.username}, function (err, existingUser) {
            if (err) {
                return next(err);
            }

            if (existingUser) {
                return res.status(40).json({
                    error: "USERNAME_ALREADY_TAKEN"
                });
            }

            user.hashString(user.password, function (err, result) {
                if (err) {
                    return next(err);
                }

                user.password = result;

                user.save(function (err, user) {
                    if (err || !user) {
                        return res.sendStatus(401);
                    }
                    req.login(user, function (err) {
                        if (err) {
                            return res.sendStatus(500);
                        }

                        return res.json({
                            username: user.username,
                            nbParts: user.nbParts,
                            nbWins: user.nbWins,
                            nbLoss: user.nbLoss,
                            id: user.id
                        });
                    });
                });
            });
        });
    });

module.exports = router;