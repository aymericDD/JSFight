"use strict";

var mongoose = require("mongoose"),
    Schema = mongoose.Schema,
    messageSchema = new Schema({
        username: String,
        message: String,
        timestamp: Date
    });

module.exports = mongoose.model('Message', messageSchema);