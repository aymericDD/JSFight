"use strict";

var models = require('../models'),
    users = [],
    usersName = [];

module.exports = function (io) {
    io.on('connection', function (socket) {
        var id,
            username;

        users.push(socket);
        id = users.indexOf(socket);

        /**
         * Emit event USERNAME_REQUIRED for login user into chat
         */
        socket.emit("USERNAME_REQUIRED");


        /**
         * Listen event on USERNAME_CHOSEN for save username and return messages, users online and emmet in broadcast the new user connected
         */
        socket.on('USERNAME_CHOSEN', function (newUsername) {

            if (newUsername && newUsername !== "") {

                if(usersName.indexOf(newUsername.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')) == -1) {
                    username = newUsername.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
                    usersName.push(username);
                }

                models.Message.find({}, function (err, messages) {
                    if (err) {
                        throw err;
                    }

                    socket.emit("USERNAME_ACCEPTED", messages, usersName);
                    socket.broadcast.emit("NEW_USER", username);
                });
            }
        });

        /**
         * Send a message and register it into databases
         */
        socket.on('SEND_MESSAGE', function (message) {
            if (username && username !== "") {
                var messageObject = new models.Message({
                    username: username,
                    message: message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
                    timestamp: new Date().getTime()
                });

                messageObject.save(function (err, newMessage) {
                    if (err) {
                        throw err;
                    }

                    io.emit("NEW_MESSAGE", newMessage);
                });
            }
        });

        /**
         * When user is disconnected, remove socket id in users list,
         * remove userName in usersName list
         * and emit event USER_DISCONNECTED for users online
         */
        socket.on('disconnect', function () {

            if(typeof username !== 'undefined') {
                users.splice(id, 1);
                usersName.splice(usersName.indexOf(username), 1);
                io.emit("USER_DISCONNECTED", username);
            }

        });
    });
};