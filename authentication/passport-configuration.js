"use strict";

var passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy,
    models = require('../models');

passport.use(new LocalStrategy(
    function (username, password, done) {
        models.User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { error: 'INVALID_USERNAME' });
            }
            user.checkPassword(password, function (err, result) {
                if (err || !result) {
                    return done(null, false, { error: 'INVALID_PASSWORD' });
                }

                return done(null, user);
            });
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    models.User.findById(id, function (err, user) {
        done(err, user);
    });
});