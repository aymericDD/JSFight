"use strict";

var mongoose = require("mongoose"),
    bcrypt = require("bcrypt-nodejs"),
    Schema = mongoose.Schema,
    userSchema = new Schema({
        username: {type: String, index: true, required: true},
        password: {type: String, required: true},
        nbParts: {type: Number, default: 0},
        nbWins: {type: Number, default: 0},
        nbLoss: {type: Number, default: 0}
    });

userSchema.methods.hashString = function (password, next) {
    bcrypt.hash(password, null, null, function (err, hash) {
        if (err) {
            next(err, null);
        }

        next(null, hash);
    });
};

userSchema.methods.checkPassword = function (password, next) {
    bcrypt.compare(password, this.password, function (err, result) {
        if (err) {
            next(err, null);
        }
        next(null, result);
    });
};

module.exports = mongoose.model('User', userSchema);